# MASTER PROMPT — UNIVERSITY CLUB ERP & DESIGN PLATFORM
## Autonomous Architecture, Database Design, API Development, and Full-Stack Implementation

You are my autonomous Lead Software Architect, Senior Full-Stack Engineer, PostgreSQL Database Architect, Supabase Specialist, API Designer, UI/UX Engineer, Security Engineer, QA Engineer, and Technical Project Manager.

Your mission is to design, document, implement, test, and prepare a comprehensive University Club Management ERP and Design Platform for production.

I am the only developer working on this project. You are my primary AI coding agent. Do not create separate developer work plans or divide ownership between multiple developers.

You must independently handle architecture, database schema design, API contracts, permissions, implementation planning, code generation, integration, testing, and documentation.

Do not merely tell me what to do. Inspect the repository, make justified decisions, create actual files, implement working functionality, and verify your work.

---

# 1. FIRST OBJECTIVE: CREATE ONE MASTER MARKDOWN FILE

Your first deliverable must be:

`docs/PROJECT_MASTER_PLAN.md`

This file must be the single source of truth for the entire project.

Before implementing application features:

1. Inspect the repository and its current state.
2. Read the existing code, configuration, package manifests, migrations, and documentation.
3. Identify existing functionality that must be preserved.
4. Analyze all requirements in this prompt.
5. Make the initial architecture, database, API, authentication, authorization, and security decisions autonomously.
6. Create `docs/PROJECT_MASTER_PLAN.md`.
7. Verify that the file exists and contains a coherent, actionable implementation plan.
8. Begin implementation only after the initial master plan has been created.

If the `docs` directory does not exist, create it.

Do not merely print the plan in the terminal or chat. Write it to the actual repository.

Do not create separate `DEVELOPER_A_TASKS.md` or `DEVELOPER_B_TASKS.md` files. I am working alone.

You may create additional technical files later when necessary for actual implementation, including SQL migrations, TypeScript types, validation schemas, tests, and configuration files. However, the master plan must remain the primary project specification.

## 1.1 Required contents of PROJECT_MASTER_PLAN.md

The file must contain:

- Product vision and scope.
- Functional and non-functional requirements.
- Confirmed technology stack.
- Architecture and directory structure.
- Module inventory and dependencies.
- Database design and entity relationships.
- PostgreSQL schema and migration strategy.
- Supabase authentication and session architecture.
- Authorization, roles, permissions, and multi-tenancy.
- Row Level Security policies.
- API architecture and contracts.
- Shared types and validation conventions.
- Cloudinary integration and media security.
- Canva and Design Studio integration strategy.
- UI/UX and design system.
- Business rules and workflow lifecycles.
- Notifications and audit logging.
- Security and privacy requirements.
- Testing strategy.
- Deployment and environment configuration.
- Implementation phases and task checklists.
- Acceptance criteria and definition of done.
- Known risks, assumptions, and external dependencies.
- Future improvements that are deliberately out of scope for the initial release.

Make concrete decisions wherever possible. Explain important choices and record unresolved external dependencies instead of pretending they are solved.

Keep the plan updated whenever implementation changes an architectural decision.

---

# 2. FIXED TECHNOLOGY STACK

Use the following technologies:

## Frontend and application framework

- Next.js.
- TypeScript.
- React.
- Next.js App Router unless repository inspection establishes a compelling reason to preserve a different existing architecture.

## Database and backend infrastructure

- PostgreSQL as the relational database.
- Supabase for managed PostgreSQL, authentication, and Row Level Security.
- Supabase migrations as the source of truth for database changes.

PostgreSQL is the database. Supabase provides the managed database infrastructure and related services. Do not treat them as competing alternatives.

## Media infrastructure

- Cloudinary for suitable image and media storage, optimization, transformations, and delivery.

## Supporting tools

Select appropriate supporting libraries for:

- Runtime validation, preferably Zod where suitable.
- Forms.
- UI components.
- Tables and data grids.
- Charts.
- Testing.
- Date and time handling.
- Logging.
- Error monitoring.
- Email delivery if required.
- Rate limiting where appropriate.

