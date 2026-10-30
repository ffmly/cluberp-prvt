import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { signOutAction } from "@/features/auth/actions";
import { currentUserHasPermission } from "@/features/authorization/permissions";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function AdminLayout({
  children,
  params,
}: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    notFound();
  }

  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect(`/${locale}/login`);
  }

  const [t, permission] = await Promise.all([
    getTranslations({ locale, namespace: "Admin" }),
    currentUserHasPermission(
      supabase,
      "platform.universities_manage",
      { type: "platform" },
    ),
  ]);

  if (!permission.allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--surface-canvas)] p-6">
        <section className="w-full max-w-xl rounded-3xl border border-[var(--border-subtle)] bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-700">
            {t("accessDeniedEyebrow")}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">
            {t("accessDeniedTitle")}
          </h1>
          <p className="mt-4 leading-7 text-[var(--text-muted)]">
            {t("accessDeniedDescription")}
          </p>
          <Link
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-strong)] px-5 py-2.5 text-sm font-semibold text-white"
            href="/dashboard"
          >
            {t("backToWorkspace")}
          </Link>
        </section>
      </main>
    );
  }

  const email = typeof claims.email === "string" ? claims.email : t("manager");

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)]">
      <header className="border-b border-[var(--border-subtle)] bg-white/90 px-6 py-4 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-strong)] text-sm font-bold text-white">
              CE
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                {t("brand")}
              </p>
              <p className="text-xs text-[var(--text-muted)]" dir="ltr">
                {email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label={t("navigationLabel")} className="flex flex-wrap gap-2">
              <Link
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-slate-100 hover:text-[var(--text-strong)]"
                href="/admin"
              >
                {t("overview")}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-slate-100 hover:text-[var(--text-strong)]"
                href="/admin/universities"
              >
                {t("universities")}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-slate-100 hover:text-[var(--text-strong)]"
                href="/admin/users"
              >
                {t("users")}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-slate-100 hover:text-[var(--text-strong)]"
                href="/admin/audit"
              >
                {t("audit")}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-slate-100 hover:text-[var(--text-strong)]"
                href="/admin/roles"
              >
                {t("roles")}
              </Link>
              <Link
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition hover:bg-slate-100 hover:text-[var(--text-strong)]"
                href="/dashboard"
              >
                {t("workspace")}
              </Link>
            </nav>
            <LocaleSwitcher href="/admin" locale={locale} />
            <form action={signOutAction}>
              <input name="locale" type="hidden" value={locale} />
              <button
                className="min-h-10 rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-strong)] transition hover:bg-slate-50"
                type="submit"
              >
                {t("signOut")}
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </main>
  );
}
