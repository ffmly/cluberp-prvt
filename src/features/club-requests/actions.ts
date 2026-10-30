"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import { clubRequestSchema, clubRequestTransitionSchema } from "./schemas";
import type { ClubRequestActionState } from "./state";

function getLocale(formData: FormData) {
  const value = formData.get("locale");
  return isAppLocale(value) ? value : defaultLocale;
}

export async function submitClubRequestAction(
  _state: ClubRequestActionState,
  formData: FormData,
): Promise<ClubRequestActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "ClubRequests" });
  const parsed = clubRequestSchema.safeParse({
    clubId: formData.get("clubId"), description: formData.get("description") ?? "",
    name: formData.get("name"), requestType: formData.get("requestType"),
    slug: formData.get("slug"), universityId: formData.get("universityId"),
  });
  if (!parsed.success) return { message: t("errors.checkFields"), status: "error" };
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return { message: t("errors.sessionExpired"), status: "error" };
  const clubId = parsed.data.clubId ?? null;
  const { error } = await supabase.rpc("submit_club_request", {
    proposed_description: parsed.data.description ?? "",
    proposed_name: parsed.data.name,
    proposed_slug: parsed.data.slug,
    request_type: parsed.data.requestType,
    target_club_id: clubId as unknown as string,
    target_university_id: parsed.data.universityId,
  });
  if (error) return { message: error.code === "23505" ? t("errors.duplicate") : t("errors.submitFailed"), status: "error" };
  revalidatePath(`/${locale}/dashboard/club-requests`);
  revalidatePath(`/${locale}/admin/clubs`);
  return { message: t("submitted"), status: "success" };
}

export async function transitionClubRequestAction(
  _state: ClubRequestActionState,
  formData: FormData,
): Promise<ClubRequestActionState> {
  const locale = getLocale(formData);
  const t = await getTranslations({ locale, namespace: "ClubReview" });
  const parsed = clubRequestTransitionSchema.safeParse({
    newStatus: formData.get("newStatus"), reason: formData.get("reason") ?? "",
    requestId: formData.get("requestId"),
  });
  if (!parsed.success) return { message: t("errors.checkFields"), status: "error" };
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_club_request", {
    new_status: parsed.data.newStatus,
    reason: parsed.data.reason,
    target_request_id: parsed.data.requestId,
  });
  if (error) return { message: error.code === "22023" ? t("errors.invalidTransition") : t("errors.transitionFailed"), status: "error" };
  revalidatePath(`/${locale}/admin/clubs`);
  revalidatePath(`/${locale}/dashboard/club-requests`);
  return { message: t(`success.${parsed.data.newStatus}`), status: "success" };
}
