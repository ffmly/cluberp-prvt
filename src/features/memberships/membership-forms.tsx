"use client";

import { useActionState } from "react";

import type { AppLocale } from "@/i18n/locales";

import {
  acceptClubInvitationAction,
  createClubInvitationAction,
  resignMembershipAction,
  revokeClubInvitationAction,
  submitMembershipApplicationAction,
  transitionMembershipApplicationAction,
  transitionMembershipStatusAction,
  withdrawMembershipApplicationAction,
} from "./actions";
import { initialMembershipActionState } from "./state";

type Copy = {
  accept: string;
  accepting: string;
  approve: string;
  approving: string;
  email: string;
  interests: string;
  invite: string;
  inviting: string;
  motivation: string;
  reason: string;
  reject: string;
  rejecting: string;
  resign: string;
  resigning: string;
  review: string;
  reviewing: string;
  revoke: string;
  revoking: string;
  status: string;
  submit: string;
  submitting: string;
  update: string;
  updating: string;
  withdraw: string;
  withdrawing: string;
};

function Feedback({ message, status }: { message?: string; status: string }) {
  if (!message) return null;
  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function MembershipApplicationForm({
  applicationType,
  clubId,
  copy,
  locale,
  membershipId,
}: {
  applicationType: "join" | "renewal";
  clubId: string;
  copy: Copy;
  locale: AppLocale;
  membershipId?: string;
}) {
  const [state, action, pending] = useActionState(submitMembershipApplicationAction, initialMembershipActionState);
  return (
    <form action={action} className="space-y-4">
      <input name="applicationType" type="hidden" value={applicationType} />
      <input name="clubId" type="hidden" value={clubId} />
      <input name="locale" type="hidden" value={locale} />
      <input name="membershipId" type="hidden" value={membershipId ?? ""} />
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor={`motivation-${clubId}`}>{copy.motivation}</label>
        <textarea className="min-h-28 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm" id={`motivation-${clubId}`} maxLength={3000} minLength={10} name="motivation" required />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor={`interests-${clubId}`}>{copy.interests}</label>
        <input className="h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" id={`interests-${clubId}`} maxLength={500} name="interests" />
      </div>
      <Feedback message={state.message} status={state.status} />
      <button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}

export function WithdrawApplicationForm({ applicationId, copy, locale }: { applicationId: string; copy: Copy; locale: AppLocale }) {
  const [state, action, pending] = useActionState(withdrawMembershipApplicationAction, initialMembershipActionState);
  return (
    <form action={action} className="mt-4 space-y-3">
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="locale" type="hidden" value={locale} />
      <Feedback message={state.message} status={state.status} />
      <button className="min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:opacity-50" disabled={pending} type="submit">
        {pending ? copy.withdrawing : copy.withdraw}
      </button>
    </form>
  );
}

export function MembershipReviewForm({ applicationId, clubId, copy, locale, status }: { applicationId: string; clubId: string; copy: Copy; locale: AppLocale; status: string }) {
  const [state, action, pending] = useActionState(transitionMembershipApplicationAction, initialMembershipActionState);
  const inReview = status === "under_review";
  return (
    <form action={action} className="mt-5 space-y-4 border-t border-[var(--border-subtle)] pt-5">
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="clubId" type="hidden" value={clubId} />
      <input name="locale" type="hidden" value={locale} />
      {inReview ? (
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor={`application-reason-${applicationId}`}>{copy.reason}</label>
          <textarea className="min-h-20 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm" id={`application-reason-${applicationId}`} maxLength={1000} name="reason" />
        </div>
      ) : <input name="reason" type="hidden" value="" />}
      <Feedback message={state.message} status={state.status} />
      <div className="flex flex-wrap gap-3">
        {inReview ? (
          <>
            <button className="min-h-10 rounded-xl bg-teal-800 px-4 text-sm font-semibold text-white" disabled={pending} name="newStatus" type="submit" value="approved">{pending ? copy.approving : copy.approve}</button>
            <button className="min-h-10 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white" disabled={pending} name="newStatus" type="submit" value="rejected">{pending ? copy.rejecting : copy.reject}</button>
          </>
        ) : (
          <button className="min-h-10 rounded-xl bg-[var(--brand-strong)] px-4 text-sm font-semibold text-white" disabled={pending} name="newStatus" type="submit" value="under_review">{pending ? copy.reviewing : copy.review}</button>
        )}
      </div>
    </form>
  );
}

export function MemberStatusForm({ clubId, copy, locale, membershipId, status }: { clubId: string; copy: Copy; locale: AppLocale; membershipId: string; status: string }) {
  const [state, action, pending] = useActionState(transitionMembershipStatusAction, initialMembershipActionState);
  const options = status === "active" ? ["suspended", "expired", "removed"] : status === "suspended" ? ["active", "removed"] : ["active"];
  return (
    <form action={action} className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
      <input name="clubId" type="hidden" value={clubId} />
      <input name="locale" type="hidden" value={locale} />
      <input name="membershipId" type="hidden" value={membershipId} />
      <label className="block text-sm font-semibold" htmlFor={`member-status-${membershipId}`}>{copy.status}</label>
      <select className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm" id={`member-status-${membershipId}`} name="newStatus">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <label className="block text-sm font-semibold" htmlFor={`member-reason-${membershipId}`}>{copy.reason}</label>
      <input className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" id={`member-reason-${membershipId}`} maxLength={500} minLength={5} name="reason" required />
      <Feedback message={state.message} status={state.status} />
      <button className="min-h-10 rounded-xl border border-teal-200 px-4 text-sm font-semibold text-teal-800 disabled:opacity-50" disabled={pending} type="submit">{pending ? copy.updating : copy.update}</button>
    </form>
  );
}

export function ResignMembershipForm({ copy, locale, membershipId }: { copy: Copy; locale: AppLocale; membershipId: string }) {
  const [state, action, pending] = useActionState(resignMembershipAction, initialMembershipActionState);
  return (
    <form action={action} className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
      <input name="locale" type="hidden" value={locale} />
      <input name="membershipId" type="hidden" value={membershipId} />
      <label className="block text-sm font-semibold" htmlFor={`resign-reason-${membershipId}`}>{copy.reason}</label>
      <input className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" id={`resign-reason-${membershipId}`} maxLength={500} minLength={5} name="reason" required />
      <Feedback message={state.message} status={state.status} />
      <button className="min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:opacity-50" disabled={pending} type="submit">{pending ? copy.resigning : copy.resign}</button>
    </form>
  );
}

export function InvitationForm({ clubId, copy, locale }: { clubId: string; copy: Copy; locale: AppLocale }) {
  const [state, action, pending] = useActionState(createClubInvitationAction, initialMembershipActionState);
  return (
    <form action={action} className="space-y-4">
      <input name="clubId" type="hidden" value={clubId} />
      <input name="locale" type="hidden" value={locale} />
      <label className="block text-sm font-semibold" htmlFor="invitation-email">{copy.email}</label>
      <input className="h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm" id="invitation-email" name="email" required type="email" />
      <Feedback message={state.message} status={state.status} />
      {state.invitationPath ? <p className="break-all rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" dir="ltr">{state.invitationPath}</p> : null}
      <button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? copy.inviting : copy.invite}</button>
    </form>
  );
}

export function AcceptInvitationForm({ copy, locale, token }: { copy: Copy; locale: AppLocale; token: string }) {
  const [state, action, pending] = useActionState(acceptClubInvitationAction, initialMembershipActionState);
  return (
    <form action={action} className="space-y-4">
      <input name="locale" type="hidden" value={locale} />
      <input name="token" type="hidden" value={token} />
      <Feedback message={state.message} status={state.status} />
      <button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? copy.accepting : copy.accept}</button>
    </form>
  );
}

export function RevokeInvitationForm({ clubId, copy, invitationId, locale }: { clubId: string; copy: Copy; invitationId: string; locale: AppLocale }) {
  const [state, action, pending] = useActionState(revokeClubInvitationAction, initialMembershipActionState);
  return (
    <form action={action} className="mt-3 space-y-2">
      <input name="clubId" type="hidden" value={clubId} />
      <input name="invitationId" type="hidden" value={invitationId} />
      <input name="locale" type="hidden" value={locale} />
      <Feedback message={state.message} status={state.status} />
      <button className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50" disabled={pending} type="submit">{pending ? copy.revoking : copy.revoke}</button>
    </form>
  );
}

export type { Copy as MembershipFormCopy };
