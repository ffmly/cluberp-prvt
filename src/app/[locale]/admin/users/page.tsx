import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { UserStatusForm } from "@/features/user-administration/user-status-form";
import type { UserAccountStatus } from "@/features/user-administration/schemas";
import { isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/users">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "UserAdministration" });
  return { title: t("title") };
}

export default async function UsersPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/users">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();

  const queryValue = (await searchParams).q;
  const query = typeof queryValue === "string" ? queryValue.trim() : "";
  const supabase = await createClient();
  const [t, claimsResult, usersResult] = await Promise.all([
    getTranslations({ locale, namespace: "UserAdministration" }),
    supabase.auth.getClaims(),
    supabase.rpc("list_platform_users", {
      page_limit: 50,
      page_offset: 0,
      search_query: query.length >= 2 ? query : undefined,
    }),
  ]);
  const currentUserId = claimsResult.data?.claims?.sub;
  const users = usersResult.data ?? [];
  const formCopy = {
    activate: t("form.activate"),
    activating: t("form.activating"),
    reason: t("form.reason"),
    reasonPlaceholder: t("form.reasonPlaceholder"),
    suspend: t("form.suspend"),
    suspending: t("form.suspending"),
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

      <form className="mt-8 flex max-w-2xl gap-3" method="get" role="search">
        <label className="sr-only" htmlFor="user-search">{t("searchLabel")}</label>
        <input
          className="h-12 min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-white px-4 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          defaultValue={query}
          id="user-search"
          minLength={2}
          name="q"
          placeholder={t("searchPlaceholder")}
          type="search"
        />
        <button className="rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white" type="submit">
          {t("search")}
        </button>
      </form>

      {usersResult.error ? (
        <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
          {t("loadError")}
        </p>
      ) : users.length ? (
        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          {users.map((user) => {
            const status = user.account_status as UserAccountStatus;
            const isCurrentUser = user.user_id === currentUserId;
            return (
              <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm" key={user.user_id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-[var(--text-strong)]">{user.display_name}</h2>
                    <p className="mt-1 truncate text-sm text-[var(--text-muted)]" dir="ltr">{user.email}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {t(`statuses.${status}`)}
                  </span>
                </div>
                <dl className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-5 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{t("createdAt")}</dt>
                    <dd className="mt-1">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(user.created_at))}</dd>
                  </div>
                  {user.suspension_reason ? (
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{t("suspensionReason")}</dt>
                      <dd className="mt-1 leading-6">{user.suspension_reason}</dd>
                    </div>
                  ) : null}
                </dl>
                {isCurrentUser ? (
                  <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-[var(--text-muted)]">{t("currentAccount")}</p>
                ) : (
                  <details className="mt-5 border-t border-[var(--border-subtle)] pt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-teal-700">
                      {status === "active" ? t("openSuspend") : t("openActivate")}
                    </summary>
                    <div className="mt-5">
                      <UserStatusForm copy={formCopy} currentStatus={status} locale={locale} userId={user.user_id} />
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">
          {t("empty")}
        </p>
      )}
    </div>
  );
}
