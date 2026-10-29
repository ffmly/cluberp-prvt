"use client";

import { useActionState } from "react";

import { signInAction, signUpAction } from "./actions";
import { initialAuthActionState } from "./state";

type AuthFormProps = {
  copy: {
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    passwordHint: string;
    signIn: string;
    signUp: string;
    signingIn: string;
    signingUp: string;
  };
  locale: "en" | "ar";
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ copy, locale, mode }: AuthFormProps) {
  const isSignUp = mode === "sign-up";
  const action = isSignUp ? signUpAction : signInAction;
  const [state, formAction, isPending] = useActionState(
    action,
    initialAuthActionState,
  );
  const submitLabel = isPending
    ? isSignUp
      ? copy.signingUp
      : copy.signingIn
    : isSignUp
      ? copy.signUp
      : copy.signIn;

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <input name="locale" type="hidden" value={locale} />
      {isSignUp ? (
        <Field
          autoComplete="name"
          error={state.fieldErrors?.displayName}
          label={copy.fullName}
          name="displayName"
          placeholder={copy.fullNamePlaceholder}
          type="text"
        />
      ) : null}

      <Field
        autoComplete="email"
        error={state.fieldErrors?.email}
        label={copy.email}
        name="email"
        placeholder={copy.emailPlaceholder}
        type="email"
      />

      <Field
        autoComplete={isSignUp ? "new-password" : "current-password"}
        error={state.fieldErrors?.password}
        hint={isSignUp ? copy.passwordHint : undefined}
        label={copy.password}
        name="password"
        placeholder={copy.passwordPlaceholder}
        type="password"
      />

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
        className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--brand-strong)] px-5 text-sm font-semibold text-white shadow-lg shadow-teal-950/10 transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}

type FieldProps = {
  autoComplete: string;
  error?: string;
  hint?: string;
  label: string;
  name: "displayName" | "email" | "password";
  placeholder: string;
  type: "text" | "email" | "password";
};

function Field({
  autoComplete,
  error,
  hint,
  label,
  name,
  placeholder,
  type,
}: FieldProps) {
  const descriptionId = `${name}-description`;

  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold text-[var(--text-strong)]"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        aria-describedby={error || hint ? descriptionId : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-4 text-sm text-[var(--text-strong)] outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
        id={name}
        name={name}
        placeholder={placeholder}
        required
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