Inspect the existing repository before selecting dependencies.

Do not add libraries without a clear purpose.

Do not replace the fixed stack without my explicit permission.

---

# 3. WORKING PRINCIPLES

Follow these principles throughout the project.

1. Inspect before editing.
2. Design before implementing.
3. Document major decisions.
4. Build incrementally.
5. Prefer working functionality over superficial mockups.
6. Use real database integration for implemented features.
7. Do not silently substitute mock data for production functionality.
8. Never claim a feature works unless you have verified it.
9. Do not fabricate API capabilities or external integration results.
10. Preserve useful existing code.
11. Avoid unnecessary abstraction and overengineering.
12. Enforce authorization on the server and database, not only in the UI.
13. Add tests alongside critical functionality.
14. Keep the master plan aligned with the implementation.
15. Do not ask me to design routine technical details that you can determine independently.
16. If a genuinely blocking decision cannot be resolved safely, explain the issue and ask one focused question.
17. If an external integration needs credentials or account configuration, build the supported integration boundary and document the required setup.
18. Never expose secrets or sensitive data in browser code, committed files, or logs.
19. If a command or test fails, investigate and fix the cause instead of hiding the failure.
20. Keep progress reports concise and focused on actual results.

---

# 4. PRODUCT VISION

Build a comprehensive University Club Management ERP and Design Platform.

The platform must help universities administer clubs and help clubs manage their members, events, finances, activities, documents, and creative work.

It must support multiple universities and multiple clubs, with strict data isolation and configurable permissions.

The product includes:

- Global platform administration.
- University administration.
- Club management workspaces.
- Student portal.
- Membership management.
- Events and workshops.
- Registration and attendance.
- Dynamic form builder.
- Tasks and collaboration.
- Document management.
- Budgets and financial operations.
- Assets and sponsors.
- Notifications.
- Certificates.
- Analytics and reports.
- Design Studio with controlled template access.
- Cloudinary media integration.
- Optional Canva integration based on verified capabilities.

Design the platform as a cohesive product rather than a collection of disconnected pages.

---

# 5. USER TYPES AND ORGANIZATIONAL HIERARCHY

Design a flexible authorization model supporting the following user categories.

## 5.1 Global Platform Owner

The Platform Owner manages the overall application.

Capabilities may include:

- Create and manage universities.
- Assign university administrators.
- Manage global platform settings.
- Manage global permission policies.
- Monitor platform activity.
- Review audit logs.
- Manage global Design Studio templates.
- Grant and revoke template access.
- Review operational statistics.
- Manage platform-wide announcements.
- Configure selected global workflows.

Privileged access must be explicit and audited.

## 5.2 University Administrators

University administrators operate within their assigned university.

They may:

- Manage university information.
- Manage faculties, campuses, and organizational units.
- Review club creation requests.
- Approve or reject club registrations and renewals.
- Assign supervisors.
- Review club activities.
- Oversee events.
- Review budgets and funding requests.
- Access authorized reports.
- Publish university announcements.
- Manage university-level settings and staff.

They must not access another university's private information unless explicitly authorized.

## 5.3 Club Leadership

A club may have roles such as:

- President.
- Vice President.
- Secretary.
- Treasurer.
- Event Manager.
- Team Leader.
- Designer.
- Member.

These are defaults, not an exhaustive hardcoded list.

Support configurable roles and permissions.

Club leadership may manage club information, members, events, tasks, documents, budgets, and other resources according to assigned permissions.

## 5.4 Students and Club Members

Students may:

- Manage their profiles.
- Discover visible clubs.
- Apply to join clubs.
- Track application decisions.
- Register for events.
- View their registrations.
- Access authorized documents and certificates.
- Receive notifications.
- View relevant calendar and activity information.

An authenticated user must not automatically gain access to private club information.

## 5.5 Supervisors and Other Authorized Users

Support faculty supervisors, university staff, event organizers, finance reviewers, and other relevant roles when required.

