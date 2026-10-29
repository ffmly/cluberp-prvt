"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { currentUserHasPermission } from "@/features/authorization/permissions";
import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import { staffAssignmentFormSchema } from "./schemas";
import type {
  StaffAssignmentActionState,
  StaffAssignmentField,
} from "./state";

type FieldErrorCopy = Record<StaffAssignmentField, string>;

function getFormLocale(formData: FormData) {
  const value = formData.get("locale");
  return isAppLocale(value) ? value : defaultLocale;
}

function toFieldErrors(
  issues: { path: PropertyKey[] }[],
  copy: FieldErrorCopy,
): StaffAssignmentActionState["fieldErrors"] {
  const fieldErrors: NonNullable<
    StaffAssignmentActionState["fieldErrors"]
  > = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === "string" && field in copy) {
      const staffField = field as StaffAssignmentField;
      fieldErrors[staffField] ??= copy[staffField];
    }
  }

  return fieldErrors;
}

export async function saveStaffAssignmentAction(
  _previousState: StaffAssignmentActionState,
  formData: FormData,
): Promise<StaffAssignmentActionState> {
  const locale = getFormLocale(formData);
  const t = await getTranslations({
    locale,
    namespace: "UniversityStaff",
  });
  const parsed = staffAssignmentFormSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    email: formData.get("email"),
    intent: formData.get("intent"),
    scopeId: formData.get("scopeId"),
    scopeType: formData.get("scopeType"),
    staffType: formData.get("staffType"),
    status: formData.get("status"),
    title: formData.get("title") ?? "",
    universityId: formData.get("universityId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t("errors.checkFields"),
      fieldErrors: toFieldErrors(parsed.error.issues, {
        email: t("errors.emailInvalid"),
        scopeId: t("errors.scopeRequired"),
        scopeType: t("errors.scopeInvalid"),
        staffType: t("errors.staffTypeInvalid"),
        status: t("errors.statusInvalid"),
        title: t("errors.titleInvalid"),
      }),
    };
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return { status: "error", message: t("errors.sessionExpired") };
  }

  const values = parsed.data;
  const permission = await currentUserHasPermission(
    supabase,
    "university.staff_manage",
    { id: values.universityId, type: "university" },
  );

  if (!permission.allowed) {
    return { status: "error", message: t("errors.notAuthorized") };
  }

  let operationError: { code?: string } | null = null;

  if (values.intent === "create") {
    const { data: candidates, error: lookupError } = await supabase.rpc(
      "lookup_university_staff_candidate",
      {
        email_query: values.email,
        target_university_id: values.universityId,
      },
    );
    const candidate = candidates?.[0];

    if (lookupError) {
      return { status: "error", message: t("errors.saveFailed") };
    }

    if (!candidate) {
      return { status: "error", message: t("errors.userNotFound") };
    }

    const { error } = await supabase
      .from("university_staff_assignments")
      .insert({
        assigned_by: userId,
        campus_id:
          values.scopeType === "campus" ? (values.scopeId ?? null) : null,
        department_id:
          values.scopeType === "department" ? (values.scopeId ?? null) : null,
        faculty_id:
          values.scopeType === "faculty" ? (values.scopeId ?? null) : null,
        scope_type: values.scopeType,
        staff_type: values.staffType,
        status: values.status,
        title: values.title ?? null,
        university_id: values.universityId,
        user_id: candidate.user_id,
      });
    operationError = error;
  } else {
    const endsAt =
      values.status === "ended" ? new Date().toISOString() : null;
    const { data, error } = await supabase
      .from("university_staff_assignments")
      .update({
        ends_at: endsAt,
        staff_type: values.staffType,
        status: values.status,
        title: values.title ?? null,
      })
      .eq("id", values.assignmentId)
      .eq("university_id", values.universityId)
      .select("id")
      .maybeSingle();

    operationError = error ?? (data ? null : { code: "not_found" });
  }

  if (operationError) {
    return {
      status: "error",
      message:
        operationError.code === "23505"
          ? t("errors.duplicateAssignment")
          : t("errors.saveFailed"),
    };
  }

  revalidatePath(`/${locale}/admin/universities/${values.universityId}/staff`);

  return {
    status: "success",
    message: values.intent === "create" ? t("created") : t("updated"),
  };
}
