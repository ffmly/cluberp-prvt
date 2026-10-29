"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getPublicEnvironment } from "@/lib/env/public";
import { createClient } from "@/lib/supabase/server";

import { signInSchema, signUpSchema } from "./schemas";
import type { AuthActionState } from "./state";

function toFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): AuthActionState["fieldErrors"] {
  const fieldErrors: NonNullable<AuthActionState["fieldErrors"]> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (
      (field === "displayName" || field === "email" || field === "password") &&
      !fieldErrors[field]
    ) {
      fieldErrors[field] = issue.message;
    }
  }

  return fieldErrors;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: "The email or password is incorrect, or the account is unavailable.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  const environment = getPublicEnvironment();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: new URL("/auth/callback", environment.appUrl).toString(),
    },
  });

  if (error) {
    return {
      status: "error",
      message: "We could not create the account. Try again in a moment.",
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    status: "success",
    message: "Check your inbox to confirm your email before signing in.",
  };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