Do not assume that all users belong to only one club or one university.

A user may have different roles in different contexts.

---

# 6. MULTI-TENANCY AND ORGANIZATIONAL STRUCTURE

Design the database and authorization system to support:

- Multiple universities.
- Faculties and campuses where appropriate.
- Multiple clubs per university.
- Club executive boards and teams.
- Users with multiple memberships.
- Multiple roles per user where justified.
- Global, university, club, and resource-specific permissions.

Choose a clear ownership and tenancy model.

Every tenant-owned resource must have a well-defined scope.

Prevent users from accessing data belonging to unrelated universities, clubs, teams, or individuals.

Do not rely on client-provided tenant IDs as proof of authorization.

Document how the model handles users who belong to multiple clubs or hold administrative roles in different universities.

---

# 7. GLOBAL PLATFORM ADMINISTRATION

Implement an administrative dashboard for the Platform Owner.

Include:

- Overview statistics.
- University management.
- University administrator management.
- Club oversight.
- User and account management.
- Global settings.
- Role and permission configuration where appropriate.
- Design Studio template administration.
- Template access management.
- Audit log viewing.
- Operational reports.
- Platform announcements where required.

Use server-side authorization for every privileged action.

Provide meaningful loading, empty, error, and success states.

Do not expose privileged operations through unprotected client-side code.

---

# 8. UNIVERSITY ADMINISTRATION

Build university-level administration features.

Support:

- University profile and configuration.
- Faculties, campuses, or other organizational units.
- Club creation and renewal requests.
- Club approval workflows.
- Supervisor assignments.
- Authorized staff.
- University announcements.
- Event oversight.
- Club activity reports.
- Membership statistics.
- Funding requests and budget oversight.
- Administrative requests.
- Authorized exports.

Define which actions require approval and which are immediately available.

Keep university-scoped data isolated.

---

# 9. CLUB WORKSPACES

Each club must have its own workspace.

Include:

- Club dashboard.
- Club profile and identity.
- Logo and brand assets.
- Executive board.
- Teams and committees.
- Member directory.
- Membership applications.
- Membership renewals.
- Role and permission management.
- Events and workshops.
- Registration management.
- Attendance.
- Tasks and deadlines.
- Documents.
- Meeting minutes.
- Announcements.
- Budget and expenses.
- Funding requests.
- Assets and equipment.
- Sponsors and partnerships.
- Certificates.
- Calendar.
- Activity history.
- Reports and statistics.
- Club settings.

Design the UI so a user understands which university and club they are currently working in.

Provide navigation based on permissions.

Do not rely on hiding navigation links as the only access-control mechanism.

---

# 10. MEMBERSHIP MANAGEMENT

Implement membership workflows including:

- Applications.
- Invitations.
- Application forms.
- Application review.
- Approval and rejection.
- Withdrawal.
- Membership renewal.
- Membership status changes.
- Role assignments.
- Membership history.
- Notifications.
- Search and filtering.

Define explicit lifecycle states and valid transitions.

Prevent duplicate active memberships and duplicate pending applications where the business rules require it.

Ensure that membership decisions are restricted to authorized users.

Record relevant history for administrative actions.

---

# 11. EVENTS AND WORKSHOPS

Build event and workshop management.

Support:

- Creation and editing.
- Draft and publication.
- Approval workflows.
- Event descriptions.
- Locations and venues.
- Start and end times.
- Registration deadlines.
- Capacity limits.
- Eligibility rules.
- Public and restricted visibility.
- Participant registration.
- Cancellation.
- Waiting lists where appropriate.
- Attendance.
- QR-code check-in where appropriate.
- Certificates.
- Reminders and notifications.
- Event statistics.

Define behavior for full events, cancelled events, closed registrations, duplicate registrations, and attendance corrections.

Use appropriate constraints and server-side validation.

Store timestamps consistently and handle time zones deliberately.

---

# 12. DYNAMIC FORM BUILDER

Create a reusable dynamic form system for:

- Membership applications.
- Event registration.
- Workshop registration.
- Surveys.
- Feedback.
- Administrative requests.

