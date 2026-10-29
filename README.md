# Club ERP

A secure, multi-tenant University Club Management ERP and Design Platform built with Next.js, TypeScript, PostgreSQL, and Supabase.

The product and architecture source of truth is [`docs/PROJECT_MASTER_PLAN.md`](docs/PROJECT_MASTER_PLAN.md).

## Current status

The repository is in Phase 1 (technical foundation). The Next.js baseline is operational; Supabase authentication, migrations, RLS, and the application shell are the next implementation milestones.

## Requirements

- Node.js 24.x
- npm 11.x
- Docker Desktop (for local Supabase)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run check` runs all three in sequence.

## Project rules

- Migrations under `supabase/migrations` are the database source of truth.
- Authorization is enforced on the server and through PostgreSQL RLS.
- Do not commit credentials. Copy `.env.example` to `.env.local` once it is introduced.
- Update the master plan when an implementation decision changes.
- Report only tests and integrations that were actually verified.

See `project.md` for the original product brief.
