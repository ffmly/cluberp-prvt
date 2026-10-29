"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { currentUserHasPermission } from "@/features/authorization/permissions";
import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import { organizationUnitFormSchema } from "./schemas";
import type {
  OrganizationUnitActionState,
  OrganizationUnitField,
} from "./state";

type FieldErrorCopy = Record<OrganizationUnitField, string>;

function getFormLocale(formData: FormData) {
  const value = formData.get("locale");
  return isAppLocale(value) ? value : defaultLocale;
}

function toFieldErrors(
  issues: { path: PropertyKey[] }[],
  copy: FieldErrorCopy,
): OrganizationUnitActionState["fieldErrors"] {
  const fieldErrors: NonNullable<
    OrganizationUnitActionState["fieldErrors"]
  > = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === "string" && field in copy) {
      const organizationField = field as OrganizationUnitField;
      fieldErrors[organizationField] ??= copy[organizationField];
    }
  }

  return fieldErrors;
}

export async function saveOrganizationUnitAction(
  _previousState: OrganizationUnitActionState,
  formData: FormData,
): Promise<OrganizationUnitActionState> {
  const locale = getFormLocale(formData);
  const t = await getTranslations({
    locale,
    namespace: "UniversityOrganization",
  });
  const parsed = organizationUnitFormSchema.safeParse({
    address: formData.get("address") ?? "",
    code: formData.get("code"),
    intent: formData.get("intent"),
    name: formData.get("name"),
    parentId: formData.get("parentId"),
    status: formData.get("status"),
    unitId: formData.get("unitId"),
    unitType: formData.get("unitType"),
    universityId: formData.get("universityId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t("errors.checkFields"),
      fieldErrors: toFieldErrors(parsed.error.issues, {
        address: t("errors.addressInvalid"),
        code: t("errors.codeInvalid"),
        name: t("errors.nameInvalid"),
        parentId: t("errors.parentRequired"),
        status: t("errors.statusInvalid"),
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
    "university.units_manage",
    { id: values.universityId, type: "university" },
  );

  if (!permission.allowed) {
    return { status: "error", message: t("errors.notAuthorized") };
  }

  const archivedAt =
    values.status === "archived" ? new Date().toISOString() : null;
  let operationError: { code?: string } | null = null;

  if (values.intent === "create") {
    if (values.unitType === "campus") {
      const { error } = await supabase.from("campuses").insert({
        address: values.address ?? null,
        archived_at: archivedAt,
        code: values.code,
        created_by: userId,
        name: values.name,
        status: values.status,
        university_id: values.universityId,
      });
      operationError = error;
    } else if (values.unitType === "faculty" && values.parentId) {
      const { error } = await supabase.from("faculties").insert({
        archived_at: archivedAt,
        campus_id: values.parentId,
        code: values.code,
        created_by: userId,
        name: values.name,
        status: values.status,
        university_id: values.universityId,
      });
      operationError = error;
    } else if (values.unitType === "department" && values.parentId) {
      const { error } = await supabase.from("departments").insert({
        archived_at: archivedAt,
        code: values.code,
        created_by: userId,
        faculty_id: values.parentId,
        name: values.name,
        status: values.status,
        university_id: values.universityId,
      });
      operationError = error;
    }
  } else if (values.unitId) {
    if (values.unitType === "campus") {
      const { data: current, error: readError } = await supabase
        .from("campuses")
        .select("archived_at")
        .eq("id", values.unitId)
        .eq("university_id", values.universityId)
        .maybeSingle();
      const preservedArchivedAt =
        values.status === "archived"
          ? (current?.archived_at ?? archivedAt)
          : null;
      const { data, error } = readError
        ? { data: null, error: readError }
        : await supabase
            .from("campuses")
            .update({
              address: values.address ?? null,
              archived_at: preservedArchivedAt,
              code: values.code,
              name: values.name,
              status: values.status,
            })
            .eq("id", values.unitId)
            .eq("university_id", values.universityId)
            .select("id")
            .maybeSingle();
      operationError = error ?? (data ? null : { code: "not_found" });
    } else if (values.unitType === "faculty" && values.parentId) {
      const { data: current, error: readError } = await supabase
        .from("faculties")
        .select("archived_at")
        .eq("id", values.unitId)
        .eq("university_id", values.universityId)
        .maybeSingle();
      const preservedArchivedAt =
        values.status === "archived"
          ? (current?.archived_at ?? archivedAt)
          : null;
      const { data, error } = readError
        ? { data: null, error: readError }
        : await supabase
            .from("faculties")
            .update({
              archived_at: preservedArchivedAt,
              campus_id: values.parentId,
              code: values.code,
              name: values.name,
              status: values.status,
            })
            .eq("id", values.unitId)
            .eq("university_id", values.universityId)
            .select("id")
            .maybeSingle();
      operationError = error ?? (data ? null : { code: "not_found" });
    } else if (values.unitType === "department" && values.parentId) {
      const { data: current, error: readError } = await supabase
        .from("departments")
        .select("archived_at")
        .eq("id", values.unitId)
        .eq("university_id", values.universityId)
        .maybeSingle();
      const preservedArchivedAt =
        values.status === "archived"
          ? (current?.archived_at ?? archivedAt)
          : null;
      const { data, error } = readError
        ? { data: null, error: readError }
        : await supabase
            .from("departments")
            .update({
              archived_at: preservedArchivedAt,
              code: values.code,
              faculty_id: values.parentId,
              name: values.name,
              status: values.status,
            })
            .eq("id", values.unitId)
            .eq("university_id", values.universityId)
            .select("id")
            .maybeSingle();
      operationError = error ?? (data ? null : { code: "not_found" });
    }
  }

  if (operationError) {
    return {
      status: "error",
      message:
        operationError.code === "23505"
          ? t("errors.codeTaken")
          : t("errors.saveFailed"),
    };
  }

  revalidatePath(`/${locale}/admin/universities/${values.universityId}`);

  return {
    status: "success",
    message: values.intent === "create" ? t("created") : t("updated"),
  };
}
