# Club ERP

A secure, multi-tenant University Club Management ERP and Design Platform built with Next.js, TypeScript, PostgreSQL, and Supabase.

The product and architecture source of truth is [`docs/PROJECT_MASTER_PLAN.md`](docs/PROJECT_MASTER_PLAN.md). Use the [`docs/LOCAL_DEMO_GUIDE.md`](docs/LOCAL_DEMO_GUIDE.md) to explore every implemented persona and workflow locally.

## Current status

Phase 3 is complete. The repository includes the technical foundation, scoped platform and university administration, club workspaces, membership operations, events and attendance, versioned forms, tasks, protected document metadata, announcements, and in-app notifications. Phase 4 business operations are next.

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

After the Phase 3 browser fixture has created a working university, club, and team, load the local exploration personas with:

```powershell
Get-Content -Raw supabase\fixtures\demo-personas.sql |
  docker exec -i supabase_db_club-erp psql -U postgres -d postgres
```

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

`npm run check` runs lint, generated-route type checking, 36 unit/schema tests, and the production build. The database baseline contains 229 pgTAP assertions, and the browser baseline contains five Playwright flows.

## Project rules

- Migrations under `supabase/migrations` are the database source of truth.
- Authorization is enforced on the server and through PostgreSQL RLS.
- Do not commit credentials. Copy `.env.example` to `.env.local` once it is introduced.
- Update the master plan when an implementation decision changes.
- Report only tests and integrations that were actually verified.

See `project.md` for the original product brief.
