import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const auditActionKeys: Record<string, string> = {
  "role.archived": "roleArchived",
  "role.assigned": "roleAssigned",
  "role.created": "roleCreated",
  "role.revoked": "roleRevoked",
  "role.updated": "roleUpdated",
  "user.reactivated": "userReactivated",
  "user.suspended": "userSuspended",
};

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/audit">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "AuditViewer" });
  return { title: t("title") };
}

export default async function AuditPage({ params }: PageProps<"/[locale]/admin/audit">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();

  const supabase = await createClient();
  const [t, auditResult, usersResult] = await Promise.all([
    getTranslations({ locale, namespace: "AuditViewer" }),
    supabase.rpc("list_platform_audit_events", { page_limit: 50 }),
    supabase.rpc("list_platform_users", { page_limit: 100, page_offset: 0 }),
  ]);
  const events = auditResult.data ?? [];
  const userNames = new Map((usersResult.data ?? []).map((user) => [user.user_id, user.display_name]));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{t("eyebrow")}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)] sm:text-5xl">{t("heading")}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p>
      </section>

      {auditResult.error ? (
        <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">{t("loadError")}</p>
      ) : events.length ? (
        <ol className="mt-10 space-y-4">
          {events.map((event) => {
            const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {};
            const reason = "reason" in metadata && typeof metadata.reason === "string" ? metadata.reason : null;
            return (
              <li className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={event.event_id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text-strong)]">{t(`actions.${auditActionKeys[event.action] ?? "other"}`)}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {t("actor", { name: event.actor_name || event.actor_email })}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {t("target", { name: userNames.get(event.resource_id) ?? event.resource_id })}
                    </p>
                  </div>
                  <time className="text-xs text-[var(--text-muted)]" dateTime={event.created_at}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}
                  </time>
                </div>
                {reason ? <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6">{reason}</p> : null}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-8 text-center text-[var(--text-muted)]">{t("empty")}</p>
      )}
    </div>
  );
}
