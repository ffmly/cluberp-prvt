import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Workspace",
};

// Authenticated pages read request cookies and are intentionally allowed to
// block while the verified session is resolved.
export const instant = false;

const plannedModules = [
  "University administration",
  "Club workspaces",
  "Memberships",
  "Events and attendance",
  "Finance and assets",
  "Design Studio",
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const email = typeof claims.email === "string" ? claims.email : "Signed-in member";

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)] p-6 sm:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[var(--border-subtle)] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-strong)] text-sm font-bold text-white">
              CE
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                Club ERP
              </p>
              <p className="text-xs text-[var(--text-muted)]">{email}</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              className="rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-strong)] transition hover:border-slate-300 hover:bg-slate-50"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">
            Protected workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-[var(--text-strong)] sm:text-5xl">
            Your operating space is being prepared.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--text-muted)]">
            Your identity has been verified. University and club navigation will
            appear here only after the database assigns an active scoped role.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plannedModules.map((module) => (
              <div
                className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm"
                key={module}
              >
                <p className="font-semibold text-[var(--text-strong)]">{module}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  Access appears when your scoped permissions allow it.
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
