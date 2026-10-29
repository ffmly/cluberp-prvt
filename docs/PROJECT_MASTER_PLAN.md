# University Club ERP & Design Platform — Master Plan

**Status:** Initial architecture baseline  
**Last updated:** 2026-10-29  
**Owners:** Project owner and a single implementing developer  
**Source specification:** [`project.md`](../project.md)  

This document is the single source of truth for product scope, architecture, data design, security boundaries, implementation order, and definition of done. It must be updated in the same change whenever implementation alters an architectural decision or completes a roadmap item.

## 1. Repository baseline

The repository was inspected on 2026-10-29. It was a new, empty GitHub repository with no branch or history. The local workspace contained only `project.md`. There was no application, package manifest, database configuration, migration, test, environment file, documentation, or existing functionality to preserve.

Consequences:

- The project will be created as a greenfield Next.js App Router application.
- The initial migration series can establish consistent conventions without a compatibility layer.
- No claim is made that Supabase, Cloudinary, Canva, email, monitoring, or deployment credentials exist.
- External integrations must degrade safely when unconfigured.

## 2. Product vision and release boundaries

The product is a multi-tenant university club operating system. It gives platform operators, university staff, club leaders, supervisors, and students a single secure product for club governance, memberships, events, forms, tasks, documents, finance, assets, sponsors, certificates, reporting, notifications, and controlled creative work.

The experience must feel like one SaaS product: a user signs in once, selects an authorized university/club context, sees permission-aware navigation, and works on data whose scope is visible at all times.

### 2.1 Initial production release

The initial production release includes:

1. Authentication, profiles, account status, and protected application shell.
2. Platform, university, club, team, and membership hierarchy.
3. Configurable RBAC with server checks and RLS enforcement.
4. University and club approval workflows.
5. Membership applications and role assignments.
6. Events, registration, waitlists, attendance, and certificates.
7. Versioned dynamic forms.
8. Tasks, announcements, notifications, documents, and media metadata.
9. Club budgets, funding requests, expenses, assets, and sponsors.
10. Authorized dashboards, reports, and CSV exports.
11. Design Studio templates, access grants, structured design projects, review, versioning, and exports.
12. English and Arabic-ready layouts, with documented translation coverage.

### 2.2 Deliberately out of scope for the initial release

- A full double-entry accounting ledger, payroll, invoicing, or payment processing.
- A general-purpose Canva/Figma competitor. The native Design Studio is a controlled template editor, not a free-form professional design suite.
- Guaranteed Canva integration before OAuth credentials, account eligibility, and Canva review requirements are satisfied.
- SMS, WhatsApp, and push delivery. In-app notifications are the baseline; email is conditional on a configured provider.
- Real-time collaborative editing, offline-first operation, native mobile apps, and public marketplace extensions.
- Automated university identity-provider federation unless an institution supplies its IdP requirements.
- AI-generated content or moderation.

## 3. Functional requirements

### 3.1 Platform administration

- Manage universities, platform staff, global settings, announcements, and operational status.
- View platform-wide statistics and immutable audit history subject to retention rules.
- Manage global permissions and seed roles; never grant privileges by editing a user's client-controlled metadata.
- Oversee clubs and users, suspend accounts, and record reasons for privileged actions.
- Manage Design Studio templates and all template grant/revocation workflows.

### 3.2 University administration

- Manage university identity, campuses, faculties, departments, staff, supervisors, announcements, and settings.
- Review club creation and renewal requests using explicit lifecycle transitions.
- Oversee authorized events, activities, budgets, funding, and reports within one university only.

### 3.3 Club operations and student portal

- Maintain club identity, leadership, teams, members, applications, renewals, events, tasks, documents, announcements, finances, inventory, sponsors, certificates, calendar, and activity history.
- Let students discover visible clubs, submit applications, register for eligible events, view decisions, and access only their own or explicitly shared records.
- Support users who belong to multiple clubs and hold distinct roles in multiple universities.

### 3.4 Design Studio

- Central template library with metadata, previews, versions, lifecycle, and separately enforced view/start/export/review/manage permissions.
- Grants to universities, clubs, teams, and individuals without granting access to unrelated design projects.
- Structured editor for approved text fields, images, brand colors, and locked layout elements.
- Draft/version/review/approval/export lifecycle with feedback and audit history.
- Optional Canva connection and Cloudinary-backed media workflows.

## 4. Non-functional requirements

- **Security:** deny by default, database-enforced tenant isolation, least privilege, auditable privileged actions, safe file delivery, sanitized errors.
- **Reliability:** atomic workflow transitions, idempotent external callbacks, durable migration history, explicit retry rules.
- **Performance:** indexed tenancy and RLS predicates, cursor pagination for large feeds, bounded queries, optimized images, no unbounded exports.
- **Accessibility:** WCAG 2.2 AA target, keyboard navigation, visible focus, semantic labels, adequate contrast, reduced-motion support.
- **Internationalization:** locale-aware routing, English and Arabic architecture, logical CSS properties, RTL validation, locale-aware dates/numbers/currencies.
- **Maintainability:** strict TypeScript, shared validation, feature modules, documented decisions, no duplicated generated database types.
- **Observability:** structured server logs with request IDs, error monitoring boundary, audit events for business actions, health/readiness checks.
- **Privacy:** data minimization, scoped exports, retention decisions, no credentials or sensitive content in logs.

