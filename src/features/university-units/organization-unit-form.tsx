"use client";

import { useActionState } from "react";

import type { AppLocale } from "@/i18n/locales";

import { saveOrganizationUnitAction } from "./actions";
import type {
  OrganizationUnitStatus,
  OrganizationUnitType,
} from "./schemas";
import { initialOrganizationUnitActionState } from "./state";

export type OrganizationUnitFormValues = {
  address?: string;
  code: string;
  id: string;
  name: string;
  parentId?: string;
  status: OrganizationUnitStatus;
};

export type ParentOption = { id: string; name: string };

type OrganizationUnitFormCopy = {
  address: string;
  addressPlaceholder: string;
  code: string;
  codeHint: string;
  create: string;
  creating: string;
  name: string;
  namePlaceholder: string;
  noParents: string;
  parent: string;
  save: string;
  saving: string;
  selectParent: string;
  status: string;
  statuses: Record<OrganizationUnitStatus, string>;
};

type OrganizationUnitFormProps = {
  copy: OrganizationUnitFormCopy;
  locale: AppLocale;
  parentOptions?: ParentOption[];
  unit?: OrganizationUnitFormValues;
  unitType: OrganizationUnitType;
  universityId: string;
};

export function OrganizationUnitForm({
  copy,
  locale,
  parentOptions = [],
  unit,
  unitType,
  universityId,
}: OrganizationUnitFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveOrganizationUnitAction,
    initialOrganizationUnitActionState,
  );
  const intent = unit ? "update" : "create";
  const idPrefix = unit ? `${unitType}-${unit.id}` : `new-${unitType}`;
  const needsParent = unitType !== "campus";
  const parentUnavailable = needsParent && parentOptions.length === 0;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input name="intent" type="hidden" value={intent} />
      <input name="locale" type="hidden" value={locale} />
      <input name="unitType" type="hidden" value={unitType} />
      <input name="universityId" type="hidden" value={universityId} />
      {unit ? <input name="unitId" type="hidden" value={unit.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          defaultValue={unit?.name}
          error={state.fieldErrors?.name}
          id={`${idPrefix}-name`}
          label={copy.name}
          name="name"
          placeholder={copy.namePlaceholder}
        />
        <TextField
          defaultValue={unit?.code}
          error={state.fieldErrors?.code}
          hint={copy.codeHint}
          id={`${idPrefix}-code`}
          label={copy.code}
          maxLength={20}
          name="code"
          placeholder="MAIN"
        />
        {needsParent ? (
          <SelectField
            defaultValue={unit?.parentId ?? ""}
            error={state.fieldErrors?.parentId}
            id={`${idPrefix}-parent`}
            label={copy.parent}
            name="parentId"
            options={parentOptions.map((option) => [option.id, option.name])}
            placeholder={copy.selectParent}
          />
        ) : (
          <TextField
            defaultValue={unit?.address}
            error={state.fieldErrors?.address}
            id={`${idPrefix}-address`}
            label={copy.address}
            name="address"
            placeholder={copy.addressPlaceholder}
            required={false}
          />
        )}
        <SelectField
          defaultValue={unit?.status ?? "active"}
          error={state.fieldErrors?.status}
          id={`${idPrefix}-status`}
          label={copy.status}
          name="status"
          options={Object.entries(copy.statuses)}
        />
      </div>

      {parentUnavailable ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {copy.noParents}
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
        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[var(--brand-strong)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending || parentUnavailable}
        type="submit"
      >
        {isPending
          ? unit
            ? copy.saving
            : copy.creating
          : unit
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
  maxLength?: number;
  name: "address" | "code" | "name";
  placeholder: string;
  required?: boolean;
};

function TextField({
  defaultValue,
  error,
  hint,
  id,
  label,
  maxLength,
  name,
  placeholder,
  required = true,
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
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        required={required}
        type="text"
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
  defaultValue: string;
  error?: string;
  id: string;
  label: string;
  name: "parentId" | "status";
  options: [string, string][];
  placeholder?: string;
};

function SelectField({
  defaultValue,
  error,
  id,
  label,
  name,
  options,
  placeholder,
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
        defaultValue={defaultValue}
        id={id}
        name={name}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map(([value, text]) => (
          <option key={value} value={value}>
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
