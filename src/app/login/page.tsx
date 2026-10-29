import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Club ERP workspace.",
};

// The page reads query state to switch modes and show callback status.
export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ mode?: string; status?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const isSignUp = query.mode === "sign-up";
  const mode = isSignUp ? "sign-up" : "sign-in";

  return (
    <main className="grid min-h-screen bg-[var(--surface-canvas)] lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--text-strong)]"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--brand-strong)] text-xs font-bold text-white">
              CE
            </span>
            Club ERP
          </Link>

          <h1 className="mt-12 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)]">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-3 text-base leading-7 text-[var(--text-muted)]">
            {isSignUp
              ? "Use your university email to start your secure club workspace."
              : "Sign in to continue to your authorized university and club workspaces."}
          </p>

          {query.status === "confirmation-error" ? (
            <p
              className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              role="alert"
            >
              The confirmation link is invalid or expired. Request a new link
              and try again.
            </p>
          ) : null}

          <AuthForm mode={mode} />

          <p className="mt-7 text-center text-sm text-[var(--text-muted)]">
            {isSignUp ? "Already have an account?" : "New to Club ERP?"}{" "}
            <Link
              className="font-semibold text-teal-700 underline-offset-4 hover:underline"
              href={isSignUp ? "/login" : "/login?mode=sign-up"}
            >
              {isSignUp ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#0d3734] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.2),transparent_35%)]" />
        <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">
          Secure by design
        </p>
        <div className="relative max-w-xl">
          <p className="text-4xl font-medium leading-tight tracking-[-0.035em]">
            One trusted workspace for every club, team, event, and decision.
          </p>
          <p className="mt-6 max-w-lg text-base leading-8 text-teal-50/75">
            Access is scoped by university and club, enforced on the server and
            inside PostgreSQL—not just hidden in the interface.
          </p>
        </div>
        <p className="relative text-sm text-teal-50/60">
          University Club ERP &amp; Design Platform
        </p>
      </aside>
    </main>
  );
}
