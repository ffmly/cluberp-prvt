"use client";

import { useActionState } from "react";

import type { AppLocale } from "@/i18n/locales";

import { saveUniversityAction } from "./actions";
import type { UniversityStatus } from "./schemas";
import { initialUniversityActionState } from "./state";

export type UniversityFormValues = {
  defaultCurrency: string;
  defaultLocale: AppLocale;
  defaultTimeZone: string;
  id: string;
  name: string;
  slug: string;
  status: UniversityStatus;
};

type UniversityFormCopy = {
  create: string;
  creating: string;
  currency: string;
  currencyHint: string;
  locale: string;
  locales: Record<AppLocale, string>;
  name: string;
  namePlaceholder: string;
  save: string;
  saving: string;
  slug: string;
  slugHint: string;
  status: string;
  statuses: Record<UniversityStatus, string>;
  timeZone: string;
  timeZoneHint: string;
};

type UniversityFormProps = {
  copy: UniversityFormCopy;
  locale: AppLocale;
  university?: UniversityFormValues;
};

export function UniversityForm({
  copy,
  locale,
  university,
}: UniversityFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveUniversityAction,
    initialUniversityActionState,
  );
  const intent = university ? "update" : "create";
  const idPrefix = university ? `university-${university.id}` : "new-university";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input name="intent" type="hidden" value={intent} />
      <input name="locale" type="hidden" value={locale} />
      {university ? (
        <input name="universityId" type="hidden" value={university.id} />
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <TextField
          autoComplete="organization"
          defaultValue={university?.name}
          error={state.fieldErrors?.name}
          id={`${idPrefix}-name`}
          label={copy.name}
          name="name"
          placeholder={copy.namePlaceholder}
        />
        <TextField
          autoComplete="off"
          defaultValue={university?.slug}
          error={state.fieldErrors?.slug}
          hint={copy.slugHint}
          id={`${idPrefix}-slug`}
          label={copy.slug}
          name="slug"
          placeholder="example-university"
        />
        <SelectField
          defaultValue={university?.status ?? "draft"}
          error={state.fieldErrors?.status}
          id={`${idPrefix}-status`}
          label={copy.status}
          name="status"
          options={Object.entries(copy.statuses)}
        />
        <SelectField
          defaultValue={university?.defaultLocale ?? locale}
          error={state.fieldErrors?.defaultLocale}
          id={`${idPrefix}-locale`}
          label={copy.locale}
          name="defaultLocale"
          options={Object.entries(copy.locales)}
        />
        <TextField
          autoComplete="off"
          defaultValue={university?.defaultTimeZone ?? "Africa/Algiers"}
          error={state.fieldErrors?.defaultTimeZone}
          hint={copy.timeZoneHint}
          id={`${idPrefix}-time-zone`}
          label={copy.timeZone}
          name="defaultTimeZone"
          placeholder="Africa/Algiers"
        />
        <TextField
          autoComplete="off"
          defaultValue={university?.defaultCurrency ?? "DZD"}
          error={state.fieldErrors?.defaultCurrency}
          hint={copy.currencyHint}
          id={`${idPrefix}-currency`}
          label={copy.currency}
          maxLength={3}
          name="defaultCurrency"
          placeholder="DZD"
        />
      </div>

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
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-strong)] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-950/10 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending
          ? university
            ? copy.saving
            : copy.creating
          : university
            ? copy.save
            : copy.create}
      </button>
    </form>
  );
}

type TextFieldProps = {
  autoComplete: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
  id: string;
  label: string;
  maxLength?: number;
  name:
    | "name"
    | "slug"
    | "defaultTimeZone"
    | "defaultCurrency";
  placeholder: string;
};

function TextField({
  autoComplete,
  defaultValue,
  error,
  hint,
  id,
  label,
  maxLength,
  name,
  placeholder,
}: TextFieldProps) {
  const descriptionId = `${id}-description`;

  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold text-[var(--text-strong)]"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        aria-describedby={error || hint ? descriptionId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 text-sm text-[var(--text-strong)] outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        defaultValue={defaultValue}
        id={id}
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        required
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
  name: "status" | "defaultLocale";
  options: [string, string][];
};

function SelectField({
  defaultValue,
  error,
  id,
  label,
  name,
  options,
}: SelectFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold text-[var(--text-strong)]"
        htmlFor={id}
      >
        {label}
      </label>
      <select
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 text-sm text-[var(--text-strong)] outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        defaultValue={defaultValue}
        id={id}
        name={name}
      >
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
