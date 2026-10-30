"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { currentUserHasPermission } from "@/features/authorization/permissions";
import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import {
  roleAssignmentSchema,
  roleFormSchema,
  roleLifecycleSchema,
} from "./schemas";
import type { RoleActionState } from "./state";

function getLocale(formData: FormData) {
  const locale = formData.get("locale");
  return isAppLocale(locale) ? locale : defaultLocale;
}

async function getAuthorizedContext(formData: FormData) {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "RoleAdministration" });
  const supabase = await createClient();
  const permission = await currentUserHasPermission(
    supabase,
    "platform.roles_manage",
    { type: "platform" },
  );
  return { locale, permission, supabase, t };
}

export async function saveRoleAction(
  _state: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const context = await getAuthorizedContext(formData);
  const parsed = roleFormSchema.safeParse({
    description: formData.get("description") ?? "",
    key: formData.get("key"),
    name: formData.get("name"),
    permissionKeys: formData.getAll("permissionKeys"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) return { message: context.t("errors.checkFields"), status: "error" };
  if (!context.permission.allowed) return { message: context.t("errors.notAuthorized"), status: "error" };

  const targetRoleId = parsed.data.roleId ?? null;
  const { error } = await context.supabase.rpc("save_platform_role", {
    requested_permission_keys: parsed.data.permissionKeys,
    role_description: parsed.data.description ?? "",
    role_key: parsed.data.key,
    role_name: parsed.data.name,
    // PostgreSQL accepts NULL to select create mode; generated function inputs
    // do not currently preserve parameter nullability.
    target_role_id: targetRoleId as unknown as string,
  });
  if (error) return { message: error.code === "23505" ? context.t("errors.keyTaken") : context.t("errors.saveFailed"), status: "error" };
  revalidatePath(`/${context.locale}/admin/roles`);
  revalidatePath(`/${context.locale}/admin/audit`);
  return { message: parsed.data.roleId ? context.t("updated") : context.t("created"), status: "success" };
}

export async function assignRoleAction(
  _state: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const context = await getAuthorizedContext(formData);
  const parsed = roleAssignmentSchema.safeParse({ roleId: formData.get("roleId"), userId: formData.get("userId") });
  if (!parsed.success) return { message: context.t("errors.checkFields"), status: "error" };
  if (!context.permission.allowed) return { message: context.t("errors.notAuthorized"), status: "error" };
  const { error } = await context.supabase.rpc("assign_platform_role", {
    target_role_id: parsed.data.roleId,
    target_user_id: parsed.data.userId,
  });
  if (error) return { message: error.code === "23505" ? context.t("errors.duplicateAssignment") : context.t("errors.assignFailed"), status: "error" };
  revalidatePath(`/${context.locale}/admin/roles`);
  revalidatePath(`/${context.locale}/admin/audit`);
  return { message: context.t("assigned"), status: "success" };
}

export async function changeRoleLifecycleAction(
  _state: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const context = await getAuthorizedContext(formData);
  const parsed = roleLifecycleSchema.safeParse({ intent: formData.get("intent"), reason: formData.get("reason"), targetId: formData.get("targetId") });
  if (!parsed.success) return { message: context.t("errors.reasonInvalid"), status: "error" };
  if (!context.permission.allowed) return { message: context.t("errors.notAuthorized"), status: "error" };
  const result = parsed.data.intent === "archive"
    ? await context.supabase.rpc("archive_platform_role", { reason: parsed.data.reason, target_role_id: parsed.data.targetId })
    : await context.supabase.rpc("revoke_platform_role_assignment", { reason: parsed.data.reason, target_assignment_id: parsed.data.targetId });
  if (result.error) return { message: context.t("errors.lifecycleFailed"), status: "error" };
  revalidatePath(`/${context.locale}/admin/roles`);
  revalidatePath(`/${context.locale}/admin/audit`);
  return { message: parsed.data.intent === "archive" ? context.t("archived") : context.t("revoked"), status: "success" };
}