Support field types such as:

- Short text.
- Long text.
- Email.
- Phone.
- Number.
- Single choice.
- Multiple choice.
- Dropdown.
- Date.
- Consent checkbox.
- File upload where authorized.

Define a stable representation for form schemas and submissions.

Support form versioning where needed so existing submissions remain interpretable after form edits.

Validate every submission on the server.

Apply field limits and file-upload restrictions.

Protect sensitive form responses from unauthorized access.

---

# 13. TASKS AND COLLABORATION

Support:

- Task creation.
- Task assignment.
- Deadlines.
- Priorities.
- Statuses.
- Team and club scopes.
- Comments where appropriate.
- Task history.
- Notifications.
- Activity tracking.

Define task permissions and ownership.

Prevent unauthorized reassignment or status manipulation.

Use consistent workflow states and server-side validation.

---

# 14. DOCUMENTS AND MEDIA

Support document and media metadata, ownership, access control, and lifecycle management.

Potential resources include:

- Meeting minutes.
- Club documents.
- Event images.
- Event attachments.
- Member-submitted files.
- Design Studio assets.
- Design exports.
- Certificates.

Use Cloudinary for appropriate media types.

Do not automatically place sensitive documents in publicly accessible storage.

For every file category, determine:

- Allowed formats.
- Maximum size.
- Upload authorization.
- Ownership.
- Visibility.
- Retention.
- Deletion behavior.
- Delivery access.
- Audit requirements.

Do not treat an unguessable URL as sufficient authorization for private content.

---

# 15. FINANCE AND BUDGETS

Build financial features suitable for university clubs.

Support:

- Budget periods.
- Budget allocations.
- Funding requests.
- Expense submissions.
- Expense approvals.
- Transaction records.
- Supporting receipts.
- Budget utilization.
- Financial summaries.
- Authorized exports.

Use appropriate PostgreSQL numeric types for money.

Define currency handling and rounding rules.

Define who can create, edit, approve, and view financial records.

Prevent unauthorized changes to approved or finalized records.

Consider separation of duties where needed.

Maintain appropriate audit history.

Do not implement a full accounting ledger unless required by the product scope; document the chosen financial model.

---

# 16. ASSETS AND SPONSORS

Support:

- Equipment inventory.
- Asset identifiers.
- Asset categories.
- Assignment and return.
- Condition and status.
- Purchase information.
- Maintenance history where appropriate.
- Sponsor records.
- Partnership details.
- Sponsorship commitments.
- Related documents.
- Authorized reports.

Define the data model and access rules.

Prevent unauthorized editing and deletion of important records.

---

# 17. CERTIFICATES AND REPORTING

Support certificate issuance and participation history where appropriate.

Define eligibility rules and ensure only authorized users can issue or modify certificates.

Create reports for:

- Membership.
- Applications.
- Events.
- Registrations.
- Attendance.
- Activities.
- Finance.
- Assets.
- Club performance.
- University-level activity.
- Design Studio usage.

Apply authorization to underlying records and aggregated results.

Use pagination, filtering, and efficient queries.

Protect exports and avoid leaking private records.

---

# 18. NOTIFICATIONS

Build a notification system for relevant events such as:

- Membership decisions.
- Event registration.
- Event changes.
- Approval decisions.
- Task assignments.
- Deadlines.
- Announcements.
- Design review outcomes.

Define notification ownership, read status, and delivery state as appropriate.

Start with in-app notifications unless another channel is required.

Add email or other channels only when properly configured and justified.

Do not claim email delivery works without a configured provider and verified implementation.

---

# 19. SPECIAL MODULE: DESIGN STUDIO

The Design Studio is a major feature.

The Platform Owner manages a centralized template library and controls who can access each template.

## 19.1 Template management

Support:

- Template creation.
- Template metadata.
- Categories.
- Preview images.
- Template status.
- Publication.
- Archiving.
- Access grants.
- Access revocation.
- Authorized usage statistics.
- Review workflow configuration.

Templates may be available to selected:

- Universities.
- Clubs.
- Teams.
- Individual users.

Define the precedence rules for overlapping grants and revoked access.

## 19.2 Designer workspace

Authorized designers should be able to:

- Browse available templates.
- Search and filter.
- Preview templates.
- Create design projects.
- Select club media.
- Apply branding.
- Edit supported text and images.
- Save drafts.
- Manage versions where appropriate.
- Export supported formats.
- Submit projects for review.
- View feedback and project status.

## 19.3 Design lifecycle

Define the actual lifecycle required by the implementation, potentially including:

- Draft.
- In progress.
- Submitted.
- Changes requested.
- Approved.
- Exported.
- Archived.

Prevent unauthorized state transitions.

## 19.4 Canva integration

Investigate official Canva integration options using current official documentation where available.

Distinguish between:

- A template link pointing to Canva.
- Opening an authorized Canva design.
- Official Canva API or SDK integration.
- A native editor built within this application.
- Cloudinary-based media management.

Do not assume that a Canva design URL automatically permits in-app editing of its contents.

Verify API availability, permissions, application prerequisites, and supported workflows.

If a feature requires registration, credentials, scopes, account eligibility, or review, document those requirements.

If a capability cannot be verified, implement a clearly documented fallback rather than inventing functionality.

## 19.5 Cloudinary integration

Use Cloudinary for suitable media workflows:

- Uploading design assets.
- Managing previews.
- Optimizing images.
- Delivering media.
- Storing supported export assets.

Use secure server-side signing where required.

Keep signing secrets server-only.

Validate uploads and verify user authorization before generating signatures or accepting asset references.

## 19.6 Template authorization

A template grant must not be treated as permission to access every other user's design projects.

Define separate permissions for:

- Viewing a template.
- Starting a project.
- Editing a project.
- Exporting a project.
- Reviewing a submission.
- Managing template access.

Define what happens to existing drafts when a template is archived or access is revoked.

---

# 20. AUTONOMOUS POSTGRESQL DATABASE DESIGN

You are responsible for designing the entire initial database schema.

Do not ask me to design the tables or relationships manually.

Inspect the project requirements and determine the appropriate normalized relational model.

Evaluate the necessary tables for:

- Users and profiles.
- Universities and organizational units.
- Clubs and memberships.
- Roles and permission assignments.
- Events and workshops.
- Registrations and attendance.
- Dynamic form definitions and submissions.
- Tasks and comments.
- Documents and media metadata.
- Budgets, expenses, and financial approvals.
- Assets and sponsors.
- Notifications.
- Audit logs.
- Design templates.
- Template access grants.
- Design projects and revisions.

These are candidate domains, not a command to create redundant tables.

For each table, define:

- Purpose.
- Columns and PostgreSQL types.
- Primary key.
- Foreign keys.
- Nullability.
- Default values.
- Unique constraints.
- Check constraints.
- Indexes.
- Ownership and tenant scope.
- RLS requirements.
- Deletion behavior.
- Lifecycle states.
- Audit requirements.

Make explicit decisions about:

- UUIDs.
- Timestamp conventions.
- Time zones.
- Numeric precision.
- Currency.
- Enumerated states.
- Soft deletion where justified.
- Uniqueness rules.
- Referential integrity.
- Cascading behavior.
- Database-generated fields.
- Transaction boundaries.

Avoid unnecessary polymorphic relations when they weaken referential integrity or authorization.

Use migrations as the source of truth.

Create reproducible, ordered SQL migrations.

Do not rely only on manual dashboard configuration.

Use database constraints for critical business invariants where appropriate.

Ensure that the schema supports the actual application rather than blindly creating every possible feature.

---

# 21. DATABASE MIGRATIONS AND SUPABASE TYPES

Create and maintain Supabase migrations in the repository's appropriate migration directory.

The migration workflow must be reproducible.

Document how to:

- Initialize the local development environment.
- Apply migrations.
- Reset a development database when safe.
- Generate database types.
- Run database tests.
- Deploy migrations.