## 5. Confirmed technology stack

Versions are pinned in `package.json` and the lockfile when the application is scaffolded; the repository lockfile is authoritative.

| Concern | Decision |
| --- | --- |
| Application | Next.js App Router, React, TypeScript, Node.js 24 |
| Styling | Tailwind CSS plus CSS variables and logical properties |
| UI primitives | shadcn/ui patterns backed by Radix primitives; components live in the repository |
| Database/Auth | PostgreSQL and Supabase Auth/Data API/RLS; Supabase CLI migrations are authoritative |
| SSR auth | `@supabase/ssr` cookie-based clients for Next.js; `@supabase/supabase-js` underneath |
| Validation | Zod schemas shared at server boundaries and appropriate forms |
| Forms | React Hook Form for interactive client forms; native server forms where simpler |
| Tables | TanStack Table with server-side pagination/filtering |
| Charts | Recharts, loaded only on report/dashboard pages |
| Dates | `date-fns`; storage in `timestamptz`, rendering in the user's selected IANA zone |
| i18n | `next-intl` with locale dictionaries and RTL direction at the root layout |
| Media | Cloudinary Node SDK through server-only adapters |
| Unit/component tests | Vitest, React Testing Library, `@testing-library/user-event` |
| Database tests | pgTAP through `supabase test db` |
| End-to-end tests | Playwright |
| Logging | Small structured logger abstraction; Pino only if runtime compatibility is verified |
| Error monitoring | Sentry boundary prepared, enabled only when DSN and policy approval exist |
| Email | Provider adapter; Resend is the preferred first provider when credentials/domain exist |
| Rate limiting | Application adapter with in-memory development implementation; managed Redis/Upstash required for distributed production limits |

Libraries are added only when the first production use appears. Secrets never use a `NEXT_PUBLIC_` prefix. Browser-safe Supabase URL and publishable key are the only public integration configuration.

## 6. Application architecture

### 6.1 Architectural style

Use a modular monolith. Next.js owns web delivery and server orchestration; PostgreSQL owns relational integrity and atomic state transitions; Supabase Auth establishes identity; RLS provides database defense in depth. This avoids premature distributed systems while maintaining clear module boundaries.

Server Components perform reads by default. Server Actions handle same-origin form mutations that do not need an independent HTTP contract. Route Handlers are used for uploads/signatures, downloads/exports, external callbacks/webhooks, QR check-in endpoints, and integrations. SQL functions are reserved for atomic multi-row workflows or safe authorization helpers—not for hiding ordinary CRUD.

### 6.2 Target directory structure

```text
app/
  [locale]/
    (public)/
    (auth)/
    (app)/
      platform/
      universities/[universityId]/
      clubs/[clubId]/
      student/
  api/
    cloudinary/
    exports/
    webhooks/
components/
  ui/
  layout/
  data-display/
features/
  auth/ universities/ clubs/ memberships/ events/ forms/
  tasks/ documents/ finance/ assets/ notifications/ certificates/
  reports/ design-studio/
    components/ queries/ actions/ schemas/ permissions/ types.ts
lib/
  auth/ authorization/ db/ supabase/ cloudinary/ i18n/
  errors/ logging/ rate-limit/ security/ validation/
messages/
  en.json ar.json
supabase/
  config.toml migrations/ seed.sql tests/
tests/
  integration/ e2e/ fixtures/
docs/
  PROJECT_MASTER_PLAN.md
```

Feature code may import shared `components`/`lib`, but feature-to-feature coupling must flow through documented service functions or database contracts. UI components do not contain authorization rules.

### 6.3 Module dependency order

1. Configuration, Supabase clients, auth, profiles, authorization primitives.
2. Universities and organizational units.
3. Clubs, teams, roles, and memberships.
4. Forms, documents/media, notifications, and audit services.
5. Events, registrations, attendance, tasks, and announcements.
6. Finance, assets, sponsors, certificates, and reports.
7. Design Studio and optional integrations.

## 7. Multi-tenancy and authorization model

### 7.1 Ownership hierarchy

```text
Platform
└── University
    ├── Campus / Faculty / Department
    └── Club
        ├── Team / Committee
        └── Tenant-owned resources
```

Every tenant-owned table carries the narrowest authoritative foreign key (`university_id`, `club_id`, or `team_id`). Where a lower-scope row also stores a parent ID for query and RLS efficiency, composite foreign keys or triggers ensure the pair cannot disagree. Client-provided scope IDs are query inputs, never proof of access.

### 7.2 RBAC decisions

- Permissions are stable machine identifiers such as `club.members.review` and `university.funding.approve`.
- Roles are configurable bundles scoped to `platform`, `university`, `club`, or `team`; system seed roles cannot be renamed into a different scope.
- `roles`, `permissions`, and `role_permissions` define bundles.
- Separate assignment tables—`platform_role_assignments`, `university_role_assignments`, `club_role_assignments`, and `team_role_assignments`—retain real foreign keys and avoid a weak polymorphic assignment relation.
- A user can have many assignments. Effective permission is the union of active assignments in the exact resource ancestry, subject to account/scope suspension.
- Critical approvals also enforce workflow-specific rules (for example, an expense submitter cannot approve the same expense when separation of duties is enabled).
- Permission revocation takes effect from database assignments immediately. Authorization is not based on stale JWT role arrays.
- Platform-owner actions require an active platform assignment and are always audited.

