import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { AuthForm } from "@/features/auth/auth-form";
import { isAppLocale } from "@/i18n/locales";
import { Link } from "@/i18n/navigation";

export const instant = false;

type LoginPageProps = PageProps<"/[locale]/login">;

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "Auth" });

  return {
    title: t("signIn"),
    description: t("signInDescription"),
  };
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);

  if (!isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Auth" });
  const isSignUp = query.mode === "sign-up";
  const mode = isSignUp ? "sign-up" : "sign-in";

  const formCopy = {
    fullName: t("fullName"),
    fullNamePlaceholder: t("fullNamePlaceholder"),
    email: t("email"),
    emailPlaceholder: t("emailPlaceholder"),
    password: t("password"),
    passwordPlaceholder: t("passwordPlaceholder"),
    passwordHint: t("passwordHint"),
    signIn: t("signIn"),
    signUp: t("signUp"),
    signingIn: t("signingIn"),
    signingUp: t("signingUp"),
  };

  return (
    <main className="grid min-h-screen bg-[var(--surface-canvas)] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between gap-4">
            <Link
              className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--text-strong)]"
              href="/"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-[var(--brand-strong)] text-xs font-bold text-white">
                CE
              </span>
              Club ERP
            </Link>
            <LocaleSwitcher
              href={isSignUp ? "/login?mode=sign-up" : "/login"}
              locale={locale}
            />
          </div>

          <h1 className="mt-12 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)]">
            {isSignUp ? t("signUpTitle") : t("signInTitle")}
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
            {isSignUp ? t("signUpDescription") : t("signInDescription")}
          </p>

          {query.status === "confirmation-error" ? (
            <p
              className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="alert"
            >
              {t("confirmationError")}
            </p>
          ) : null}

          <AuthForm copy={formCopy} key={mode} locale={locale} mode={mode} />

          <p className="mt-7 text-center text-sm text-[var(--text-muted)]">
            {isSignUp ? t("existingUser") : t("newUser")} {" "}
            <Link
              className="font-semibold text-teal-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              href={isSignUp ? "/login" : "/login?mode=sign-up"}
            >
              {isSignUp ? t("signIn") : t("signUp")}
            </Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#0d3734] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.2),transparent_35%)]" />
        <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">
          {t("secureByDesign")}
        </p>
        <div className="relative max-w-xl">
          <p className="text-4xl font-medium leading-tight tracking-[-0.035em]">
            {t("asideTitle")}
          </p>
          <p className="mt-6 max-w-lg text-base leading-8 text-teal-50/75">
            {t("asideDescription")}
          </p>
        </div>
        <p className="relative text-sm text-teal-50/60">
          {t("productName")}
        </p>
      </aside>
    </main>
  );
}
