import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import {
  RoleAssignmentForm,
  RoleForm,
  RoleLifecycleForm,
} from "@/features/role-administration/role-forms";
import { isAppLocale } from "@/i18n/locales";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/roles">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "RoleAdministration" });
  return { title: t("title") };
}

export default async function RolesPage({ params }: PageProps<"/[locale]/admin/roles">) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();

  const supabase = await createClient();
  const [t, roleResult, permissionResult, assignmentResult, userResult] = await Promise.all([
    getTranslations({ locale, namespace: "RoleAdministration" }),
    supabase.rpc("list_platform_roles"),
    supabase.rpc("list_grantable_platform_permissions"),
    supabase.rpc("list_platform_role_assignments"),
    supabase.rpc("list_platform_users", { page_limit: 100, page_offset: 0 }),
  ]);
  const roles = roleResult.data ?? [];
  const permissions = (permissionResult.data ?? []).map((permission) => ({
    description: permission.description,
    key: permission.permission_key,
    name: permission.permission_name,
    scope: permission.scope_type,
  }));
  const customRoles = roles.filter((role) => !role.is_system && !role.archived_at);
  const users = (userResult.data ?? []).filter((user) => user.account_status === "active");
  const copy = {
    archive: t("form.archive"), archiving: t("form.archiving"),
    assign: t("form.assign"), assigning: t("form.assigning"),
    description: t("form.description"), key: t("form.key"), name: t("form.name"),
    permissions: t("form.permissions"), reason: t("form.reason"),
    reasonPlaceholder: t("form.reasonPlaceholder"), revoke: t("form.revoke"),
    revoking: t("form.revoking"), save: t("form.save"), saving: t("form.saving"),
    user: t("form.user"),
  };
  const hasLoadError = roleResult.error || permissionResult.error || assignmentResult.error || userResult.error;

  return <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
    <section><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{t("eyebrow")}</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)] sm:text-5xl">{t("heading")}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p></section>
    {hasLoadError ? <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">{t("loadError")}</p> : null}

    <section className="mt-10 rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-semibold">{t("newRole")}</h2><p className="mb-6 mt-2 text-sm text-[var(--text-muted)]">{t("newRoleDescription")}</p><RoleForm copy={copy} locale={locale} permissions={permissions} /></section>

    <section className="mt-12"><h2 className="text-2xl font-semibold">{t("rolesTitle")}</h2><div className="mt-6 grid gap-5 lg:grid-cols-2">{roles.map((role) => <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm" key={role.role_id}><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold">{role.role_name}</h3><p className="mt-1 text-xs text-[var(--text-muted)]" dir="ltr">{role.role_key}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${role.archived_at ? "bg-slate-200 text-slate-700" : role.is_system ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>{role.archived_at ? t("archivedLabel") : role.is_system ? t("systemLabel") : t("customLabel")}</span></div>{role.description ? <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{role.description}</p> : null}<div className="mt-4 flex flex-wrap gap-2">{role.permission_keys.map((key) => <span className="rounded-full bg-slate-100 px-3 py-1 text-xs" dir="ltr" key={key}>{key}</span>)}</div><p className="mt-4 text-sm text-[var(--text-muted)]">{t("assignmentCount", { count: Number(role.active_assignment_count) })}</p>{!role.is_system && !role.archived_at ? <div className="mt-5 space-y-3 border-t border-[var(--border-subtle)] pt-4"><details><summary className="cursor-pointer text-sm font-semibold text-teal-700">{t("edit")}</summary><div className="mt-5"><RoleForm copy={copy} locale={locale} permissions={permissions} role={{ description: role.description ?? undefined, id: role.role_id, key: role.role_key, name: role.role_name, permissionKeys: role.permission_keys }} /></div></details><details><summary className="cursor-pointer text-sm font-semibold text-rose-700">{t("archive")}</summary><div className="mt-5"><RoleLifecycleForm copy={copy} intent="archive" locale={locale} targetId={role.role_id} /></div></details></div> : null}</article>)}</div></section>

    <section className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]"><article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">{t("assignTitle")}</h2><p className="mb-6 mt-2 text-sm text-[var(--text-muted)]">{t("assignDescription")}</p><RoleAssignmentForm copy={copy} locale={locale} roles={customRoles.map((role) => ({ id: role.role_id, name: role.role_name }))} users={users.map((user) => ({ id: user.user_id, name: `${user.display_name} — ${user.email}` }))} /></article><div><h2 className="text-2xl font-semibold">{t("assignmentsTitle")}</h2>{assignmentResult.data?.length ? <div className="mt-5 space-y-4">{assignmentResult.data.filter((assignment) => !roles.find((role) => role.role_id === assignment.role_id)?.is_system).map((assignment) => <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={assignment.assignment_id}><h3 className="font-semibold">{assignment.user_name}</h3><p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">{assignment.user_email}</p><p className="mt-3 text-sm font-medium">{assignment.role_name}</p><details className="mt-4 border-t border-[var(--border-subtle)] pt-4"><summary className="cursor-pointer text-sm font-semibold text-rose-700">{t("revoke")}</summary><div className="mt-5"><RoleLifecycleForm copy={copy} intent="revoke" locale={locale} targetId={assignment.assignment_id} /></div></details></article>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-6 text-center text-sm text-[var(--text-muted)]">{t("emptyAssignments")}</p>}</div></section>
  </div>;
}
