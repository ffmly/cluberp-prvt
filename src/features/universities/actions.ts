"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { currentUserHasPermission } from "@/features/authorization/permissions";
import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import { universityFormSchema } from "./schemas";
import type { UniversityActionState, UniversityField } from "./state";

type FieldErrorCopy = Record<UniversityField, string>;

function getFormLocale(formData: FormData) {
  const value = formData.get("locale");
  return isAppLocale(value) ? value : defaultLocale;
}

function toFieldErrors(
  issues: { path: PropertyKey[] }[],
  copy: FieldErrorCopy,
): UniversityActionState["fieldErrors"] {
  const fieldErrors: NonNullable<UniversityActionState["fieldErrors"]> = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === "string" && field in copy) {
      const universityField = field as UniversityField;
      fieldErrors[universityField] ??= copy[universityField];
    }
  }

  return fieldErrors;
}

export async function saveUniversityAction(
  _previousState: UniversityActionState,
  formData: FormData,
): Promise<UniversityActionState> {
  const locale = getFormLocale(formData);
  const t = await getTranslations({
    locale,
    namespace: "UniversityAdministration",
  });
  const parsed = universityFormSchema.safeParse({
    intent: formData.get("intent"),
    universityId: formData.get("universityId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    status: formData.get("status"),
    defaultLocale: formData.get("defaultLocale"),
    defaultTimeZone: formData.get("defaultTimeZone"),
    defaultCurrency: formData.get("defaultCurrency"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t("errors.checkFields"),
      fieldErrors: toFieldErrors(parsed.error.issues, {
        name: t("errors.nameInvalid"),
        slug: t("errors.slugInvalid"),
        status: t("errors.statusInvalid"),
        defaultLocale: t("errors.localeInvalid"),
        defaultTimeZone: t("errors.timeZoneInvalid"),
        defaultCurrency: t("errors.currencyInvalid"),
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

  const permission = await currentUserHasPermission(
    supabase,
    "platform.universities_manage",
    { type: "platform" },
  );

  if (!permission.allowed) {
    return { status: "error", message: t("errors.notAuthorized") };
  }

  const values = parsed.data;
  const payload = {
    name: values.name,
    slug: values.slug,
    status: values.status,
    default_locale: values.defaultLocale,
    default_time_zone: values.defaultTimeZone,
    default_currency: values.defaultCurrency,
  };

  let operationError: { code?: string } | null = null;

  if (values.intent === "create") {
    const { error } = await supabase.from("universities").insert({
      ...payload,
      archived_at:
        values.status === "archived" ? new Date().toISOString() : null,
      created_by: userId,
    });
    operationError = error;
  } else {
    const { data: currentUniversity, error: readError } = await supabase
      .from("universities")
      .select("archived_at")
      .eq("id", values.universityId)
      .maybeSingle();

    if (readError || !currentUniversity) {
      return { status: "error", message: t("errors.saveFailed") };
    }

    const archivedAt =
      values.status === "archived"
        ? (currentUniversity.archived_at ?? new Date().toISOString())
        : null;
    const { data, error } = await supabase
      .from("universities")
      .update({ ...payload, archived_at: archivedAt })
      .eq("id", values.universityId)
      .select("id")
      .maybeSingle();

    operationError = error ?? (data ? null : { code: "not_found" });
  }

  if (operationError) {
    return {
      status: "error",
      message:
        operationError.code === "23505"
          ? t("errors.slugTaken")
          : t("errors.saveFailed"),
    };
  }

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/universities`);

  return {
    status: "success",
    message:
      values.intent === "create" ? t("created") : t("updated"),
  };
}
