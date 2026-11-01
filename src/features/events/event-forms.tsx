"use client";

import { useActionState } from "react";

import type { AppLocale } from "@/i18n/locales";

import { cancelEventRegistrationAction, markAttendanceAction, registerForEventAction, saveEventAction, transitionEventAction } from "./actions";
import { initialEventActionState } from "./state";

export type EventCopy = {
  attendance: string; cancel: string; cancelling: string; capacity: string; description: string;
  eligibility: string; eligibilityActive: string; eligibilityAuthenticated: string; endsAt: string;
  event: string; location: string; mark: string; reason: string; register: string; registering: string;
  registrationDeadline: string; save: string; saving: string; startsAt: string; title: string;
  transition: Record<string, string>; type: string; visibility: string; visibilityMembers: string;
  visibilityPublic: string; workshop: string;
};

function Feedback({ message, status }: { message?: string; status: string }) {
  if (!message) return null;
  return <p className={`rounded-xl border px-4 py-3 text-sm ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`} role={status === "error" ? "alert" : "status"}>{message}</p>;
}

function dateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value); const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function EventForm({ clubId, copy, event, locale }: { clubId: string; copy: EventCopy; locale: AppLocale; event?: { id: string; title: string; description: string; eventType: string; location: string; startsAt: string; endsAt: string; registrationDeadline: string; capacity: number | null; visibility: string; eligibility: string } }) {
  const [state, action, pending] = useActionState(saveEventAction, initialEventActionState);
  const field = "h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm";
  return <form action={action} className="grid gap-4 md:grid-cols-2">
    <input name="clubId" type="hidden" value={clubId} /><input name="eventId" type="hidden" value={event?.id ?? ""} /><input name="locale" type="hidden" value={locale} />
    <label className="text-sm font-semibold">{copy.title}<input className={`${field} mt-2`} defaultValue={event?.title} maxLength={180} minLength={3} name="title" required /></label>
    <label className="text-sm font-semibold">{copy.location}<input className={`${field} mt-2`} defaultValue={event?.location} maxLength={300} minLength={2} name="location" required /></label>
    <label className="text-sm font-semibold md:col-span-2">{copy.description}<textarea className="mt-2 min-h-28 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm" defaultValue={event?.description} maxLength={8000} minLength={10} name="description" required /></label>
    <label className="text-sm font-semibold">{copy.type}<select className={`${field} mt-2`} defaultValue={event?.eventType ?? "event"} name="eventType"><option value="event">{copy.event}</option><option value="workshop">{copy.workshop}</option></select></label>
    <label className="text-sm font-semibold">{copy.capacity}<input className={`${field} mt-2`} defaultValue={event?.capacity ?? ""} max={100000} min={1} name="capacity" type="number" /></label>
    <label className="text-sm font-semibold">{copy.startsAt}<input className={`${field} mt-2`} defaultValue={dateTimeLocal(event?.startsAt)} name="startsAt" required type="datetime-local" /></label>
    <label className="text-sm font-semibold">{copy.endsAt}<input className={`${field} mt-2`} defaultValue={dateTimeLocal(event?.endsAt)} name="endsAt" required type="datetime-local" /></label>
    <label className="text-sm font-semibold">{copy.registrationDeadline}<input className={`${field} mt-2`} defaultValue={dateTimeLocal(event?.registrationDeadline)} name="registrationDeadline" required type="datetime-local" /></label>
    <label className="text-sm font-semibold">{copy.visibility}<select className={`${field} mt-2`} defaultValue={event?.visibility ?? "public"} name="visibility"><option value="public">{copy.visibilityPublic}</option><option value="members">{copy.visibilityMembers}</option></select></label>
    <label className="text-sm font-semibold">{copy.eligibility}<select className={`${field} mt-2`} defaultValue={event?.eligibility ?? "authenticated"} name="eligibility"><option value="authenticated">{copy.eligibilityAuthenticated}</option><option value="active_members">{copy.eligibilityActive}</option></select></label>
    <div className="space-y-3 md:col-span-2"><Feedback message={state.message} status={state.status} /><button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? copy.saving : copy.save}</button></div>
  </form>;
}

export function EventTransitionForm({ clubId, copy, eventId, locale, nextStatuses }: { clubId: string; copy: EventCopy; eventId: string; locale: AppLocale; nextStatuses: string[] }) {
  const [state, action, pending] = useActionState(transitionEventAction, initialEventActionState);
  const needsReason = nextStatuses.some((status) => status === "draft" || status === "cancelled");
  return <form action={action} className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
    <input name="clubId" type="hidden" value={clubId} /><input name="eventId" type="hidden" value={eventId} /><input name="locale" type="hidden" value={locale} />
    {needsReason ? <label className="block text-sm font-semibold">{copy.reason}<input className="mt-2 h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" minLength={5} name="reason" /></label> : <input name="reason" type="hidden" value="" />}
    <Feedback message={state.message} status={state.status} />
    <div className="flex flex-wrap gap-2">{nextStatuses.map((status) => <button className="min-h-10 rounded-xl border border-teal-200 px-4 text-sm font-semibold text-teal-800 disabled:opacity-50" disabled={pending} key={status} name="newStatus" type="submit" value={status}>{copy.transition[status]}</button>)}</div>
  </form>;
}

export function EventRegistrationForm({ copy, eventId, locale, registrationId, status }: { copy: EventCopy; eventId: string; locale: AppLocale; registrationId?: string; status?: string | null }) {
  const registerState = useActionState(registerForEventAction, initialEventActionState);
  const cancelState = useActionState(cancelEventRegistrationAction, initialEventActionState);
  if (registrationId && (status === "registered" || status === "waitlisted")) {
    const [state, action, pending] = cancelState;
    return <form action={action} className="mt-5 space-y-3"><input name="locale" type="hidden" value={locale} /><input name="registrationId" type="hidden" value={registrationId} /><Feedback message={state.message} status={state.status} /><button className="min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700" disabled={pending} type="submit">{pending ? copy.cancelling : copy.cancel}</button></form>;
  }
  if (status) return null;
  const [state, action, pending] = registerState;
  return <form action={action} className="mt-5 space-y-3"><input name="eventId" type="hidden" value={eventId} /><input name="locale" type="hidden" value={locale} /><Feedback message={state.message} status={state.status} /><button className="min-h-10 rounded-xl bg-[var(--brand-strong)] px-4 text-sm font-semibold text-white" disabled={pending} type="submit">{pending ? copy.registering : copy.register}</button></form>;
}

export function AttendanceForm({ clubId, copy, eventId, locale, registrationId }: { clubId: string; copy: EventCopy; eventId: string; locale: AppLocale; registrationId: string }) {
  const [state, action, pending] = useActionState(markAttendanceAction, initialEventActionState);
  return <form action={action} className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
    <input name="clubId" type="hidden" value={clubId} /><input name="eventId" type="hidden" value={eventId} /><input name="locale" type="hidden" value={locale} /><input name="registrationId" type="hidden" value={registrationId} />
    <select aria-label={copy.attendance} className="h-10 rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm" name="status"><option value="attended">Attended</option><option value="no_show">No show</option></select>
    <input aria-label={copy.reason} className="h-10 rounded-xl border border-[var(--border-subtle)] px-3 text-sm" minLength={5} name="reason" placeholder={copy.reason} required />
    <button className="min-h-10 rounded-xl border border-teal-200 px-4 text-sm font-semibold text-teal-800" disabled={pending} type="submit">{copy.mark}</button>
    <div className="sm:col-span-3"><Feedback message={state.message} status={state.status} /></div>
  </form>;
}