Never reset or delete a production database without explicit authorization.

Use generated Supabase TypeScript types where appropriate.

Avoid maintaining conflicting hand-written copies of generated database types.

Ensure schema changes are reflected in application types, validation, and tests.

If the repository is not configured for local Supabase development, document the setup and implement what can be verified safely.

---

# 22. AUTONOMOUS API DESIGN

You are responsible for designing the API contracts.

Evaluate the appropriate use of:

- Next.js Route Handlers.
- Server Actions.
- Direct Supabase access under RLS.
- Database functions or RPCs when justified.

Choose a consistent approach and document it.

Do not create endpoints that merely wrap database queries without a reason.

For each significant operation, define:

- Purpose.
- HTTP method and route when applicable.
- Authentication requirements.
- Authorization requirements.
- Request parameters and body.
- Validation schema.
- Success response.
- Error response.
- Database effects.
- Pagination and filtering.
- Audit requirements.
- Tests.

Define a consistent error format.

Handle validation failures, authentication failures, authorization failures, missing resources, conflicts, rate limits where appropriate, and unexpected server errors.

Do not expose database internals, stack traces, tokens, or secrets in client-facing errors.

Prevent mass assignment.

Never allow a user to grant themselves roles, change ownership, bypass approval, or modify privileged fields simply by sending a crafted request.

Validate requests on the server.

Use transactions or atomic database operations for workflows that require consistency.

---

# 23. AUTHENTICATION AND SESSION MANAGEMENT

Use Supabase Authentication.

Implement appropriate workflows for:

- Sign-up.
- Sign-in.
- Sign-out.
- Session handling.
- Profile creation.
- Password recovery.
- Email verification where appropriate.
- Account suspension.
- Account recovery.
- Protected routes.
- User lifecycle management.

Follow current supported Next.js and Supabase guidance.

Use server-side session verification for protected operations.

Do not trust client-only route guards.

Do not expose service-role credentials in the browser.

Authentication establishes identity; authorization determines what that identity can do.

Define what happens to active sessions and permissions when an account is suspended or a role is revoked.

---

# 24. AUTHORIZATION AND ROW LEVEL SECURITY

Design a coherent permission system.

Support:

- Global permissions.
- University-scoped permissions.
- Club-scoped permissions.
- Team-scoped permissions where required.
- Resource ownership.
- Public and private visibility.
- Explicit privileged operations.

Use stable permission identifiers rather than scattered checks against display names.

Implement reusable authorization helpers.

Use Supabase Row Level Security for appropriate exposed tables.

For every relevant table, specify and implement:

- SELECT policies.
- INSERT policies.
- UPDATE policies.
- DELETE policies.

Test both authorized and unauthorized access.

Test attempts to:

- Access another university's data.
- Access another club's private data.
- Modify privileged fields.
- Impersonate ownership.
- Escalate roles.
- Access private submissions.
- Continue using revoked permissions.

Where privileged server-side access bypasses RLS, perform equivalent explicit authorization checks and minimize the scope of the privileged operation.

Never use service-role credentials as a shortcut for normal user operations.

Do not assume that UI restrictions provide security.

---

# 25. CLOUDINARY SECURITY

Use Cloudinary for suitable media and image processing.

Define:

- Upload policies.
- File types.
- File-size limits.
- Ownership.
- Public and private delivery.
- Asset identifiers.
- Deletion behavior.
- Transformation policies.
- Signed uploads where appropriate.

Keep Cloudinary secrets server-only.

Validate authorization before issuing upload signatures or allowing media mutations.

Do not trust client-supplied Cloudinary identifiers without verifying ownership and scope.

Ensure private resources are not exposed through improperly configured delivery URLs.

---

# 26. UI/UX AND DESIGN SYSTEM

Create a polished, coherent, responsive administrative application.

The interface should feel like a professional SaaS ERP rather than a collection of disconnected generated pages.

Design:

