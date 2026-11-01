import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { AttendanceForm, EventForm, EventTransitionForm, type EventCopy } from "@/features/events/event-forms";
import { currentUserHasPermission } from "@/features/authorization/permissions";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/clubs/[clubId]/events">): Promise<Metadata> {
  const { locale } = await params; if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "EventManagement" }); return { title: t("title") };
}

export default async function ClubEventsPage({ params }: PageProps<"/[locale]/dashboard/clubs/[clubId]/events">) {
  const { clubId, locale } = await params; if (!isAppLocale(locale)) notFound(); setRequestLocale(locale); await connection();
  const supabase = await createClient(); const claims = await supabase.auth.getClaims(); const userId = claims.data?.claims?.sub;
  if (!userId) redirect(`/${locale}/login`);
  const [t, workspaceResult, eventsResult, eventPermission] = await Promise.all([
    getTranslations({ locale, namespace: "EventManagement" }),
    supabase.rpc("get_club_workspace", { target_club_id: clubId }),
    supabase.rpc("list_club_events", { target_club_id: clubId }),
    currentUserHasPermission(supabase, "club.events_manage", { id: clubId, type: "club" }),
  ]);
  const workspace = workspaceResult.data?.[0]; if (!workspace) notFound();
  const events = eventsResult.data ?? [];
  const registrations = new Map<string, Awaited<ReturnType<typeof supabase.rpc<"list_event_registrations">>>["data"]>();
  await Promise.all(events.map(async (event) => {
    const result = await supabase.rpc("list_event_registrations", { target_event_id: event.event_id });
    registrations.set(event.event_id, result.data);
  }));
  const copy: EventCopy = {
    attendance: t("form.attendance"), cancel: t("form.cancel"), cancelling: t("form.cancelling"), capacity: t("form.capacity"), description: t("form.description"), eligibility: t("form.eligibility"), eligibilityActive: t("eligibility.active_members"), eligibilityAuthenticated: t("eligibility.authenticated"), endsAt: t("form.endsAt"), event: t("types.event"), location: t("form.location"), mark: t("form.mark"), reason: t("form.reason"), register: "", registering: "", registrationDeadline: t("form.registrationDeadline"), save: t("form.save"), saving: t("form.saving"), startsAt: t("form.startsAt"), title: t("form.title"), transition: { pending_approval: t("form.submitApproval"), published: t("form.publish"), draft: t("form.returnDraft"), cancelled: t("form.cancelEvent"), completed: t("form.complete") }, type: t("form.type"), visibility: t("form.visibility"), visibilityMembers: t("visibility.members"), visibilityPublic: t("visibility.public"), workshop: t("types.workshop"),
  };
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return <main className="min-h-screen bg-[var(--surface-canvas)]"><div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
    <Link className="text-sm font-semibold text-teal-700" href={`/dashboard/clubs/${clubId}`}>{t("back")}</Link>
    <section className="mt-5"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{workspace.club_name}</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("heading")}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p></section>
    {eventPermission.allowed ? <section className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm sm:p-8"><h2 className="mb-6 text-2xl font-semibold">{t("newTitle")}</h2><EventForm clubId={clubId} copy={copy} locale={locale} /></section> : null}
    <section className="mt-12"><h2 className="text-2xl font-semibold">{t("eventsTitle")}</h2>{events.length ? <div className="mt-6 space-y-6">{events.map((event) => {
      const next = event.status === "draft" ? ["pending_approval"] : event.status === "pending_approval" ? (event.created_by === userId ? ["draft"] : ["published", "draft"]) : event.status === "published" ? ["cancelled", ...(new Date(event.ends_at) <= new Date() ? ["completed"] : [])] : [];
      const roster = registrations.get(event.event_id) ?? [];
      return <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm" key={event.event_id}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase text-teal-700">{t(`types.${event.event_type}`)}</p><h3 className="mt-2 text-2xl font-semibold">{event.title}</h3><p className="mt-2 text-sm text-[var(--text-muted)]">{event.location} · {format.format(new Date(event.starts_at))}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{t(`statuses.${event.status}`)}</span></div>
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{event.description}</p><p className="mt-3 text-sm">{t("counts", { registered: event.registered_count, waitlisted: event.waitlisted_count, capacity: event.capacity ?? "∞" })}</p>
        {event.status === "draft" ? <details className="mt-5 border-t border-[var(--border-subtle)] pt-4"><summary className="cursor-pointer font-semibold text-teal-800">{t("edit")}</summary><div className="mt-5"><EventForm clubId={clubId} copy={copy} event={{ id: event.event_id, title: event.title, description: event.description, eventType: event.event_type, location: event.location, startsAt: event.starts_at, endsAt: event.ends_at, registrationDeadline: event.registration_deadline, capacity: event.capacity, visibility: event.visibility, eligibility: event.eligibility }} locale={locale} /></div></details> : null}
        {next.length ? <EventTransitionForm clubId={clubId} copy={copy} eventId={event.event_id} locale={locale} nextStatuses={next} /> : null}
        {roster.length ? <details className="mt-5 border-t border-[var(--border-subtle)] pt-4"><summary className="cursor-pointer font-semibold text-teal-800">{t("rosterTitle")}</summary><div className="mt-4 space-y-3">{roster.map((registration) => <div className="rounded-xl bg-slate-50 p-4" key={registration.registration_id}><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{registration.display_name} · <span className="font-normal" dir="ltr">{registration.email}</span></p><span className="text-xs font-semibold">{t(`registrationStatuses.${registration.status}`)}</span></div>{["registered", "attended", "no_show"].includes(registration.status) ? <AttendanceForm clubId={clubId} copy={copy} eventId={event.event_id} locale={locale} registrationId={registration.registration_id} /> : null}</div>)}</div></details> : null}
      </article>;
    })}</div> : <p className="mt-6 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">{t("empty")}</p>}</section>
  </div></main>;
}
