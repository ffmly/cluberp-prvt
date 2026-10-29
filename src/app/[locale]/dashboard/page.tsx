import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOutAction } from "@/features/auth/actions";
import { currentUserHasPermission } from "@/features/authorization/permissions";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const moduleKeys = [
  "universities",
  "clubs",
  "memberships",
  "events",
  "finance",
  "design",
] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return { title: t("title") };
}

export default async function DashboardPage({
  params,
}: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect(`/${locale}/login`);
  }

  const [t, common, platformPermission, profileResult] = await Promise.all([
    getTranslations({ locale, namespace: "Dashboard" }),
    getTranslations({ locale, namespace: "Common" }),
    currentUserHasPermission(
      supabase,
      "platform.universities_manage",
      { type: "platform" },
    ),
    supabase
      .from("profiles")
      .select("account_status,suspension_reason")
      .eq("id", claims.sub)
      .maybeSingle(),
  ]);
  const email =
    typeof claims.email === "string"
      ? claims.email
      : common("signedInMember");

  if (profileResult.data?.account_status === "suspended") {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--surface-canvas)] p-6">
        <section className="w-full max-w-xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-700">
            {t("suspendedEyebrow")}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">
            {t("suspendedTitle")}
          </h1>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {t("suspendedDescription")}
          </p>
          {profileResult.data.suspension_reason ? (
            <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {profileResult.data.suspension_reason}
            </p>
          ) : null}
          <form action={signOutAction} className="mt-7">
            <input name="locale" type="hidden" value={locale} />
            <button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 py-2.5 text-sm font-semibold text-white" type="submit">
              {t("signOut")}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)] p-6 sm:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[var(--border-subtle)] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-strong)] text-sm font-bold text-white">
              CE
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                Club ERP
              </p>
              <p className="text-xs text-[var(--text-muted)]" dir="ltr">
                {email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LocaleSwitcher href="/dashboard" locale={locale} />
            <form action={signOutAction}>
              <input name="locale" type="hidden" value={locale} />
              <button
                className="min-h-10 rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-strong)] transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                type="submit"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)] sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
            {t("description")}
          </p>

          {platformPermission.allowed ? (
            <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <p className="font-semibold text-teal-950">
                  {t("platformAdminTitle")}
                </p>
                <p className="mt-1 text-sm leading-6 text-teal-800">
                  {t("platformAdminDescription")}
                </p>
              </div>
              <Link
                className="mt-4 inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white sm:mt-0"
                href="/admin"
              >
                {t("openAdministration")}
              </Link>
            </div>
          ) : null}

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moduleKeys.map((key) => (
              <div
                className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm"
                key={key}
              >
                <p className="font-semibold text-[var(--text-strong)]">
                  {t(`modules.${key}`)}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  {t("moduleDescription")}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
