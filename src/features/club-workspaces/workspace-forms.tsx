"use client";

import { useActionState } from "react";

import type { AppLocale } from "@/i18n/locales";

import {
  archiveClubTeamAction,
  assignClubRoleAction,
  lookupClubCandidateAction,
  revokeClubRoleAction,
  saveClubTeamAction,
} from "./actions";
import {
  initialClubCandidateActionState,
  initialClubWorkspaceActionState,
} from "./state";

type Copy = {
  archive: string;
  archiving: string;
  assign: string;
  assigning: string;
  candidateEmail: string;
  candidateHint: string;
  description: string;
  find: string;
  finding: string;
  name: string;
  reason: string;
  revoke: string;
  revoking: string;
  role: string;
  save: string;
  saving: string;
};

type Team = {
  description: string | null;
  id: string;
  name: string;
};

type Role = { id: string; name: string };

function Feedback({ message, status }: { message?: string; status: string }) {
  if (!message) return null;
  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function TeamForm({
  clubId,
  copy,
  locale,
  team,
}: {
  clubId: string;
  copy: Copy;
  locale: AppLocale;
  team?: Team;
}) {
  const [state, action, pending] = useActionState(
    saveClubTeamAction,
    initialClubWorkspaceActionState,
  );
  const [archiveState, archiveAction, archivePending] = useActionState(
    archiveClubTeamAction,
    initialClubWorkspaceActionState,
  );

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <input name="clubId" type="hidden" value={clubId} />
        <input name="locale" type="hidden" value={locale} />
        <input name="teamId" type="hidden" value={team?.id ?? ""} />
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor={`team-name-${team?.id ?? "new"}`}>
            {copy.name}
          </label>
          <input
            className="h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            defaultValue={team?.name}
            id={`team-name-${team?.id ?? "new"}`}
            maxLength={120}
            name="name"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor={`team-description-${team?.id ?? "new"}`}>
            {copy.description}
          </label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm"
            defaultValue={team?.description ?? ""}
            id={`team-description-${team?.id ?? "new"}`}
            maxLength={2000}
            name="description"
          />
        </div>
        <Feedback message={state.message} status={state.status} />
        <button
          className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {pending ? copy.saving : copy.save}
        </button>
      </form>
      {team ? (
        <form action={archiveAction}>
          <input name="clubId" type="hidden" value={clubId} />
          <input name="locale" type="hidden" value={locale} />
          <input name="teamId" type="hidden" value={team.id} />
          <Feedback message={archiveState.message} status={archiveState.status} />
          <button
            className="mt-3 min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:opacity-50"
            disabled={archivePending}
            type="submit"
          >
            {archivePending ? copy.archiving : copy.archive}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function LeadershipAssignmentForm({
  clubId,
  copy,
  locale,
  roles,
}: {
  clubId: string;
  copy: Copy;
  locale: AppLocale;
  roles: Role[];
}) {
  const [lookupState, lookupAction, lookupPending] = useActionState(
    lookupClubCandidateAction,
    initialClubCandidateActionState,
  );
  const [assignState, assignAction, assignPending] = useActionState(
    assignClubRoleAction,
    initialClubWorkspaceActionState,
  );

  return (
    <div className="space-y-5">
      <form action={lookupAction} className="space-y-4">
        <input name="clubId" type="hidden" value={clubId} />
        <input name="locale" type="hidden" value={locale} />
        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="leadership-candidate-email">
            {copy.candidateEmail}
          </label>
          <input
            className="h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
            id="leadership-candidate-email"
            name="email"
            required
            type="email"
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">{copy.candidateHint}</p>
        </div>
        <Feedback message={lookupState.message} status={lookupState.status} />
        <button
          className="min-h-11 rounded-xl border border-teal-200 px-5 text-sm font-semibold text-teal-800 disabled:opacity-50"
          disabled={lookupPending}
          type="submit"
        >
          {lookupPending ? copy.finding : copy.find}
        </button>
      </form>
      {lookupState.candidate ? (
        <form action={assignAction} className="space-y-4 rounded-2xl bg-slate-50 p-4">
          <input name="clubId" type="hidden" value={clubId} />
          <input name="locale" type="hidden" value={locale} />
          <input name="userId" type="hidden" value={lookupState.candidate.userId} />
          <p className="font-semibold">{lookupState.candidate.displayName}</p>
          <p className="text-sm text-[var(--text-muted)]" dir="ltr">{lookupState.candidate.email}</p>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="leadership-role">
              {copy.role}
            </label>
            <select
              className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm"
              id="leadership-role"
              name="roleId"
              required
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <Feedback message={assignState.message} status={assignState.status} />
          <button
            className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={assignPending || roles.length === 0}
            type="submit"
          >
            {assignPending ? copy.assigning : copy.assign}
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function RevokeLeadershipForm({
  assignmentId,
  clubId,
  copy,
  locale,
}: {
  assignmentId: string;
  clubId: string;
  copy: Copy;
  locale: AppLocale;
}) {
  const [state, action, pending] = useActionState(
    revokeClubRoleAction,
    initialClubWorkspaceActionState,
  );
  return (
    <form action={action} className="mt-4 space-y-3 border-t border-[var(--border-subtle)] pt-4">
      <input name="assignmentId" type="hidden" value={assignmentId} />
      <input name="clubId" type="hidden" value={clubId} />
      <input name="locale" type="hidden" value={locale} />
      <label className="block text-sm font-semibold" htmlFor={`revoke-reason-${assignmentId}`}>
        {copy.reason}
      </label>
      <input
        className="h-10 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm"
        id={`revoke-reason-${assignmentId}`}
        maxLength={500}
        minLength={5}
        name="reason"
        required
      />
      <Feedback message={state.message} status={state.status} />
      <button
        className="min-h-10 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 disabled:opacity-50"
        disabled={pending}
        type="submit"
      >
        {pending ? copy.revoking : copy.revoke}
      </button>
    </form>
  );
}
