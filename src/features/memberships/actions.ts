"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import {
  applicationIdSchema,
  invitationIdSchema,
  invitationSchema,
  invitationTokenSchema,
  membershipApplicationSchema,
  membershipApplicationTransitionSchema,
  membershipStatusSchema,
  resignMembershipSchema,
} from "./schemas";
import type { MembershipActionState } from "./state";

function getLocale(formData: FormData) {
  const locale = formData.get("locale");
  return isAppLocale(locale) ? locale : defaultLocale;
}

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return { authenticated: !error && Boolean(data?.claims?.sub), supabase };
}

function membershipPaths(locale: string, clubId?: string) {
  const paths = [`/${locale}/dashboard/discover`, `/${locale}/dashboard/memberships`];
  if (clubId) paths.push(`/${locale}/dashboard/clubs/${clubId}/members`);
  return paths;
}

function revalidateMembershipPaths(locale: string, clubId?: string) {
  for (const path of membershipPaths(locale, clubId)) revalidatePath(path);
}

export async function submitMembershipApplicationAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "Memberships" });
  const parsed = membershipApplicationSchema.safeParse({
    applicationType: formData.get("applicationType"),
    clubId: formData.get("clubId"),
    interests: formData.get("interests") ?? "",
    membershipId: formData.get("membershipId"),
    motivation: formData.get("motivation"),
  });
  if (!parsed.success) return { message: t("errors.checkFields"), status: "error" };

  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("submit_membership_application", {
    answers: { interests: parsed.data.interests ?? "" },
    application_type: parsed.data.applicationType,
    motivation: parsed.data.motivation,
    target_club_id: parsed.data.clubId,
    target_membership_id: (parsed.data.membershipId ?? null) as unknown as string,
  });
  if (error) {
    return {
      message: error.code === "23505" ? t("errors.duplicateApplication") : t("errors.submitFailed"),
      status: "error",
    };
  }
  revalidateMembershipPaths(locale, parsed.data.clubId);
  return { message: t("applicationSubmitted"), status: "success" };
}

export async function withdrawMembershipApplicationAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "Memberships" });
  const parsed = applicationIdSchema.safeParse({ applicationId: formData.get("applicationId") });
  if (!parsed.success) return { message: t("errors.lifecycleFailed"), status: "error" };
  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("withdraw_membership_application", {
    target_application_id: parsed.data.applicationId,
  });
  if (error) return { message: t("errors.lifecycleFailed"), status: "error" };
  revalidateMembershipPaths(locale);
  return { message: t("applicationWithdrawn"), status: "success" };
}

export async function transitionMembershipApplicationAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "MembershipManagement" });
  const parsed = membershipApplicationTransitionSchema.safeParse({
    applicationId: formData.get("applicationId"),
    clubId: formData.get("clubId"),
    newStatus: formData.get("newStatus"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) return { message: t("errors.checkFields"), status: "error" };
  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("transition_membership_application", {
    new_status: parsed.data.newStatus,
    reason: parsed.data.reason,
    target_application_id: parsed.data.applicationId,
  });
  if (error) return { message: t("errors.transitionFailed"), status: "error" };
  revalidateMembershipPaths(locale, parsed.data.clubId);
  return { message: t(`success.${parsed.data.newStatus}`), status: "success" };
}

export async function transitionMembershipStatusAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "MembershipManagement" });
  const parsed = membershipStatusSchema.safeParse({
    clubId: formData.get("clubId"),
    membershipId: formData.get("membershipId"),
    newStatus: formData.get("newStatus"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { message: t("errors.checkFields"), status: "error" };
  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("transition_membership_status", {
    new_status: parsed.data.newStatus,
    reason: parsed.data.reason,
    target_membership_id: parsed.data.membershipId,
  });
  if (error) return { message: t("errors.transitionFailed"), status: "error" };
  revalidateMembershipPaths(locale, parsed.data.clubId);
  return { message: t("memberUpdated"), status: "success" };
}

export async function resignMembershipAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "Memberships" });
  const parsed = resignMembershipSchema.safeParse({
    membershipId: formData.get("membershipId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { message: t("errors.reasonInvalid"), status: "error" };
  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("resign_membership", {
    reason: parsed.data.reason,
    target_membership_id: parsed.data.membershipId,
  });
  if (error) return { message: t("errors.lifecycleFailed"), status: "error" };
  revalidateMembershipPaths(locale);
  return { message: t("membershipResigned"), status: "success" };
}

export async function createClubInvitationAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "MembershipManagement" });
  const parsed = invitationSchema.safeParse({
    clubId: formData.get("clubId"),
    email: formData.get("email"),
  });
  if (!parsed.success) return { message: t("errors.emailInvalid"), status: "error" };
  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.rpc("create_club_invitation", {
    expires_at: expiresAt,
    raw_token: token,
    recipient_email: parsed.data.email,
    target_club_id: parsed.data.clubId,
  });
  if (error) {
    return {
      message: error.code === "23505" ? t("errors.invitationDuplicate") : t("errors.invitationFailed"),
      status: "error",
    };
  }
  revalidateMembershipPaths(locale, parsed.data.clubId);
  return {
    invitationPath: `/${locale}/dashboard/memberships?invitation=${token}`,
    message: t("invitationCreated"),
    status: "success",
  };
}

export async function acceptClubInvitationAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "Memberships" });
  const parsed = invitationTokenSchema.safeParse({ token: formData.get("token") });
  if (!parsed.success) return { message: t("errors.invitationInvalid"), status: "error" };
  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("accept_club_invitation", { raw_token: parsed.data.token });
  if (error) return { message: t("errors.invitationInvalid"), status: "error" };
  revalidateMembershipPaths(locale);
  return { message: t("invitationAccepted"), status: "success" };
}

export async function revokeClubInvitationAction(
  _state: MembershipActionState,
  formData: FormData,
): Promise<MembershipActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "MembershipManagement" });
  const parsed = invitationIdSchema.safeParse({
    clubId: formData.get("clubId"),
    invitationId: formData.get("invitationId"),
  });
  if (!parsed.success) return { message: t("errors.invitationFailed"), status: "error" };
  const { authenticated, supabase } = await getAuthenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("revoke_club_invitation", {
    target_invitation_id: parsed.data.invitationId,
  });
  if (error) return { message: t("errors.invitationFailed"), status: "error" };
  revalidateMembershipPaths(locale, parsed.data.clubId);
  return { message: t("invitationRevoked"), status: "success" };
}
