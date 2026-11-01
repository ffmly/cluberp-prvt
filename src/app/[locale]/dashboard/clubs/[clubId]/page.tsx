import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import {
  LeadershipAssignmentForm,
  RevokeLeadershipForm,
  TeamForm,
} from "@/features/club-workspaces/workspace-forms";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/clubs/[clubId]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "ClubWorkspace" });
  return { title: t("title") };
}

export default async function ClubWorkspacePage({
  params,
}: PageProps<"/[locale]/dashboard/clubs/[clubId]">) {
  const { clubId, locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/${locale}/login`);

  const [t, workspaceResult, teamsResult, leadershipResult, rolesResult] =
    await Promise.all([
      getTranslations({ locale, namespace: "ClubWorkspace" }),
      supabase.rpc("get_club_workspace", { target_club_id: clubId }),
      supabase.rpc("list_club_teams", { target_club_id: clubId }),
      supabase.rpc("list_club_leadership", { target_club_id: clubId }),
      supabase.rpc("list_assignable_club_roles", { target_club_id: clubId }),
    ]);
  const workspace = workspaceResult.data?.[0];
  if (!workspace) notFound();

  const copy = {
    archive: t("form.archive"),
    archiving: t("form.archiving"),
    assign: t("form.assign"),
    assigning: t("form.assigning"),
    candidateEmail: t("form.candidateEmail"),
    candidateHint: t("form.candidateHint"),
    description: t("form.description"),
    find: t("form.find"),
    finding: t("form.finding"),
    name: t("form.name"),
    reason: t("form.reason"),
    revoke: t("form.revoke"),
    revoking: t("form.revoking"),
    role: t("form.role"),
    save: t("form.save"),
    saving: t("form.saving"),
  };
  const teams = teamsResult.data ?? [];
  const leadership = leadershipResult.data ?? [];
  const roles = (rolesResult.data ?? []).map((role) => ({
    id: role.role_id,
    name: role.role_name,
  }));

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
        <Link className="text-sm font-semibold text-teal-700" href="/dashboard/clubs">
          {t("back")}
        </Link>
        <section className="mt-5 rounded-3xl bg-[var(--brand-strong)] p-7 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-100">
            {workspace.university_name}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            {workspace.club_name}
          </h1>
          {workspace.club_description ? (
            <p className="mt-5 max-w-3xl text-lg leading-8 text-teal-50">
              {workspace.club_description}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/15 px-3 py-1.5">{t(`statuses.${workspace.club_status}`)}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">{t(`visibility.${workspace.club_visibility}`)}</span>
          </div>
        </section>

        <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {["members", "events", "tasks", "documents"].map((module) =>
            module === "members" ? (
              <Link
                className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm transition hover:border-teal-400"
                href={`/dashboard/clubs/${clubId}/members`}
                key={module}
                prefetch
              >
                <p className="font-semibold text-teal-800">{t(`modules.${module}`)}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{t("moduleReady")}</p>
              </Link>
            ) : (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={module}>
                <p className="font-semibold">{t(`modules.${module}`)}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{t("moduleReady")}</p>
              </div>
            ),
          )}
        </section>

        <div className="mt-12 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div>
              <h2 className="text-2xl font-semibold">{t("teamsTitle")}</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t("teamsDescription")}</p>
            </div>
            {workspace.can_manage_teams ? (
              <div className="mt-6 rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
                <h3 className="mb-5 text-lg font-semibold">{t("newTeam")}</h3>
                <TeamForm clubId={clubId} copy={copy} locale={locale} />
              </div>
            ) : null}
            {teams.length ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {teams.map((team) => (
                  <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm" key={team.team_id}>
                    {workspace.can_manage_teams && team.team_status !== "archived" ? (
                      <TeamForm
                        clubId={clubId}
                        copy={copy}
                        locale={locale}
                        team={{ description: team.team_description, id: team.team_id, name: team.team_name }}
                      />
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">{team.team_name}</h3>
                        {team.team_description ? <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{team.team_description}</p> : null}
                      </>
                    )}
                    <span className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {t(`teamStatuses.${team.team_status}`)}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-7 text-center text-[var(--text-muted)]">
                {t("teamsEmpty")}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold">{t("leadershipTitle")}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{t("leadershipDescription")}</p>
            {workspace.can_manage_roles ? (
              <div className="mt-6 rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm">
                <LeadershipAssignmentForm clubId={clubId} copy={copy} locale={locale} roles={roles} />
              </div>
            ) : null}
            <div className="mt-6 space-y-4">
              {leadership.map((leader) => (
                <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={leader.assignment_id}>
                  <p className="font-semibold">{leader.display_name}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">{leader.email}</p>
                  <span className="mt-3 inline-flex rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                    {leader.role_name}
                  </span>
                  {workspace.can_manage_roles ? (
                    <RevokeLeadershipForm assignmentId={leader.assignment_id} clubId={clubId} copy={copy} locale={locale} />
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
