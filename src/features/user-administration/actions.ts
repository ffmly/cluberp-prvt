"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { currentUserHasPermission } from "@/features/authorization/permissions";
import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import { userStatusFormSchema } from "./schemas";
import type { UserStatusActionState } from "./state";

export async function setUserStatusAction(
  _previousState: UserStatusActionState,
  formData: FormData,
): Promise<UserStatusActionState> {
  const localeValue = formData.get("locale");
  const locale = isAppLocale(localeValue) ? localeValue : defaultLocale;
  const t = await getTranslations({ locale, namespace: "UserAdministration" });
  const parsed = userStatusFormSchema.safeParse({
    newStatus: formData.get("newStatus"),
    reason: formData.get("reason"),
    targetUserId: formData.get("targetUserId"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: { reason: t("errors.reasonInvalid") },
      message: t("errors.checkFields"),
      status: "error",
    };
  }

  const supabase = await createClient();
  const permission = await currentUserHasPermission(
    supabase,
    "platform.users_manage",
    { type: "platform" },
  );

  if (!permission.allowed) {
    return { message: t("errors.notAuthorized"), status: "error" };
  }

  const { error } = await supabase.rpc("set_user_account_status", {
    new_status: parsed.data.newStatus,
    reason: parsed.data.reason,
    target_user_id: parsed.data.targetUserId,
  });

  if (error) {
    return {
      message:
        error.code === "42501"
          ? t("errors.protectedAccount")
          : error.code === "22023"
            ? t("errors.invalidTransition")
            : t("errors.saveFailed"),
      status: "error",
    };
  }

  revalidatePath(`/${locale}/admin/users`);
  revalidatePath(`/${locale}/admin/audit`);
  return {
    message:
      parsed.data.newStatus === "suspended" ? t("suspended") : t("reactivated"),
    status: "success",
  };
}
