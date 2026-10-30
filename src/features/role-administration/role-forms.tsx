"use client";

import { useActionState } from "react";

import type { AppLocale } from "@/i18n/locales";

import { assignRoleAction, changeRoleLifecycleAction, saveRoleAction } from "./actions";
import { initialRoleActionState } from "./state";

export type PermissionOption = { description: string; key: string; name: string; scope: string };

type Copy = {
  archive: string; archiving: string; assign: string; assigning: string;
  description: string; key: string; name: string; permissions: string;
  reason: string; reasonPlaceholder: string; revoke: string; revoking: string;
  save: string; saving: string; user: string;
};

function Feedback({ state }: { state: typeof initialRoleActionState }) {
  return state.message ? <p className={`rounded-xl border px-4 py-3 text-sm ${state.status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null;
}

export function RoleForm({ copy, locale, permissions, role }: { copy: Copy; locale: AppLocale; permissions: PermissionOption[]; role?: { description?: string; id: string; key: string; name: string; permissionKeys: string[] } }) {
  const [state, action, pending] = useActionState(saveRoleAction, initialRoleActionState);
  const prefix = role ? `role-${role.id}` : "new-role";
  return <form action={action} className="space-y-5" noValidate>
    <input name="locale" type="hidden" value={locale} />
    {role ? <input name="roleId" type="hidden" value={role.id} /> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <Field defaultValue={role?.key} id={`${prefix}-key`} label={copy.key} maxLength={64} name="key" />
      <Field defaultValue={role?.name} id={`${prefix}-name`} label={copy.name} maxLength={120} name="name" />
    </div>
    <Field defaultValue={role?.description} id={`${prefix}-description`} label={copy.description} maxLength={500} name="description" />
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{copy.permissions}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {permissions.map((permission) => <label className="flex gap-3 rounded-xl border border-[var(--border-subtle)] p-3" key={permission.key}>
          <input className="mt-1 size-4" defaultChecked={role?.permissionKeys.includes(permission.key)} name="permissionKeys" type="checkbox" value={permission.key} />
          <span><span className="block text-sm font-semibold">{permission.name}</span><span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{permission.description}</span></span>
        </label>)}
      </div>
    </fieldset>
    <Feedback state={state} />
    <button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? copy.saving : copy.save}</button>
  </form>;
}

function Field({ defaultValue, id, label, maxLength, name }: { defaultValue?: string; id: string; label: string; maxLength: number; name: string }) {
  return <div><label className="mb-2 block text-sm font-semibold" htmlFor={id}>{label}</label><input className="h-11 w-full rounded-xl border border-[var(--border-subtle)] px-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10" defaultValue={defaultValue} id={id} maxLength={maxLength} name={name} required={name !== "description"} /></div>;
}

export function RoleAssignmentForm({ copy, locale, roles, users }: { copy: Copy; locale: AppLocale; roles: { id: string; name: string }[]; users: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(assignRoleAction, initialRoleActionState);
  return <form action={action} className="space-y-4"><input name="locale" type="hidden" value={locale} /><Select id="assignment-role" label={copy.name} name="roleId" options={roles} /><Select id="assignment-user" label={copy.user} name="userId" options={users} /><Feedback state={state} /><button className="min-h-11 rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending || !roles.length || !users.length} type="submit">{pending ? copy.assigning : copy.assign}</button></form>;
}

function Select({ id, label, name, options }: { id: string; label: string; name: string; options: { id: string; name: string }[] }) {
  return <div><label className="mb-2 block text-sm font-semibold" htmlFor={id}>{label}</label><select className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm" id={id} name={name}>{options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></div>;
}

export function RoleLifecycleForm({ copy, intent, locale, targetId }: { copy: Copy; intent: "archive" | "revoke"; locale: AppLocale; targetId: string }) {
  const [state, action, pending] = useActionState(changeRoleLifecycleAction, initialRoleActionState);
  const id = `${intent}-${targetId}-reason`;
  return <form action={action} className="space-y-4"><input name="intent" type="hidden" value={intent} /><input name="locale" type="hidden" value={locale} /><input name="targetId" type="hidden" value={targetId} /><div><label className="mb-2 block text-sm font-semibold" htmlFor={id}>{copy.reason}</label><textarea className="min-h-20 w-full rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm" id={id} maxLength={500} minLength={5} name="reason" placeholder={copy.reasonPlaceholder} required /></div><Feedback state={state} /><button className="min-h-11 rounded-xl bg-rose-700 px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? intent === "archive" ? copy.archiving : copy.revoking : intent === "archive" ? copy.archive : copy.revoke}</button></form>;
}
