"use client";

import { useActionState, useState } from "react";

import type { AppLocale } from "@/i18n/locales";

import { saveStaffAssignmentAction } from "./actions";
import type {
  StaffAssignmentStatus,
  StaffScopeType,
  StaffType,
} from "./schemas";
import { initialStaffAssignmentActionState } from "./state";

export type StaffAssignmentFormValues = {
  id: string;
  staffType: StaffType;
  status: StaffAssignmentStatus;
  title?: string;
};

export type StaffScopeOption = { id: string; name: string };

type StaffAssignmentFormCopy = {
  create: string;
  creating: string;
  email: string;
  emailHint: string;
  emailPlaceholder: string;
  noScopeOptions: string;
  save: string;
  saving: string;
  scope: string;
  scopeTypes: Record<StaffScopeType, string>;
  selectScope: string;
  staffType: string;
  staffTypes: Record<StaffType, string>;
  status: string;
  statuses: Record<StaffAssignmentStatus, string>;
  title: string;
  titlePlaceholder: string;
};

type StaffAssignmentFormProps = {
  assignment?: StaffAssignmentFormValues;
  copy: StaffAssignmentFormCopy;
  locale: AppLocale;
  scopeOptions: Record<Exclude<StaffScopeType, "university">, StaffScopeOption[]>;
  universityId: string;
};

export function StaffAssignmentForm({
  assignment,
  copy,
  locale,
  scopeOptions,
  universityId,
}: StaffAssignmentFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveStaffAssignmentAction,
    initialStaffAssignmentActionState,
  );
  const [scopeType, setScopeType] = useState<StaffScopeType>("university");
  const intent = assignment ? "update" : "create";
  const idPrefix = assignment ? `staff-${assignment.id}` : "new-staff";
  const selectedScopeOptions =
    scopeType === "university" ? [] : scopeOptions[scopeType];
  const scopeUnavailable =
    !assignment && scopeType !== "university" && selectedScopeOptions.length === 0;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input name="intent" type="hidden" value={intent} />
      <input name="locale" type="hidden" value={locale} />
      <input name="universityId" type="hidden" value={universityId} />
      {assignment ? (
        <input name="assignmentId" type="hidden" value={assignment.id} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {!assignment ? (
          <TextField
            error={state.fieldErrors?.email}
            hint={copy.emailHint}
            id={`${idPrefix}-email`}
            label={copy.email}
            name="email"
            placeholder={copy.emailPlaceholder}
            type="email"
          />
        ) : null}

        {!assignment ? (
          <SelectField
            id={`${idPrefix}-scope-type`}
            label={copy.scope}
            name="scopeType"
            onChange={(value) => setScopeType(value as StaffScopeType)}
            options={Object.entries(copy.scopeTypes)}
            value={scopeType}
          />
        ) : null}

        {!assignment && scopeType !== "university" ? (
          <SelectField
            defaultValue=""
            error={state.fieldErrors?.scopeId}
            id={`${idPrefix}-scope-id`}
            label={copy.scopeTypes[scopeType]}
            name="scopeId"
            options={selectedScopeOptions.map((option) => [
              option.id,
              option.name,
            ])}
            placeholder={copy.selectScope}
          />
        ) : null}

        <SelectField
          defaultValue={assignment?.staffType ?? "administrator"}
          error={state.fieldErrors?.staffType}
          id={`${idPrefix}-staff-type`}
          label={copy.staffType}
          name="staffType"
          options={Object.entries(copy.staffTypes)}
        />

        <TextField
          defaultValue={assignment?.title}
          error={state.fieldErrors?.title}
          id={`${idPrefix}-title`}
          label={copy.title}
          name="title"
          placeholder={copy.titlePlaceholder}
          required={false}
          type="text"
        />

        <SelectField
          defaultValue={assignment?.status ?? "active"}
          error={state.fieldErrors?.status}
          id={`${idPrefix}-status`}
          label={copy.status}
          name="status"
          options={Object.entries(copy.statuses).filter(
            ([status]) => assignment || status !== "ended",
          )}
        />
      </div>

      {scopeUnavailable ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {copy.noScopeOptions}
        </p>
      ) : null}

      {state.message ? (
        <p
          className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
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
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-strong)] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending || scopeUnavailable}
        type="submit"
      >
        {isPending
          ? assignment
            ? copy.saving
            : copy.creating
          : assignment
            ? copy.save
            : copy.create}
      </button>
    </form>
  );
}

type TextFieldProps = {
  defaultValue?: string;
  error?: string;
  hint?: string;
  id: string;
  label: string;
  name: "email" | "title";
  placeholder: string;
  required?: boolean;
  type: "email" | "text";
};

function TextField({
  defaultValue,
  error,
  hint,
  id,
  label,
  name,
  placeholder,
  required = true,
  type,
}: TextFieldProps) {
  const descriptionId = `${id}-description`;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={error || hint ? descriptionId : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        defaultValue={defaultValue}
        id={id}
        name={name}
        maxLength={name === "title" ? 160 : name === "email" ? 320 : undefined}
        placeholder={placeholder}
        required={required}
        type={type}
      />
      {error || hint ? (
        <p
          className={`mt-2 text-xs ${error ? "text-rose-700" : "text-[var(--text-muted)]"}`}
          id={descriptionId}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  defaultValue?: string;
  error?: string;
  id: string;
  label: string;
  name: "scopeId" | "scopeType" | "staffType" | "status";
  onChange?: (value: string) => void;
  options: (readonly [string, string])[];
  placeholder?: string;
  value?: string;
};

function SelectField({
  defaultValue,
  error,
  id,
  label,
  name,
  onChange,
  options,
  placeholder,
  value,
}: SelectFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold" htmlFor={id}>
        {label}
      </label>
      <select
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        defaultValue={value === undefined ? defaultValue : undefined}
        id={id}
        name={name}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        value={value}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map(([optionValue, text]) => (
          <option key={optionValue} value={optionValue}>
            {text}
          </option>
        ))}
      </select>
      {error ? (
        <p className="mt-2 text-xs text-rose-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
