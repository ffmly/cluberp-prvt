import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const universityStatuses = [
  "draft",
  "active",
  "suspended",
  "archived",
] as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "AdminOverview" });
  return { title: t("title") };
}

export default async function AdminOverviewPage({
  params,
}: PageProps<"/[locale]/admin">) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const supabase = await createClient();
  const [t, universityResult] = await Promise.all([
    getTranslations({ locale, namespace: "AdminOverview" }),
    supabase.from("universities").select("id,status"),
  ]);
  const universities = universityResult.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
          {t("eyebrow")}
        </p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)] sm:text-5xl">
              {t("heading")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
              {t("description")}
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--brand-strong)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/10"
            href="/admin/universities"
          >
            {t("manageUniversities")}
          </Link>
        </div>
      </section>

      {universityResult.error ? (
        <p className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
          {t("loadError")}
        </p>
      ) : (
        <section aria-label={t("metricsLabel")} className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label={t("totalUniversities")} value={universities.length} />
          {universityStatuses.map((status) => (
            <MetricCard
              key={status}
              label={t(`statuses.${status}`)}
              value={universities.filter((university) => university.status === status).length}
            />
          ))}
        </section>
      )}

      <section className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white p-7 shadow-sm sm:p-9">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">
          {t("nextTitle")}
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-[var(--text-muted)]">
          {t("nextDescription")}
        </p>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">
        {value}
      </p>
    </div>
  );
}
