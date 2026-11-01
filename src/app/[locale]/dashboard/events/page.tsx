import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { EventRegistrationForm, type EventCopy } from "@/features/events/event-forms";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/events">): Promise<Metadata> { const { locale } = await params; if (!isAppLocale(locale)) return {}; const t = await getTranslations({ locale, namespace: "Events" }); return { title: t("title") }; }

export default async function EventsPage({ params }: PageProps<"/[locale]/dashboard/events">) {
  const { locale } = await params; if (!isAppLocale(locale)) notFound(); setRequestLocale(locale); await connection();
  const supabase = await createClient(); const claims = await supabase.auth.getClaims(); const userId = claims.data?.claims?.sub; if (!userId) redirect(`/${locale}/login`);
  const [t, eventsResult, registrationsResult] = await Promise.all([
    getTranslations({ locale, namespace: "Events" }), supabase.rpc("list_discoverable_events"),
    supabase.from("event_registrations").select("id,event_id,status").eq("user_id", userId),
  ]);
  const registrations = new Map((registrationsResult.data ?? []).map((item) => [item.event_id, item]));
  const copy: EventCopy = { attendance: "", cancel: t("form.cancel"), cancelling: t("form.cancelling"), capacity: "", description: "", eligibility: "", eligibilityActive: "", eligibilityAuthenticated: "", endsAt: "", event: "", location: "", mark: "", reason: "", register: t("form.register"), registering: t("form.registering"), registrationDeadline: "", save: "", saving: "", startsAt: "", title: "", transition: {}, type: "", visibility: "", visibilityMembers: "", visibilityPublic: "", workshop: "" };
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return <main className="min-h-screen bg-[var(--surface-canvas)]"><div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14"><Link className="text-sm font-semibold text-teal-700" href="/dashboard">{t("back")}</Link><section className="mt-5"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{t("eyebrow")}</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("heading")}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p></section>
    {eventsResult.error ? <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">{t("loadError")}</p> : eventsResult.data?.length ? <section className="mt-10 grid gap-6 lg:grid-cols-2">{eventsResult.data.map((event) => { const registration = registrations.get(event.event_id); return <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm" key={event.event_id}><p className="text-xs font-semibold uppercase text-teal-700">{event.university_name} · {event.club_name}</p><h2 className="mt-3 text-2xl font-semibold">{event.title}</h2><p className="mt-2 text-sm text-[var(--text-muted)]">{event.location} · {format.format(new Date(event.starts_at))}</p><p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{event.description}</p><p className="mt-4 text-sm font-semibold">{t("places", { registered: event.registered_count, capacity: event.capacity ?? "∞" })}</p>{registration ? <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{t(`statuses.${registration.status}`)}</span> : null}<EventRegistrationForm copy={copy} eventId={event.event_id} locale={locale} registrationId={registration?.id} status={registration?.status} /></article>; })}</section> : <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">{t("empty")}</p>}
  </div></main>;
}
