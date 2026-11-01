import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { AcceptInvitationForm, ResignMembershipForm, WithdrawApplicationForm } from "@/features/memberships/membership-forms";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/memberships">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Memberships" });
  return { title: t("title") };
}

export default async function MembershipsPage({ params, searchParams }: PageProps<"/[locale]/dashboard/memberships">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();
  const invitationValue = (await searchParams).invitation;
  const invitation = typeof invitationValue === "string" ? invitationValue.slice(0, 256) : "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/${locale}/login`);
  const [t, membershipsResult, applicationsResult] = await Promise.all([
    getTranslations({ locale, namespace: "Memberships" }),
    supabase.rpc("list_my_memberships"),
    supabase.rpc("list_my_membership_applications"),
  ]);
  const copy = {
    accept: t("form.accept"), accepting: t("form.accepting"), approve: "", approving: "", email: "",
    interests: "", invite: "", inviting: "", motivation: "", reason: t("form.reason"), reject: "", rejecting: "",
    resign: t("form.resign"), resigning: t("form.resigning"), review: "", reviewing: "", revoke: "", revoking: "",
    status: "", submit: "", submitting: "", update: "", updating: "",
    withdraw: t("form.withdraw"), withdrawing: t("form.withdrawing"),
  };
  const memberships = membershipsResult.data ?? [];
  const applications = applicationsResult.data ?? [];

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
        <Link className="text-sm font-semibold text-teal-700" href="/dashboard">{t("back")}</Link>
        <section className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{t("eyebrow")}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("heading")}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p>
          <Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white" href="/dashboard/discover">{t("discover")}</Link>
        </section>
        {invitation ? (
          <section className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-semibold text-amber-950">{t("invitationTitle")}</h2>
            <p className="mb-5 mt-2 text-sm text-amber-900">{t("invitationDescription")}</p>
            <AcceptInvitationForm copy={copy} locale={locale} token={invitation} />
          </section>
        ) : null}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">{t("membershipsTitle")}</h2>
          {memberships.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{memberships.map((membership) => (
            <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={membership.membership_id}>
              <p className="text-xs font-semibold uppercase text-teal-700">{membership.university_name}</p>
              <h3 className="mt-2 text-lg font-semibold">{membership.club_name}</h3>
              <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{t(`statuses.${membership.membership_status}`)}</span>
              {membership.membership_status === "active" || membership.membership_status === "suspended" ? <ResignMembershipForm copy={copy} locale={locale} membershipId={membership.membership_id} /> : null}
            </article>
          ))}</div> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-7 text-center text-[var(--text-muted)]">{t("membershipsEmpty")}</p>}
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">{t("applicationsTitle")}</h2>
          {applications.length ? <div className="mt-6 grid gap-5 md:grid-cols-2">{applications.map((application) => (
            <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={application.application_id}>
              <p className="text-xs font-semibold uppercase text-teal-700">{application.university_name}</p>
              <h3 className="mt-2 text-lg font-semibold">{application.club_name}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{application.motivation}</p>
              <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{t(`applicationStatuses.${application.status}`)}</span>
              {application.decision_reason ? <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">{application.decision_reason}</p> : null}
              {application.status === "submitted" || application.status === "under_review" ? <WithdrawApplicationForm applicationId={application.application_id} copy={copy} locale={locale} /> : null}
            </article>
          ))}</div> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-7 text-center text-[var(--text-muted)]">{t("applicationsEmpty")}</p>}
        </section>
      </div>
    </main>
  );
}
