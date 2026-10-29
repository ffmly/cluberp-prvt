import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";

const qualityKeys = ["isolation", "security", "teams"] as const;
const milestoneKeys = [
  "architecture",
  "application",
  "database",
  "authorization",
] as const;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const [t, common] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);

  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden bg-[var(--surface-canvas)] px-6 py-8 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.12),transparent_30%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between gap-5 border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-strong)] text-sm font-bold tracking-tight text-white shadow-lg shadow-teal-950/10">
              CE
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-[var(--text-strong)]">
                Club ERP
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {common("brandSubtitle")}
              </p>
            </div>
          </div>
          <LocaleSwitcher href="/" locale={locale} />
        </header>

        <section className="grid flex-1 items-center gap-16 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
              {t("eyebrow")}
            </p>
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--text-strong)] sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-[var(--text-muted)] sm:text-xl">
              {t("description")}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--brand-strong)] px-6 text-sm font-semibold text-white shadow-lg shadow-teal-950/10 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                href="/login"
              >
                {t("signIn")}
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-white/70 px-6 text-sm font-semibold text-[var(--text-strong)] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                href="/login?mode=sign-up"
              >
                {t("createAccount")}
              </Link>
            </div>

            <dl className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
              {qualityKeys.map((key) => (
                <div
                  className="rounded-2xl border border-[var(--border-subtle)] bg-white/65 p-5 shadow-sm backdrop-blur"
                  key={key}
                >
                  <dt className="text-sm font-semibold text-[var(--text-strong)]">
                    {t(`qualities.${key}Title`)}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                    {t(`qualities.${key}Description`)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="rounded-[2rem] border border-white/80 bg-[var(--surface-strong)] p-7 shadow-2xl shadow-slate-900/10 sm:p-9">
            <div className="flex items-center gap-3">
              <span className="relative flex size-3" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50 motion-reduce:animate-none" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
              </span>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {t("statusTitle")}
              </p>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">
              {t("statusDescription")}
            </p>
            <div
              aria-label={t("milestonesLabel")}
              className="mt-7 space-y-3"
            >
              {milestoneKeys.map((key) => (
                <div
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3"
                  key={key}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-5 place-items-center rounded-full bg-emerald-100 text-xs text-emerald-700"
                  >
                    ✓
                  </span>
                  <span className="text-sm font-medium text-[var(--text-strong)]">
                    {t(`milestones.${key}`)}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <footer className="border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)]">
          {t("footer")}
        </footer>
      </div>
    </main>
  );
}
