import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/clubs">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "ClubWorkspaces" });
  return { title: t("title") };
}

export default async function ClubWorkspacesPage({
  params,
}: PageProps<"/[locale]/dashboard/clubs">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/${locale}/login`);

  const [t, result] = await Promise.all([
    getTranslations({ locale, namespace: "ClubWorkspaces" }),
    supabase.rpc("list_my_club_workspaces"),
  ]);
  const clubs = result.data ?? [];

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
        <Link className="text-sm font-semibold text-teal-700" href="/dashboard">
          {t("back")}
        </Link>
        <section className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            {t("heading")}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">
            {t("description")}
          </p>
        </section>

        {result.error ? (
          <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
            {t("loadError")}
          </p>
        ) : clubs.length ? (
          <section className="mt-10 grid gap-5 md:grid-cols-2">
            {clubs.map((club) => (
              <article
                className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm"
                key={club.club_id}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
                  {club.university_name}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{club.club_name}</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]" dir="ltr">
                  {club.club_slug}
                </p>
                {club.club_description ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
                    {club.club_description}
                  </p>
                ) : null}
                {club.role_names ? (
                  <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                    {t("roles", { roles: club.role_names })}
                  </p>
                ) : null}
                <Link
                  className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white"
                  href={`/dashboard/clubs/${club.club_id}`}
                  prefetch
                >
                  {t("open")}
                </Link>
              </article>
            ))}
          </section>
        ) : (
          <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">
            {t("empty")}
          </p>
        )}
      </div>
    </main>
  );
}