### 7.3 Authorization layers

1. Route/layout checks improve navigation and redirect unauthenticated users.
2. Every server mutation calls a centralized authorization function with user ID, permission, and scope.
3. PostgreSQL constraints protect invariants.
4. RLS protects rows accessed through caller-scoped Supabase clients.
5. Privileged server clients are narrowly constructed in server-only modules and used only for background/system operations after explicit authorization.

## 8. Database design

### 8.1 Global conventions

- Primary keys are UUIDs generated with `gen_random_uuid()`.
- `auth.users.id` is referenced by `profiles.id` and user foreign keys.
- All instants use `timestamptz`; calendar-only values use `date`; user zones are stored as IANA names.
- Mutable tables include `created_at`, `updated_at`, `created_by`, and where appropriate `updated_by`.
- Money uses `numeric(14,2)` and ISO 4217 `char(3)` currency; one budget period has one currency. Application math uses decimal-safe values, never JS floating-point arithmetic.
- Lifecycle states use text plus check constraints unless a PostgreSQL enum has clear long-term stability. This keeps migrations reversible as workflows evolve.
- Soft deletion is limited to user-facing recoverable content (`archived_at`/`deleted_at`). Financial, audit, approval, certificate, and history records are immutable or voided, not deleted.
- Foreign-key delete behavior is explicit. Tenant deletion is restricted and performed through an audited retention workflow; incidental cascade of business history is forbidden.
- Every RLS predicate and common foreign-key filter receives an appropriate leading-column index.
- Optimistic concurrency uses `updated_at` or an integer `version` for frequently edited resources.

### 8.2 Entity inventory

The following is the planned normalized model. Exact DDL is introduced in ordered migrations and reviewed per phase.

#### Identity and organization

- `profiles`: user display data, locale, time zone, onboarding state, account status shadow; PK/FK `id -> auth.users`.
- `universities`: legal/display identity, slug, status, locale, default currency, settings; unique normalized slug.
- `campuses`, `faculties`, `departments`: university-scoped organizational units with parent FKs and scoped unique names/codes.
- `clubs`: university FK, slug/code, visibility, status, branding, description; unique `(university_id, slug)`.
- `club_requests`: create/renew request, submitter, requested data snapshot, decision state and reviewer fields.
- `teams`: club FK, name, description, active state; unique active name per club.
- `supervisor_assignments`: university/club/user relationship with effective dates.

#### Permissions and membership

- `permissions`, `roles`, `role_permissions`.
- Scope-specific role assignment tables with `starts_at`, `ends_at`, `revoked_at`, assigner, and reason.
- `club_memberships`: club/user relationship, status, joined/ended dates; partial unique index prevents more than one active/pending membership as defined by policy.
- `membership_applications`: applicant, club, form version, status, submitted/decision timestamps; partial uniqueness prevents duplicate open applications.
- `membership_status_history` and `membership_role_history`: append-only actor-attributed transitions.
- `club_invitations`: token digest (never plaintext token), recipient, expiry, state.

#### Dynamic forms

- `form_definitions`: owner scope, purpose, title, lifecycle, current version.
- `form_versions`: immutable version number, validated JSON schema/layout, published timestamp.
- `form_submissions`: form/version, submitter, subject resource, status, submitted timestamp.
- `form_answers`: submission, stable field key, typed JSON value; unique `(submission_id, field_key)`.
- `form_files`: answer/document link with upload validation metadata.

Published form versions never change. Editing produces a new version, so historical submissions remain interpretable.

#### Events and attendance

- `events`: club/university owner, type, visibility, status, approval state, venue, time zone, start/end/deadline, capacity, waitlist policy, eligibility rule snapshot.
- `event_registrations`: event/user, state, sequence, registered/cancelled times; one non-cancelled registration per user/event.
- `event_registration_guests` only if guest registration is explicitly enabled later.
- `attendance_records`: event/registration, attendance state, checked-in time/method/actor, correction reason.
- `event_checkin_tokens`: short-lived hashed QR tokens or rotating event token metadata; raw secrets are not stored.
- `event_status_history`: append-only transition record.

#### Collaboration and content

- `tasks`, `task_assignees`, `task_comments`, `task_history`.
- `announcements`, `announcement_audiences`, `announcement_reads`.
- `documents`: tenant/resource owner, category, Cloudinary asset FK or external reference, visibility, status, retention and checksum metadata.
- `media_assets`: Cloudinary `asset_id`, public ID, resource/delivery type, bytes, format, owner, scope, moderation/status. Cloudinary secrets and signed URLs are never stored.
- `meeting_minutes` with meeting date, author, approval status, and related documents.

#### Finance, assets, and sponsors

- `budget_periods`, `budget_allocations`, `funding_requests`, `funding_request_history`.
- `expenses`: club/budget, submitter, amount/currency, merchant/date/category, state, receipt document, version.
- `expense_approvals`: immutable decision rows; no destructive edit of approved expenses.
- `financial_transactions`: finalized record of approved allocations/expenses/adjustments, with reversal linkage rather than deletion.
- `asset_categories`, `assets`, `asset_assignments`, `asset_maintenance_records`.
- `sponsors`, `partnerships`, `sponsorship_commitments`, with document links and visibility controls.

#### Notifications, certificates, reports, audit