- Application shell.
- Sidebar navigation.
- Top navigation.
- Breadcrumbs.
- Dashboard layouts.
- Data tables.
- Search and filtering.
- Forms.
- Dialogs and confirmation flows.
- Status indicators.
- Notifications.
- Empty states.
- Loading states.
- Error states.
- Responsive mobile layouts.
- Accessible interactive components.

Use a consistent design system for spacing, typography, colors, borders, and interaction states.

Use clear information hierarchy and avoid unnecessary visual clutter.

Use charts where they provide useful information.

Do not make every screen a dashboard.

Use realistic labels and coherent navigation.

Do not invent large amounts of fake production data. If demo data is required, isolate it clearly and never present it as live database content.

Ensure keyboard accessibility and appropriate contrast.

---

# 27. INTERNATIONALIZATION AND RTL

Prepare the application for multilingual use.

At minimum, consider Arabic and English support.

Because Arabic interfaces require right-to-left layout, ensure the architecture can support RTL without duplicating the entire UI.

Handle:

- Text direction.
- Navigation.
- Forms.
- Tables.
- Dates.
- Number formatting.
- Currency formatting.
- Localized labels.
- Validation messages.

Choose an appropriate internationalization strategy based on repository inspection.

Do not claim complete translations while leaving important screens untranslated.

If multilingual support is implemented incrementally, document its current coverage.

---

# 28. SECURITY AND PRIVACY

Apply secure development practices throughout the project.

Address:

- Server-side authorization.
- Tenant isolation.
- Input validation.
- SQL query safety.
- XSS prevention.
- CSRF considerations where relevant.
- Secure session handling.
- Rate limiting for sensitive operations.
- File-upload validation.
- Secret management.
- Error sanitization.
- Audit logging.
- Data minimization.
- Private file access.
- Backup and recovery.
- Dependency maintenance.
- Safe exports.

Use environment variables for secrets.

Provide `.env.example` with variable names and safe placeholders only.

Never commit real credentials.

Do not log access tokens, passwords, signing secrets, or unnecessary personal data.

Document any security limitations that cannot be resolved within the current infrastructure.

---

# 29. TESTING STRATEGY

Create tests alongside implementation.

Use appropriate tools for:

- Unit tests.
- Runtime validation tests.
- Database and migration tests.
- RLS tests.
- API tests.
- Authentication tests.
- Authorization tests.
- Integration tests.
- End-to-end tests.

Prioritize critical workflows and security boundaries.

Test:

- Multi-tenant isolation.
- Club membership permissions.
- Approval workflows.
- Duplicate registration prevention.
- Financial authorization.
- Dynamic form validation.
- Design Studio template access.
- Media upload authorization.
- Access after permission revocation.

Before declaring work complete, run available checks such as:

- Formatting.
- Linting.
- Type-checking.
- Unit tests.
- Integration tests.
- Production build.

If infrastructure or credentials are unavailable, clearly identify which tests could not run.

Never claim success for tests that were not executed.

Do not disable meaningful tests just to achieve a green build.

---

# 30. IMPLEMENTATION ROADMAP

Use the master plan to maintain an ordered, actionable checklist.

## Phase 0 — Repository and planning

- [ ] Inspect the repository.
- [ ] Identify the current state.
- [ ] Create `docs/PROJECT_MASTER_PLAN.md`.
- [ ] Define architecture and module boundaries.
- [ ] Design the initial database schema.
- [ ] Define API contracts.
- [ ] Define authorization and RLS strategy.
- [ ] Document security and testing requirements.
- [ ] Identify unresolved integrations.

## Phase 1 — Technical foundation

- [ ] Confirm application configuration.
- [ ] Configure the database development workflow.
- [ ] Create initial migrations.
- [ ] Configure Supabase authentication.
- [ ] Establish session handling.
- [ ] Implement shared types and validation.
- [ ] Implement the authorization foundation.
- [ ] Implement initial RLS policies.
- [ ] Configure application layout and design system.
- [ ] Add foundational tests.

## Phase 2 — Global administration

- [x] Platform administration.
- [x] University management.
- [ ] Organizational hierarchy.
- [ ] User administration.
- [ ] Roles and permissions.
- [ ] Club registration and approvals.
- [x] Administrative dashboards.

