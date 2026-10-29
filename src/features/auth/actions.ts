"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";
import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { getTranslations } from "next-intl/server";

type FieldErrorCopy = Record<"displayName" | "email" | "password", string>;

function getFormLocale(formData: FormData) {
  const value = formData.get("locale");
  return isAppLocale(value) ? value : defaultLocale;
}

import { signInSchema, signUpSchema } from "./schemas";
import type { AuthActionState } from "./state";

function toFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
  copy: FieldErrorCopy,
): AuthActionState["fieldErrors"] {
  const fieldErrors: NonNullable<AuthActionState["fieldErrors"]> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (
      (field === "displayName" || field === "email" || field === "password") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = copy[field];
    }
  }

  return fieldErrors;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = getFormLocale(formData);
  const t = await getTranslations({ locale, namespace: "Auth" });
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t("errors.checkFields"),
      fieldErrors: toFieldErrors(parsed.error.issues, {
        displayName: t("errors.displayNameInvalid"),
        email: t("errors.emailInvalid"),
        password: t("errors.passwordInvalid"),
      }),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: t("errors.invalidCredentials"),
    };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const locale = getFormLocale(formData);
  const t = await getTranslations({ locale, namespace: "Auth" });
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: t("errors.checkFields"),
      fieldErrors: toFieldErrors(parsed.error.issues, {
        displayName: t("errors.displayNameInvalid"),
        email: t("errors.emailInvalid"),
        password: t("errors.passwordInvalid"),
      }),
    };
  }

  const environment = getPublicEnvironment();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: new URL(
        `/${locale}/auth/callback`,
        environment.appUrl,
      ).toString(),
    },
  });

  if (error) {
    return {
      status: "error",
      message: t("errors.signUpFailed"),
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(`/${locale}/dashboard`);
  }

  return {
    status: "success",
    message: t("confirmationSent"),
  };
}

export async function signOutAction(formData: FormData): Promise<void> {
  const locale = getFormLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect(`/${locale}/login`);
}
