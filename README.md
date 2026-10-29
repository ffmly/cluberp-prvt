# Club ERP

A secure, multi-tenant University Club Management ERP and Design Platform built with Next.js, TypeScript, PostgreSQL, and Supabase.

The product and architecture source of truth is [`docs/PROJECT_MASTER_PLAN.md`](docs/PROJECT_MASTER_PLAN.md).

## Current status

The repository is in Phase 1 (technical foundation). The Next.js baseline, Supabase SSR boundary, email/password auth UI, and initial identity/organization migration are implemented. Live local Auth and RLS verification are pending recovery of the local Docker engine.

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

## Local Supabase

Copy `.env.example` to `.env.local`, start Docker Desktop, then run:

```bash
npm run db:start
npm run db:reset
npm run db:test
npm run db:lint
npm run db:types
```

Stop the local stack without deleting its data with `npm run db:stop`.

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