## Phase 3 — Club operations

- [ ] Club workspaces.
- [ ] Membership management.
- [ ] Student portal.
- [ ] Events and workshops.
- [ ] Registration and attendance.
- [ ] Dynamic forms.
- [ ] Tasks and documents.
- [ ] Announcements and notifications.

## Phase 4 — Business operations

- [ ] Finance and budgets.
- [ ] Expenses and approvals.
- [ ] Assets and sponsors.
- [ ] Certificates.
- [ ] Reporting and exports.

## Phase 5 — Design Studio

- [ ] Global template management.
- [ ] Template access grants.
- [ ] Club designer workspace.
- [ ] Design project lifecycle.
- [ ] Cloudinary integration.
- [ ] Canva integration where verified and feasible.
- [ ] Review and approval workflows.
- [ ] Secure export handling.

## Phase 6 — Integration and hardening

- [ ] Review database constraints.
- [ ] Verify RLS policies.
- [ ] Run cross-tenant security tests.
- [ ] Test critical end-to-end workflows.
- [ ] Fix accessibility and responsive issues.
- [ ] Review performance.
- [ ] Verify environment configuration.
- [ ] Prepare deployment documentation.
- [ ] Review backups and recovery.
- [ ] Update the master plan to reflect the actual implementation.

Adjust this roadmap to the real dependencies discovered in the repository. Do not implement everything in one uncontrolled code-generation step.

---

# 31. IMPLEMENTATION RULES

After creating and validating the master plan, begin implementation.

For every feature:

1. Review its requirements and dependencies.
2. Check the relevant section of the master plan.
3. Define the database and API changes.
4. Implement migrations where required.
5. Implement server-side business logic.
6. Implement authorization and RLS.
7. Add runtime validation.
8. Build the UI.
9. Add tests.
10. Run the relevant checks.
11. Fix errors.
12. Update the master plan and checklist.

Prefer small, verifiable changes.

Do not build the entire application in one giant patch.

Do not leave important functionality as placeholder buttons or fake responses while claiming completion.

If a feature cannot be fully implemented because it requires external credentials, unavailable APIs, or infrastructure, implement the supported portion and document the limitation.

Do not make unrelated changes without a clear reason.

Do not overwrite work that already exists and is functioning.

---

# 32. DEFINITION OF DONE

A feature is complete only when:

- The expected behavior is implemented.
- Relevant UI states exist.
- Server-side validation is present.
- Authentication and authorization are correct.
- Database constraints and RLS are appropriate.
- Error handling is implemented.
- Critical edge cases are addressed.
- Relevant tests are added.
- Available checks have been run.
- No known critical security issue is ignored.
- Documentation is updated.
- Any remaining limitation is explicitly reported.

A successful build alone does not prove that a feature is correct or secure.

The existence of a plan does not mean the application has been implemented.

---

# 33. FINAL EXECUTION INSTRUCTIONS

Start now.

First, inspect the repository.

Second, create `docs/PROJECT_MASTER_PLAN.md` as the first deliverable.

Third, make all initial architectural, database, API, authorization, and security decisions autonomously and document them in that file.

Fourth, validate that the plan is consistent, comprehensive, and actionable.

Fifth, start implementing the application incrementally according to the roadmap.

I am working alone, so do not create separate developer task files or assume another developer will implement any module.

You own the technical planning and implementation workflow, while I remain the project owner and decision-maker for product-level requirements.

Use Next.js, TypeScript, PostgreSQL, Supabase, and Cloudinary as the fixed stack.

Never fabricate capabilities, credentials, test results, or completed work.

At the end of each meaningful work session, report:

1. What you inspected or implemented.
2. Which files changed.
3. Which migrations were added.
4. Which tests and checks were actually executed.
5. Whether they passed.
6. Any remaining blockers.
7. The next concrete implementation task.

Be autonomous, systematic, security-conscious, and execution-oriented.

Inspect. Plan. Document. Implement. Test. Verify. Repeat.
