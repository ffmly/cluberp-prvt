"use client";

import { useActionState } from "react";

import type { AppLocale } from "@/i18n/locales";

import { setUserStatusAction } from "./actions";
import type { UserAccountStatus } from "./schemas";
import { initialUserStatusActionState } from "./state";

type UserStatusFormProps = {
  copy: {
    activate: string;
    activating: string;
    reason: string;
    reasonPlaceholder: string;
    suspend: string;
    suspending: string;
  };
  currentStatus: UserAccountStatus;
  locale: AppLocale;
  userId: string;
};

export function UserStatusForm({
  copy,
  currentStatus,
  locale,
  userId,
}: UserStatusFormProps) {
  const [state, formAction, isPending] = useActionState(
    setUserStatusAction,
    initialUserStatusActionState,
  );
  const newStatus = currentStatus === "active" ? "suspended" : "active";
  const id = `user-${userId}-reason`;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input name="locale" type="hidden" value={locale} />
      <input name="newStatus" type="hidden" value={newStatus} />
      <input name="targetUserId" type="hidden" value={userId} />
      <div>
        <label className="mb-2 block text-sm font-semibold" htmlFor={id}>
          {copy.reason}
        </label>
        <textarea
          aria-describedby={state.fieldErrors?.reason ? `${id}-error` : undefined}
          aria-invalid={Boolean(state.fieldErrors?.reason)}
          className="min-h-24 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          id={id}
          maxLength={500}
          minLength={5}
          name="reason"
          placeholder={copy.reasonPlaceholder}
          required
        />
        {state.fieldErrors?.reason ? (
          <p className="mt-2 text-xs text-rose-700" id={`${id}-error`}>
            {state.fieldErrors.reason}
          </p>
        ) : null}
      </div>
      {state.message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <button
        className={`inline-flex min-h-11 items-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
          newStatus === "suspended" ? "bg-rose-700" : "bg-teal-800"
        }`}
        disabled={isPending}
        type="submit"
      >
        {isPending
          ? newStatus === "suspended"
            ? copy.suspending
            : copy.activating
          : newStatus === "suspended"
            ? copy.suspend
            : copy.activate}
      </button>
    </form>
  );
}
