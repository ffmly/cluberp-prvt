import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";

import { currentUserHasPermission } from "@/features/authorization/permissions";
import { InvitationForm, MemberStatusForm, MembershipReviewForm, RevokeInvitationForm } from "@/features/memberships/membership-forms";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/clubs/[clubId]/members">): Promise<Metadata> {
  const { locale } = await params;
  if (!isAppLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "MembershipManagement" });
  return { title: t("title") };
}

export default async function ClubMembersPage({ params }: PageProps<"/[locale]/dashboard/clubs/[clubId]/members">) {
  const { clubId, locale } = await params;
  if (!isAppLocale(locale)) notFound();
  setRequestLocale(locale);
  await connection();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect(`/${locale}/login`);
  const [t, workspaceResult, membersResult, applicationsResult, invitationsResult, reviewPermission, managePermission] = await Promise.all([
    getTranslations({ locale, namespace: "MembershipManagement" }),
    supabase.rpc("get_club_workspace", { target_club_id: clubId }),
    supabase.rpc("list_club_members", { target_club_id: clubId }),
    supabase.rpc("list_reviewable_membership_applications", { target_club_id: clubId }),
    supabase.rpc("list_club_invitations", { target_club_id: clubId }),
    currentUserHasPermission(supabase, "club.members_review", { id: clubId, type: "club" }),
    currentUserHasPermission(supabase, "club.members_manage", { id: clubId, type: "club" }),
  ]);
  const workspace = workspaceResult.data?.[0];
  if (!workspace) notFound();
  const copy = {
    accept: "", accepting: "", approve: t("form.approve"), approving: t("form.approving"),
    email: t("form.email"), interests: "", invite: t("form.invite"), inviting: t("form.inviting"), motivation: "",
    reason: t("form.reason"), reject: t("form.reject"), rejecting: t("form.rejecting"), resign: "", resigning: "",
    review: t("form.review"), reviewing: t("form.reviewing"), revoke: t("form.revoke"), revoking: t("form.revoking"),
    status: t("form.status"), submit: "", submitting: "", update: t("form.update"), updating: t("form.updating"), withdraw: "", withdrawing: "",
  };
  const applications = applicationsResult.data ?? [];
  const members = membersResult.data ?? [];
  const invitations = invitationsResult.data ?? [];
  return (
    <main className="min-h-screen bg-[var(--surface-canvas)]">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14">
        <Link className="text-sm font-semibold text-teal-700" href={`/dashboard/clubs/${clubId}`}>{t("back")}</Link>
        <section className="mt-5"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">{workspace.university_name}</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{t("heading", { club: workspace.club_name })}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">{t("description")}</p></section>
        <div className="mt-12 grid gap-8 xl:grid-cols-2">
          <section><h2 className="text-2xl font-semibold">{t("applicationsTitle")}</h2>{applications.length ? <div className="mt-6 space-y-5">{applications.map((application) => (
            <article className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm" key={application.application_id}>
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{application.applicant_name}</h3><p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">{application.applicant_email}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{t(`applicationStatuses.${application.status}`)}</span></div>
              <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{application.motivation}</p>
              {reviewPermission.allowed && (application.status === "submitted" || application.status === "under_review") ? <MembershipReviewForm applicationId={application.application_id} clubId={clubId} copy={copy} locale={locale} status={application.status} /> : null}
            </article>
          ))}</div> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-7 text-center text-[var(--text-muted)]">{t("applicationsEmpty")}</p>}</section>
          <section><h2 className="text-2xl font-semibold">{t("membersTitle")}</h2>{members.length ? <div className="mt-6 space-y-4">{members.map((member) => (
            <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm" key={member.membership_id}>
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{member.display_name}</h3><p className="mt-1 text-sm text-[var(--text-muted)]" dir="ltr">{member.email}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{t(`statuses.${member.membership_status}`)}</span></div>
              {managePermission.allowed ? <MemberStatusForm clubId={clubId} copy={copy} locale={locale} membershipId={member.membership_id} status={member.membership_status} /> : null}
            </article>
          ))}</div> : <p className="mt-5 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-white p-7 text-center text-[var(--text-muted)]">{t("membersEmpty")}</p>}</section>
        </div>
        {managePermission.allowed ? <section className="mt-12 grid gap-8 lg:grid-cols-2"><div className="rounded-3xl border border-[var(--border-subtle)] bg-white p-6 shadow-sm"><h2 className="text-2xl font-semibold">{t("inviteTitle")}</h2><p className="mb-6 mt-2 text-sm text-[var(--text-muted)]">{t("inviteDescription")}</p><InvitationForm clubId={clubId} copy={copy} locale={locale} /></div><div><h2 className="text-2xl font-semibold">{t("invitationsTitle")}</h2><div className="mt-6 space-y-4">{invitations.map((invitation) => <article className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5" key={invitation.invitation_id}><p className="font-semibold" dir="ltr">{invitation.recipient_email}</p><span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{t(`invitationStatuses.${invitation.invitation_status}`)}</span>{invitation.invitation_status === "pending" ? <RevokeInvitationForm clubId={clubId} copy={copy} invitationId={invitation.invitation_id} locale={locale} /> : null}</article>)}</div></div></section> : null}
      </div>
    </main>
  );
}
