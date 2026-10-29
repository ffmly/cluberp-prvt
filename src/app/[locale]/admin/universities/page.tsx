import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  UniversityForm,
  type UniversityFormValues,
} from "@/features/universities/university-form";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const statusStyles = {
  active: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-200 text-slate-700",
  draft: "bg-amber-100 text-amber-800",
  suspended: "bg-rose-100 text-rose-800",
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/universities">): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({
    locale,
    namespace: "UniversityAdministration",
  });
  return { title: t("title") };
}

export default async function UniversitiesPage({
  params,
}: PageProps<"/[locale]/admin/universities">) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const supabase = await createClient();
  const [t, universityResult] = await Promise.all([
    getTranslations({
      locale,
      namespace: "UniversityAdministration",
    }),
    supabase
      .from("universities")
      .select(
        "id,name,slug,status,default_locale,default_time_zone,default_currency,updated_at",
      )
      .order("name"),
  ]);
  const copy = {
    create: t("form.create"),
    creating: t("form.creating"),
    currency: t("form.currency"),
    currencyHint: t("form.currencyHint"),
    locale: t("form.locale"),
    locales: { ar: t("locales.ar"), en: t("locales.en") },
    name: t("form.name"),
    namePlaceholder: t("form.namePlaceholder"),
    save: t("form.save"),
    saving: t("form.saving"),
    slug: t("form.slug"),
    slugHint: t("form.slugHint"),
    status: t("form.status"),
    statuses: {
      active: t("statuses.active"),
      archived: t("statuses.archived"),
      draft: t("statuses.draft"),
      suspended: t("statuses.suspended"),
    },
    timeZone: t("form.timeZone"),
    timeZoneHint: t("form.timeZoneHint"),
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
          {t("eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)] sm:text-5xl">
          {t("heading")}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">
          {t("description")}
        </p>
      </section>

      <section className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-semibold text-[var(--text-strong)]">
          {t("newUniversity")}
        </h2>
        <p className="mb-6 mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {t("newUniversityDescription")}
        </p>
        <UniversityForm copy={copy} locale={locale} />
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-strong)]">
              {t("existingUniversities")}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {t("archiveNote")}
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--text-muted)] shadow-sm">
            {t("count", { count: universityResult.data?.length ?? 0 })}
          </p>
        </div>

        {universityResult.error ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
            {t("loadError")}
          </p>
        ) : universityResult.data?.length ? (
          <div className="mt-6 space-y-5">
            {universityResult.data.map((university) => {
              const values: UniversityFormValues = {
                defaultCurrency: university.default_currency,
                defaultLocale: university.default_locale as "en" | "ar",
                defaultTimeZone: university.default_time_zone,
                id: university.id,
                name: university.name,
                slug: university.slug,
                status: university.status as UniversityFormValues["status"],
              };

              return (
                <article
                  className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm sm:p-8"
                  key={university.id}
                >
                  <div className="mb-6 flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-strong)]">
                        {university.name}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">
                        {university.slug}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[university.status as keyof typeof statusStyles]}`}
                      >
                        {t(`statuses.${university.status}`)}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {t("updatedAt", {
                          date: new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                          }).format(new Date(university.updated_at)),
                        })}
                      </span>
                      <Link
                        className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-100"
                        href={`/admin/universities/${university.id}`}
                      >
                        {t("manageOrganization")}
                      </Link>
                    </div>
                  </div>
                  <UniversityForm copy={copy} locale={locale} university={values} />
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">
            {t("empty")}
          </p>
        )}
      </section>
    </div>
  );
}
