import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { MembershipApplicationForm } from "@/features/memberships/membership-forms";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/discover">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "ClubDiscovery" });
  return { title: t("title") };
}

export default async function ClubDiscoveryPage({ params, searchParams }: PageProps<"/[locale]/dashboard/discover">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();
  const queryValue = (await searchParams).q;
  const query = typeof queryValue === "string" ? queryValue.slice(0, 120) : "";

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/${locale}/login`);
  const [t, membershipsT, clubsResult, membershipsResult] = await Promise.all([
    getTranslations({ locale, namespace: "ClubDiscovery" }),
    getTranslations({ locale, namespace: "Memberships" }),
    supabase.rpc("list_discoverable_clubs", { search_query: query }),
    supabase.rpc("list_my_memberships"),
  ]);
  const membershipByClub = new Map((membershipsResult.data ?? []).map((membership) => [membership.club_id, membership]));
  const copy = {
    accept: "", accepting: "", approve: "", approving: "", email: "", invite: "", inviting: "",
    interests: membershipsT("form.interests"), motivation: membershipsT("form.motivation"), reason: "",
    reject: "", rejecting: "", resign: "", resigning: "", review: "", reviewing: "", revoke: "", revoking: "",
    status: "", submit: membershipsT("form.submit"), submitting: membershipsT("form.submitting"),
    update: "", updating: "", withdraw: "", withdrawing: "",
  };

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
        <Link className="text-sm font-semibold text-teal-700" href="/dashboard">{t("back")}</Link>
        <section className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{t("eyebrow")}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("heading")}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p>
        </section>
        <form className="mt-8 flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white p-4 sm:flex-row" method="get">
          <label className="sr-only" htmlFor="club-search">{t("searchLabel")}</label>
          <input className="h-11 flex-1 rounded-xl border border-[var(--border-subtle)] px-3 text-sm" defaultValue={query} id="club-search" name="q" placeholder={t("searchPlaceholder")} />
          <button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white" type="submit">{t("search")}</button>
        </form>
        {clubsResult.error ? <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">{t("loadError")}</p> : clubsResult.data?.length ? (
          <section className="mt-8 grid gap-5 lg:grid-cols-2">
            {clubsResult.data.map((club) => {
              const membership = membershipByClub.get(club.club_id);
              const openApplication = club.application_status === "submitted" || club.application_status === "under_review";
              const currentMembership = club.membership_status === "active" || club.membership_status === "suspended";
              const renewalEligible = club.membership_status === "expired" || club.membership_status === "resigned";
              return (
                <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm" key={club.club_id}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">{club.university_name}</p>
                  <h2 className="mt-3 text-2xl font-semibold">{club.club_name}</h2>
                  {club.club_description ? <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{club.club_description}</p> : null}
                  {openApplication ? <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("applicationOpen")}</p> : currentMembership ? <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{t("alreadyMember")}</p> : (
                    <details className="mt-5 border-t border-[var(--border-subtle)] pt-5">
                      <summary className="cursor-pointer font-semibold text-teal-800">{renewalEligible ? t("renew") : t("apply")}</summary>
                      <div className="mt-5">
                        <MembershipApplicationForm applicationType={renewalEligible ? "renewal" : "join"} clubId={club.club_id} copy={copy} locale={locale} membershipId={renewalEligible ? membership?.membership_id : undefined} />
                      </div>
                    </details>
                  )}
                </article>
              );
            })}
          </section>
        ) : <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">{t("empty")}</p>}
      </div>
    </main>
  );
}
