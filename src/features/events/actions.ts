"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { defaultLocale, isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

import { attendanceSchema, eventRegistrationCancellationSchema, eventRegistrationSchema, eventSchema, eventTransitionSchema } from "./schemas";
import type { EventActionState } from "./state";

function localeFrom(formData: FormData) {
  const locale = formData.get("locale");
  return isAppLocale(locale) ? locale : defaultLocale;
}

async function authenticatedClient() {
  const supabase = await createClient();
  const claims = await supabase.auth.getClaims();
  return { authenticated: Boolean(claims.data?.claims?.sub) && !claims.error, supabase };
}

function revalidateEvents(locale: string, clubId?: string) {
  revalidatePath(`/${locale}/dashboard/events`);
  if (clubId) revalidatePath(`/${locale}/dashboard/clubs/${clubId}/events`);
}

export async function saveEventAction(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const locale = localeFrom(formData);
  const t = await getTranslations({ locale, namespace: "EventManagement" });
  const parsed = eventSchema.safeParse({
    capacity: formData.get("capacity"), clubId: formData.get("clubId"), description: formData.get("description"),
    eligibility: formData.get("eligibility"), endsAt: formData.get("endsAt"), eventId: formData.get("eventId"),
    eventType: formData.get("eventType"), location: formData.get("location"), registrationDeadline: formData.get("registrationDeadline"),
    startsAt: formData.get("startsAt"), title: formData.get("title"), visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { message: t("errors.checkFields"), status: "error" };
  const { authenticated, supabase } = await authenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const values = parsed.data;
  const result = values.eventId
    ? await supabase.rpc("update_club_event", { target_event_id: values.eventId, event_title: values.title, event_description: values.description, event_type: values.eventType, event_location: values.location, starts_at: values.startsAt, ends_at: values.endsAt, registration_deadline: values.registrationDeadline, capacity: values.capacity as unknown as number, visibility: values.visibility, eligibility: values.eligibility })
    : await supabase.rpc("create_club_event", { target_club_id: values.clubId, event_title: values.title, event_description: values.description, event_type: values.eventType, event_location: values.location, starts_at: values.startsAt, ends_at: values.endsAt, registration_deadline: values.registrationDeadline, capacity: values.capacity as unknown as number, visibility: values.visibility, eligibility: values.eligibility });
  if (result.error) return { message: t("errors.saveFailed"), status: "error" };
  revalidateEvents(locale, values.clubId);
  return { message: t(values.eventId ? "updated" : "created"), status: "success" };
}

export async function transitionEventAction(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const locale = localeFrom(formData); const t = await getTranslations({ locale, namespace: "EventManagement" });
  const parsed = eventTransitionSchema.safeParse({ clubId: formData.get("clubId"), eventId: formData.get("eventId"), newStatus: formData.get("newStatus"), reason: formData.get("reason") ?? "" });
  if (!parsed.success) return { message: t("errors.transitionInvalid"), status: "error" };
  const { authenticated, supabase } = await authenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("transition_club_event", { target_event_id: parsed.data.eventId, new_status: parsed.data.newStatus, reason: parsed.data.reason || undefined });
  if (error) return { message: t("errors.transitionFailed"), status: "error" };
  revalidateEvents(locale, parsed.data.clubId);
  return { message: t(`success.${parsed.data.newStatus}`), status: "success" };
}

export async function registerForEventAction(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const locale = localeFrom(formData); const t = await getTranslations({ locale, namespace: "Events" });
  const parsed = eventRegistrationSchema.safeParse({ eventId: formData.get("eventId") });
  if (!parsed.success) return { message: t("errors.registerFailed"), status: "error" };
  const { authenticated, supabase } = await authenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { data, error } = await supabase.rpc("register_for_event", { target_event_id: parsed.data.eventId });
  if (error) return { message: error.code === "23505" ? t("errors.duplicate") : t("errors.registerFailed"), status: "error" };
  revalidateEvents(locale);
  return { message: t(data === "waitlisted" ? "waitlisted" : "registered"), status: "success" };
}

export async function cancelEventRegistrationAction(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const locale = localeFrom(formData); const t = await getTranslations({ locale, namespace: "Events" });
  const parsed = eventRegistrationCancellationSchema.safeParse({ registrationId: formData.get("registrationId") });
  if (!parsed.success) return { message: t("errors.cancelFailed"), status: "error" };
  const { authenticated, supabase } = await authenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("cancel_event_registration", { target_registration_id: parsed.data.registrationId });
  if (error) return { message: t("errors.cancelFailed"), status: "error" };
  revalidateEvents(locale); return { message: t("cancelled"), status: "success" };
}

export async function markAttendanceAction(_state: EventActionState, formData: FormData): Promise<EventActionState> {
  const locale = localeFrom(formData); const t = await getTranslations({ locale, namespace: "EventManagement" });
  const parsed = attendanceSchema.safeParse({ clubId: formData.get("clubId"), eventId: formData.get("eventId"), registrationId: formData.get("registrationId"), status: formData.get("status"), reason: formData.get("reason") });
  if (!parsed.success) return { message: t("errors.attendanceInvalid"), status: "error" };
  const { authenticated, supabase } = await authenticatedClient();
  if (!authenticated) return { message: t("errors.sessionExpired"), status: "error" };
  const { error } = await supabase.rpc("mark_event_attendance", { target_registration_id: parsed.data.registrationId, attendance_status: parsed.data.status, reason: parsed.data.reason });
  if (error) return { message: t("errors.attendanceFailed"), status: "error" };
  revalidateEvents(locale, parsed.data.clubId); return { message: t("attendanceUpdated"), status: "success" };
}