- `notifications`: recipient, type, localized payload data, related safe route, read/archived timestamps.
- `notification_deliveries`: channel, provider ID, state, attempts, last error category; created only for configured channels.
- `certificate_templates`, `certificates`: recipient, event/club, issue/void state, serial, verification token digest, issued actor/time.
- `audit_events`: actor, action, resource type/ID, tenant IDs, request ID, safe JSON diff/metadata, timestamp, IP hash where policy permits. Insert-only for application roles.
- Report queries are secure views with `security_invoker = true` or server-side queries; materialized aggregates are introduced only after measurement.
- `export_jobs`: requester, scope, filters, state, expiry, private output asset.

#### Design Studio

- `design_templates`: owner, category, state, preview asset, editor type (`native` or `canva_link`), dimensions and current version.
- `design_template_versions`: immutable validated editor schema/content, source metadata, published time.
- Separate `template_university_grants`, `template_club_grants`, `template_team_grants`, and `template_user_grants`, each with capabilities, effective/expiry/revocation fields.
- `design_projects`: template version, owner user, club/team scope, lifecycle, current revision.
- `design_revisions`: immutable validated scene/content JSON, author, number, source revision.
- `design_reviews` and `design_review_comments`: decision and feedback history.
- `design_exports`: requested format, source revision, state, private Cloudinary asset, expiry.
- `canva_connections`: encrypted-token reference/provider subject/scopes/expiry—not raw access tokens in queryable business tables.

### 8.3 Key relationship rules

- A club belongs to exactly one university; a team belongs to exactly one club.
- Membership and role assignment are independent: membership does not imply management permission.
- A user may have memberships and roles in many scopes.
- Every event, task, document, budget, and design project has one authoritative owning scope.
- Approvals and histories are append-only; current state and the last valid transition are updated atomically.
- Template access does not imply project access. Project access is owner/team/reviewer permission based.

## 9. Migration and local database strategy

Supabase migrations under `supabase/migrations` are the only source of truth. Dashboard-only schema edits are prohibited.

Planned migration groups:

1. Extensions, private schema, timestamp helpers, profiles, organization hierarchy.
2. Permission catalog, roles, assignments, authorization helpers, grants/RLS.
3. Clubs, teams, memberships, requests, history.
4. Forms and media/documents.
5. Events, registrations, waitlists, attendance, certificates.
6. Tasks, announcements, notifications, audit.
7. Finance, assets, sponsors.
8. Design Studio and integrations.
9. Secure reporting views and performance indexes.

Workflow:

```text
supabase start
supabase migration new <descriptive_name>
supabase db reset
supabase test db
supabase gen types typescript --local > generated target (via project script)
supabase db lint
```

The exact CLI commands are confirmed with `supabase --help` before use. Production is never reset. Migration deployment is preview/staging first, with backups and rollback/forward-fix notes for destructive changes.

Generated database types live in one file (planned `lib/supabase/database.types.ts`) and are regenerated by script; handwritten domain types may wrap but never duplicate generated row definitions.

## 10. Supabase authentication and session architecture

- Email/password with verification is the initial identity method. OAuth/SSO providers are added only when configured.
- `@supabase/ssr` creates browser and server clients using cookies. A Next.js proxy/session-refresh boundary updates expiring sessions.
- Protected server operations resolve the authenticated user using a verified Supabase auth call, not a client-supplied ID or a decoded-but-unverified cookie.
- Signup creates a minimal `profiles` row through an audited database trigger or idempotent server workflow. Authorization data is never read from `user_metadata`.
- Password reset and email confirmation return through allow-listed routes using PKCE-compatible flows.
- Sign-out clears the local session. Suspension/revocation checks are performed against current database state for sensitive actions.
- Service/secret keys remain server-only and are limited to system jobs and tightly bounded administrative workflows.
- Account suspension stops protected operations immediately; session revocation is attempted, and short access-token expiry limits residual token risk.

## 11. RLS and database privileges

Every table in an exposed schema will:

1. Enable RLS.
2. Revoke default privileges from `anon` and `authenticated`.
3. Grant only required operations.
4. Define separate `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies with explicit `TO` roles.
5. Use both `USING` and `WITH CHECK` for updates.
6. Receive allow/deny pgTAP tests for owner, authorized member, unrelated tenant member, and anonymous caller as relevant.

Authorization helpers live in a non-exposed `private` schema. A `SECURITY DEFINER` helper is allowed only when required to avoid recursive policies or safely inspect assignments; it must set `search_path = ''`, schema-qualify every object, verify `auth.uid()`, revoke execute from `PUBLIC`, and grant only to the intended role. Views exposed to callers use `security_invoker = true`.

Representative policy intent:

- Public club/event discovery exposes only published, public-safe columns—prefer dedicated secure views instead of whole business tables.
- Users read/update their own profile fields, never suspension or privilege fields.
- University resources require an active university permission or descendant club access specifically allowed for that operation.
- Club resources require active membership plus the relevant permission; private applications/submissions are limited to applicant and reviewers.
- Financial writes use server/RPC workflows plus RLS; finalized transactions are not updateable by normal roles.
- Notifications are readable/updateable only by the recipient; clients cannot insert arbitrary notifications.
- Audit events cannot be updated/deleted by application roles.

## 12. API and server contract conventions

### 12.1 Operation selection

- **Server Components/caller-scoped Supabase:** authenticated reads that RLS can express safely.
- **Server Actions:** same-origin UI mutations such as profile updates, application decisions, and task changes.
- **Route Handlers:** integration/webhook endpoints, upload signatures, QR check-in, export/download endpoints, and public verification.
- **Database RPC:** atomic transitions such as approve application + create membership + history + notification; register/waitlist with capacity locking; approve expense + transaction.

No endpoint exists merely to wrap a trivial query without adding a security, orchestration, caching, or external-contract benefit.

### 12.2 Contract shape

Inputs are allow-listed by Zod; privileged fields are never spread from request bodies. IDs are UUID-validated. Lists use bounded page sizes and cursor pagination when order is stable.

Successful HTTP responses use the natural resource/status. Errors use:

```json
{
  "error": {
    "code": "MEMBERSHIP_ALREADY_EXISTS",
    "message": "A membership already exists for this club.",
    "fieldErrors": {},
    "requestId": "..."
  }
}
```

Status mapping: validation `400/422`, unauthenticated `401`, unauthorized `403`, missing `404`, conflict `409`, rate limited `429`, unexpected `500`. Client errors contain no SQL, stack traces, tokens, internal table names, or secrets.

### 12.3 Initial significant contracts

| Operation | Interface | Authorization and effects |
| --- | --- | --- |
| Create university | Server Action | `platform.universities.create`; insert + audit |
| Submit/review club request | Action + atomic RPC | submitter scope; reviewer permission; state/history/notification transaction |
| Submit/review membership application | Action + RPC | applicant/reviewer; versioned form; membership/history/notification transaction |
| Publish event | Server Action | `club.events.publish`; validates approval/time/capacity |
| Register/cancel | RPC called by Action | authenticated eligible user; locks capacity and manages waitlist atomically |
| Check in attendee | Route Handler/Action | event attendance permission; short-lived token; audit correction |
| Create upload signature | `POST /api/cloudinary/sign` | resource-specific upload permission; allow-listed folder/type/size |
| Request export | `POST /api/exports` | report permission; creates bounded job and private expiring output |
| Transition design project | Action + RPC | owner/reviewer capability; validates lifecycle; appends history/notification |
| Canva callback/webhook | Route Handler | state/signature verification, idempotency key, safe token storage |

## 13. Business workflows

Transitions not listed are rejected server-side and in atomic SQL where concurrency matters.

### 13.1 Club requests

`draft -> submitted -> under_review -> approved | rejected | changes_requested | withdrawn`

Approved renewal updates the club validity atomically. Decisions require a reason where rejected/changes requested and record reviewer/history.

### 13.2 Membership

Application: `draft -> submitted -> under_review -> approved | rejected | withdrawn`  
Membership: `invited | active | suspended | expired | resigned | removed`

Approval creates one active membership only. Role assignment is a separate authorized action. Suspended/ended membership removes effective club access immediately.

### 13.3 Events and registration

Event: `draft -> submitted_for_approval -> approved -> published -> completed | cancelled | archived`, with changes-requested path.  
Registration: `registered | waitlisted -> attended | no_show | cancelled`.

Capacity is checked under a database lock. A cancellation promotes the oldest eligible waitlisted registration atomically. Registration closes at the earlier of deadline/cancellation/capacity without waitlist. Times require `end_at > start_at`; deadline cannot follow start. Attendance correction requires permission and a reason.

### 13.4 Tasks

`todo -> in_progress -> blocked -> completed | cancelled`, with authorized reopen. Assignees may update permitted status fields; only managers reassign or change scope/ownership.

### 13.5 Finance

Funding: `draft -> submitted -> under_review -> approved | rejected | withdrawn -> disbursed`  
Expense: `draft -> submitted -> under_review -> approved | rejected | changes_requested -> paid | voided`

Approved/paid rows are immutable except through an audited reversal/void workflow. Currency must match the budget period. Separation of duties is configurable and on by default for submitter/approver.

### 13.6 Design Studio

Template: `draft -> published -> archived`.  
Project: `draft -> in_progress -> submitted -> changes_requested | approved -> exported -> archived`.

Revoked access prevents new projects and edits. Existing submitted projects remain readable by their authorized participants for review/audit; existing drafts become read-only for a grace period configured by policy, then archive. Archived templates cannot start projects but do not break historical projects. Exports always reference an immutable revision.

### 13.7 Template grant precedence

- A project can start when at least one active matching grant includes `start` and no explicit active user-level deny exists.
- Individual deny/revocation overrides broader university/club/team grants for that user.
- Capabilities are evaluated independently: `view`, `start`, `export`, `review`, `manage_access`.
- Project ownership/reviewer authorization is evaluated separately from template grants.

## 14. Cloudinary media architecture

- Browser uploads receive short-lived signatures only after a server permission check.
- The server determines folder prefix, public ID policy, resource type, allowed formats, maximum bytes, tags, and delivery type; clients cannot expand these fields.
- Public club logos and published event images may use public `upload` delivery after moderation/approval.
- Receipts, member files, private documents, design drafts, and exports use `authenticated` delivery or `private` plus strict transformations as appropriate.
- Access to private content is reauthorized before returning a short-lived signed delivery/download URL. An unguessable Cloudinary URL is not authorization.
- Store Cloudinary `asset_id`, public ID, delivery/resource type, version, checksum/metadata, and app owner. Verify a referenced asset belongs to the expected scope before linking or deleting it.
- API secret is server-only. Upload callbacks are verified. Deletion is an authorized, audited, idempotent server action and respects retention/financial hold rules.
- Initial limits: images 10 MiB (`jpg`, `png`, `webp`, `avif` where supported); PDFs 20 MiB; other documents require an explicit category allow-list. Limits are configurable downward per field.

## 15. Canva integration strategy

Current official Canva documentation distinguishes two relevant products:

- **Canva Connect APIs:** external web apps can use OAuth to create/sync assets, designs, comments, and exports. Public integrations require Canva review; private integrations are limited to a team's Canva Enterprise plan.
- **Canva Apps SDK / Design Editing API:** an app runs inside Canva and can edit supported design elements. It is not evidence that arbitrary Canva designs can be embedded and edited inside this ERP.

Therefore:

1. The base Design Studio is a native, structured template editor with locked layout regions and validated editable fields.
2. `canva_link` templates may open an authorized Canva URL in a new tab; the link alone never implies API access or editable content access.
3. A Connect API adapter is feature-flagged and implemented only after client credentials, redirect URIs, required scopes, account eligibility, token encryption/storage, privacy terms, and review status are confirmed.
4. OAuth tokens are server-only, encrypted using a managed secret/KMS boundary, refreshable, revocable, and never logged.
5. If Connect APIs are unavailable, users can export a native design or follow an external Canva link; the UI states the limitation accurately.

References: [Canva Connect APIs](https://www.canva.dev/docs/connect/) and [Canva Design Editing API](https://www.canva.dev/docs/apps/design-editing/).

## 16. Native Design Studio model

The native editor is constrained rather than free-form:

- Template versions define canvas dimensions, locked layers, editable text/image/color fields, validation limits, fonts, and safe-area rules in versioned JSON validated by Zod.
- Project revisions store only user-editable values and normalized layer state, never arbitrary executable HTML/JS.
- Preview rendering is deterministic. Browser canvas rendering is used for interaction; export is generated from the immutable revision through a controlled render worker or approved server-compatible renderer.
- Uploaded images remain Cloudinary assets and are reauthorized before use.
- HTML/SVG inputs are sanitized; remote URLs are not fetched arbitrarily (SSRF protection).
- Export formats begin with PNG/JPEG and PDF only after render fidelity is tested.

The exact rendering library is selected in Phase 5 after a compatibility spike; no capability is promised until the spike verifies typography, RTL, image cropping, server export, and deployment runtime.

## 17. UI/UX and design system

- Responsive shell: collapsible sidebar, top bar, context switcher, breadcrumbs, command/search entry, notifications, profile menu.
- Persistent university/club context badge and scope-aware URLs prevent context ambiguity.
- Navigation is built from effective permission descriptors, but every destination/action independently authorizes on the server.
- Shared primitives cover button/input/select/dialog/drawer/popover/tooltip/toast/table/pagination/tabs/status badge/skeleton/empty/error states.
- Destructive or irreversible actions require clear scope, consequence, and confirmation; typed confirmation is reserved for rare high-risk operations.
- Forms preserve entered values on recoverable failures and place accessible errors next to fields plus a summary.
- Tables use meaningful defaults, column visibility, filters, loading/empty/error states, and mobile card alternatives where a table becomes unusable.
- Dashboard charts answer specific questions; operational pages favor task-focused lists and forms.

Design tokens are CSS variables for color, spacing, radius, shadow, typography, success/warning/danger, and focus. Dark mode may be prepared but is not a release blocker.

## 18. Internationalization and RTL

- Locale is represented in the route and user preference. English is the initial complete locale; Arabic must cover all released end-user paths before claiming full bilingual support.
- Root `lang` and `dir` are derived from locale. CSS uses logical start/end properties.
- Dates, numbers, and currencies use `Intl`/locale APIs; storage remains locale-neutral.
- Validation schemas expose message keys rather than hard-coded English where practical.
- User-generated content direction uses safe auto-direction behavior.
- Playwright includes at least one Arabic/RTL flow per major shell/form/table pattern.

## 19. Notifications and audit logging

In-app notifications are the first guaranteed channel. Notification producers write events in the same transaction as the business transition when possible. Consumers render localized copy from a stable type plus safe payload, not stored HTML.

Email is asynchronous and provider-adapted. A failed email does not roll back a completed business action; delivery state and retry count are recorded. Deadline reminders require a scheduled worker/cron whose deployment availability must be verified.

Audit events record security- and business-relevant changes: role/grant changes, approvals, suspensions, finance transitions, attendance corrections, export generation, template/design transitions, and media deletion. Sensitive form answers, secrets, tokens, full receipts, and passwords are never copied into audit metadata.

## 20. Security and privacy requirements

- Validate all untrusted input on the server and use parameterized Supabase/Postgres interfaces.
- Rely on React escaping; sanitize any supported rich text and prohibit arbitrary scripts/styles.
- Use SameSite, Secure production cookies through supported Supabase SSR flow. Mutations are same-origin; integration callbacks validate state/signatures.
- Rate-limit sign-in/recovery, invitations, public forms, upload signatures, check-in, exports, and integration callbacks.
- Enforce file magic type/size and category rules; add malware scanning before enabling high-risk document categories in production.
- Use secret managers/environment variables, `.env.example`, and startup validation. Never commit real values.
- Redact authorization headers, cookies, tokens, signatures, personal form answers, and file URLs from logs.
- Exports are permission checked, bounded, private, expiring, and audited.
- Backups and point-in-time recovery depend on the selected Supabase plan and must be confirmed before production. Restore drills are required.
- Dependency updates and advisories are reviewed continuously; lockfiles are committed.
- Production privileged actions require reauthentication/MFA when Supabase plan/configuration supports it; platform owners should use AAL2.
- Privacy policy, retention periods, lawful basis/consent, data subject handling, and university-specific regulations require product/legal confirmation before launch.

## 21. Testing strategy

### 21.1 Test layers

- **Unit:** Zod schemas, permission resolution, lifecycle guards, money/date utilities, template schema.
- **Component:** forms, tables, dialogs, context switcher, RTL and accessibility behavior.
- **Database/pgTAP:** constraints, triggers, atomic RPCs, grants, RLS allow/deny matrices.
- **Integration:** Server Actions/Route Handlers against local Supabase; auth and media adapters mocked only at the external boundary.
- **End-to-end:** sign-up/sign-in, multi-tenant isolation, club approval, membership, event capacity/waitlist, attendance, expense approval, template grant/revocation, design review/export authorization.
- **Security regression:** crafted ownership/scope changes, role escalation, cross-tenant IDs, private submission reads, revoked permission use, upload reference spoofing, export leakage.

### 21.2 Required checks per milestone

```text
format check
lint
TypeScript typecheck
unit/component tests
supabase db reset
supabase test db
integration tests
Playwright critical paths
production build
```

Only applicable and actually executed checks are reported. Credential- or infrastructure-dependent checks are listed as not run, never implied to pass. Meaningful tests are not disabled to make CI green.

## 22. Environment and deployment

Planned variables (names may be refined without changing security intent):

```text
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CANVA_CLIENT_ID
CANVA_CLIENT_SECRET
CANVA_REDIRECT_URI
EMAIL_PROVIDER_API_KEY
SENTRY_DSN
RATE_LIMIT_REDIS_URL
RATE_LIMIT_REDIS_TOKEN
```

Deployment target is Vercel for Next.js unless the project owner chooses another compatible host. Supabase environments are separated into local, preview/staging, and production. Preview deployments must not point to production data. Production rollout requires configured domains, auth redirect allow-lists, Cloudinary restrictions, database backups/PITR, monitoring, email domain verification if enabled, and a migration runbook.

CI on pull/push installs with the lockfile, validates formatting/lint/types/tests/build, and starts local Supabase for database tests where the runner supports Docker. Database migrations deploy only after application compatibility is established; destructive migrations use expand/migrate/contract phases.

## 23. Implementation roadmap

### Phase 0 — Repository and planning

- [x] Inspect repository and establish greenfield baseline.
- [x] Analyze the product specification.
- [x] Define initial architecture, tenancy, database, API, auth, RLS, media, security, and test decisions.
- [x] Verify current Supabase, Cloudinary, and Canva integration guidance.
- [x] Create this master plan.
- [x] Initialize Git history and push the plan milestone.

### Phase 1 — Technical foundation

- [x] Scaffold Next.js App Router with strict TypeScript, Tailwind, ESLint, and pinned lockfile.
- [x] Add environment validation and `.env.example`.
- [x] Initialize local Supabase configuration and document CLI/Docker prerequisites.
- [x] Add SSR browser/server clients and session refresh boundary.
- [x] Add authentication pages/actions and protected shell.
- [x] Create initial organization/profile/authorization migrations.
- [x] Add generated database type workflow.
- [x] Add grants, RLS, pgTAP tests, and seed permissions/roles.
- [x] Add locale routing, English/Arabic dictionaries, base design system, and accessible shell.
- [ ] Configure Vitest, Testing Library, Playwright, and CI.

### Phase 2 — Global and university administration

- [ ] Platform dashboard and university CRUD.
- [ ] Organizational units and university staff assignments.
- [ ] Permission/role administration with escalation protection.
- [ ] Club creation/renewal requests and approval workflows.
- [ ] User status/suspension workflows and audit viewer.

### Phase 3 — Club and student operations

- [ ] Club workspace, teams, leadership, and navigation.
- [ ] Membership forms, applications, invitations, decisions, renewals, history.
- [ ] Student discovery and personal portal.
- [ ] Events, approval/publication, registration, capacity/waitlist, attendance.
- [ ] Versioned forms, tasks, documents/media, announcements, notifications.

### Phase 4 — Business operations

- [ ] Budget periods, allocations, funding requests, expenses, approvals, transactions.
- [ ] Assets, assignment/return, maintenance, sponsors, partnerships.
- [ ] Certificates, verification, reports, and secure exports.

### Phase 5 — Design Studio

- [ ] Template model, versions, publication, archive, grants, and revocation.
- [ ] Rendering compatibility spike and decision record.
- [ ] Structured editor, project revisions, brand/media selection.
- [ ] Review lifecycle, feedback, and secure export.
- [ ] Usage reports.
- [ ] Optional Canva OAuth/Connect API only if prerequisites are available and verified.

### Phase 6 — Hardening and release

- [ ] Full RLS/grant audit and cross-tenant security suite.
- [ ] Accessibility and Arabic RTL audit.
- [ ] Query/index and bundle performance review.
- [ ] Rate limiting, monitoring, backup/restore, retention, and incident runbooks.
- [ ] Staging migration/deployment rehearsal and production checklist.
- [ ] Reconcile this plan with delivered behavior and document remaining limitations.

## 24. Acceptance criteria

The release is acceptable only when:

- A user cannot read or mutate unrelated university/club/private records through UI, API, or direct Data API calls.
- Role assignment, approval, finance, export, media, and Design Studio boundaries have positive and negative automated tests.
- Critical workflows are atomic and handle duplicate/concurrent attempts predictably.
- Released pages have loading, empty, error, success, and accessible responsive states.
- Authentication recovery/verification and permission revocation are verified.
- Database can be recreated from migrations and types can be regenerated.
- Private files and exports require fresh authorization and are not publicly addressable.
- English coverage is complete and the released Arabic coverage is accurately documented and RTL-tested.
- Formatting, lint, typecheck, applicable tests, and production build pass in CI.
- Environment, migration, backup, rollback/forward-fix, and deployment instructions are current.
- No placeholder control or fake data is presented as working production functionality.

## 25. Definition of done for each feature

A feature is done only when its data model/constraints, server validation, authorization/RLS, UI states, error handling, audit behavior, critical tests, documentation, and applicable verification checks are complete. External-provider work additionally needs configured credentials and an executed end-to-end verification. A green build alone is insufficient.

## 26. Risks, assumptions, and external dependencies

| Item | Status / mitigation |
| --- | --- |
| Supabase project and plan | Not provided. Develop locally; production auth, backups, PITR, email and limits require project configuration. |
| Docker/Supabase CLI | CLI 2.122.0 is pinned. Docker Desktop 4.89.0 is running, the local stack rebuilds cleanly from migrations, and the database test suite passes. If the earlier `sailor-ingest.sock` startup failure returns, stop Docker/WSL before repairing the user-local runtime socket. |
| Cloudinary account | Credentials and product settings not provided. Implement adapter/tests; verify signed upload/delivery with a real environment before claiming completion. |
| Canva eligibility/review | Unknown. Keep optional and feature-flagged; native workflow is the functional baseline. |
| Email domain/provider | Unknown. In-app notifications work independently; do not claim email delivery. |
| Legal/privacy/retention | Institution/jurisdiction policy not supplied. Obtain decisions before production data onboarding. |
| University-specific approval rules | Defaults are configurable; validate with pilot institution before freezing workflows. |
| Native design export fidelity | Requires Phase 5 spike, especially Arabic fonts/RTL and deployment runtime. |
| Scale targets | Not supplied. Use bounded/indexed architecture and collect measurements before caches/materialized views. |
| Malware scanning | Provider not selected. Restrict uploads until a production scanning path is configured for risky documents. |

## 27. Decision log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-10-29 | Modular monolith on Next.js App Router | Appropriate for a solo developer; keeps transactions and deployment simple. |
| 2026-10-29 | Pin Node.js 24 for local and CI runtime | Matches the verified local toolchain and current supported Next.js runtime. |
| 2026-10-29 | Authenticated and query-dependent routes opt out of instant-navigation validation initially | Next.js 16 Cache Components cannot prerender verified cookie state; `instant = false` keeps these routes correct until their request-time UI is split behind Suspense boundaries. |
| 2026-10-29 | PostgreSQL/Supabase migrations are schema truth | Reproducibility and reviewability; avoids dashboard drift. |
| 2026-10-29 | Cookie SSR uses `@supabase/ssr` | Current official Supabase guidance for Next.js cookie sessions. |
| 2026-10-29 | Database-current assignment rows, not JWT role arrays, drive authorization | Immediate revocation and no user-metadata trust. |
| 2026-10-29 | Separate scope assignment/grant tables | Preserves foreign keys and avoids fragile polymorphic relations. |
| 2026-10-29 | Explicit grants plus per-operation RLS and pgTAP tests | RLS alone does not define table privileges; negative tests are required. |
| 2026-10-29 | RBAC roles may contain permissions at the same or a descendant scope only | A platform role can govern all scopes, while university, club, and team roles cannot escalate above their ownership boundary. Database triggers enforce the rule. |
| 2026-10-29 | English and Arabic use explicit `/en` and `/ar` route prefixes | Locale is durable across authentication callbacks and redirects, URLs are shareable, and each localized root renders the correct `lang` and text direction. |
| 2026-10-29 | Native structured Design Studio is baseline; Canva is optional | Canva external and in-Canva APIs have eligibility/review/product boundaries and do not guarantee embedded ERP editing. |
| 2026-10-29 | Cloudinary private content uses signed restricted delivery | Unguessable public URLs are not authorization. |
| 2026-10-29 | In-app notifications first | Avoids pretending an unconfigured email provider is operational. |

## 28. Maintainer protocol

For every meaningful implementation increment:

1. Re-read the relevant sections and dependencies.
2. Update migrations and generated types before dependent app code.
3. Add server validation, authorization, RLS, audit, and tests with the feature.
4. Run applicable checks and record exactly what ran.
5. Update roadmap boxes and decisions in this file.
6. Commit a coherent change and push it to the remote repository.
7. Report files, migrations, checks, blockers, and the next concrete task.

