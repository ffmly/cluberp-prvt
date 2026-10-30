import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { ClubRequestForm } from "@/features/club-requests/club-request-forms";
import type { ClubRequestStatus } from "@/features/club-requests/schemas";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;
const statusStyles: Record<ClubRequestStatus, string> = { approved: "bg-emerald-100 text-emerald-800", rejected: "bg-rose-100 text-rose-800", submitted: "bg-sky-100 text-sky-800", under_review: "bg-amber-100 text-amber-800", withdrawn: "bg-slate-200 text-slate-700" };

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/club-requests">): Promise<Metadata> { const { locale } = await params; if (!isAppLocale(locale)) return {}; const t = await getTranslations({ locale, namespace: "ClubRequests" }); return { title: t("title") }; }

export default async function ClubRequestsPage({ params }: PageProps<"/[locale]/dashboard/club-requests">) {
  const { locale } = await params; if (!isAppLocale(locale)) notFound(); setRequestLocale(locale); await connection();
  const supabase = await createClient(); const claims = await supabase.auth.getClaims(); if (!claims.data?.claims?.sub) redirect(`/${locale}/login`);
  const [t, universitiesResult, clubsResult, requestsResult] = await Promise.all([
    getTranslations({ locale, namespace: "ClubRequests" }),
    supabase.from("universities").select("id,name").eq("status", "active").order("name"),
    supabase.rpc("list_manageable_clubs"), supabase.rpc("list_my_club_requests"),
  ]);
  const copy = { approve: "", approving: "", club: t("form.club"), create: t("types.create"), description: t("form.description"), name: t("form.name"), reason: "", reject: "", rejecting: "", renewal: t("types.renewal"), review: "", reviewing: "", slug: t("form.slug"), submit: t("form.submit"), submitting: t("form.submitting"), type: t("form.type"), university: t("form.university") };
  return <main className="min-h-screen bg-[var(--surface-canvas)]"><div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14"><Link className="text-sm font-semibold text-teal-700" href="/dashboard">{t("back")}</Link><section className="mt-5"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{t("eyebrow")}</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("heading")}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p></section><section className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-semibold">{t("newTitle")}</h2><p className="mb-6 mt-2 text-sm text-[var(--text-muted)]">{t("newDescription")}</p><ClubRequestForm clubs={(clubsResult.data ?? []).map((club) => ({ description: club.club_description ?? undefined, id: club.club_id, name: club.club_name, slug: club.club_slug, universityId: club.university_id }))} copy={copy} locale={locale} universities={(universitiesResult.data ?? []).map((university) => ({ id: university.id, name: university.name }))} /></section><section className="mt-12"><h2 className="text-2xl font-semibold">{t("historyTitle")}</h2>{requestsResult.data?.length ? <div className="mt-6 grid gap-5 lg:grid-cols-2">{requestsResult.data.map((request) => { const status = request.status as ClubRequestStatus; return <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={request.request_id}><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{request.proposed_name}</h3><p className="mt-1 text-xs text-[var(--text-muted)]" dir="ltr">{request.proposed_slug}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>{t(`statuses.${status}`)}</span></div><p className="mt-4 text-sm text-[var(--text-muted)]">{request.university_name} · {t(`types.${request.request_type}`)}</p>{request.decision_reason ? <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">{request.decision_reason}</p> : null}</article>; })}</div> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">{t("empty")}</p>}</section></div></main>;
}
