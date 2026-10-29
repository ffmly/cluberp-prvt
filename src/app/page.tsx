const foundationQualities = [
  ["Tenant isolation", "University and club scoped"],
  ["Secure by default", "PostgreSQL RLS enforced"],
  ["Built for teams", "Role-aware workflows"],
] as const;

const foundationMilestones = [
  ["Architecture and security plan", true],
  ["Next.js application baseline", true],
  ["Supabase authentication and schema", false],
  ["Role-aware application shell", false],
] as const;

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-1 overflow-hidden bg-[var(--surface-canvas)] px-6 py-10 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.12),transparent_30%)]" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-strong)] text-sm font-bold tracking-tight text-white shadow-lg shadow-teal-950/10">
              CE
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-[var(--text-strong)]">
                Club ERP
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                University club operations
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--border-subtle)] bg-white/70 px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] backdrop-blur">
            Foundation phase
          </span>
        </header>

        <section className="grid flex-1 items-center gap-16 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:py-28">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-strong)]">
              One platform. Every club workflow.
            </p>
            <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--text-strong)] sm:text-6xl lg:text-7xl">
              Run university clubs with clarity and control.
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-[var(--text-muted)] sm:text-xl">
              A secure multi-university workspace for memberships, events,
              finances, teams, documents, reporting, and controlled creative
              work.
            </p>

            <dl className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
              {foundationQualities.map(([term, description]) => (
                <div
                  key={term}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-white/65 p-5 shadow-sm backdrop-blur"
                >
                  <dt className="text-sm font-semibold text-[var(--text-strong)]">
                    {term}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="rounded-[2rem] border border-white/80 bg-[var(--surface-strong)] p-7 shadow-2xl shadow-slate-900/10 sm:p-9">
            <div className="flex items-center gap-3">
              <span className="relative flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50 motion-reduce:animate-none" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
              </span>
              <p className="text-sm font-semibold text-[var(--text-strong)]">
                Implementation started
              </p>
            </div>
            <p className="mt-5 text-sm leading-7 text-[var(--text-muted)]">
              The architecture and delivery plan are established. The current
              milestone is the production foundation: authentication,
              authorization, database migrations, and the application shell.
            </p>
            <div className="mt-7 space-y-3" aria-label="Foundation milestones">
              {foundationMilestones.map(([label, complete]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3"
                >
                  <span
                    aria-hidden="true"
                    className={`grid size-5 place-items-center rounded-full text-xs ${
                      complete
                        ? "bg-emerald-100 text-emerald-700"
                        : "border border-slate-300 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="text-sm font-medium text-[var(--text-strong)]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <footer className="border-t border-[var(--border-subtle)] pt-6 text-xs text-[var(--text-muted)]">
          Built for accountable, accessible, and secure university club
          operations.
        </footer>
      </div>
    </main>
  );
}
