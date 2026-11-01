# Club ERP local demo guide

This guide is for the local Supabase environment only. The demo credentials
must never be copied to a hosted or production project.

## Start the platform

- Arabic: `http://localhost:3000/ar`
- English: `http://localhost:3000/en`
- Supabase Studio: `http://127.0.0.1:54323`

All demo personas use the same local-only password: `DemoTest!2026`.

| Persona | Email | Effective access |
| --- | --- | --- |
| Platform Owner | `owner@club-erp.test` | Global administration and every scoped permission |
| University Admin | `university-admin@club-erp.test` | The selected university plus its clubs and teams |
| Club President | `club-president@club-erp.test` | Full management of the selected club and its teams |
| Team Lead | `team-lead@club-erp.test` | Active club membership plus the selected team lead role |
| Club Member | `club-member@club-erp.test` | Active membership and member-facing operations |
| Applicant | `applicant@club-erp.test` | Authenticated student with no membership yet |

Sign out before changing persona. Sessions are isolated by browser cookies, so
an incognito/private window is also useful when comparing two personas.

## Recreate the demo personas

The fixture is idempotent and targets the latest active university, club, and
team. It expects the Phase 3 working dataset to exist first.

```powershell
Get-Content -Raw supabase\fixtures\demo-personas.sql |
  docker exec -i supabase_db_club-erp psql -U postgres -d postgres
```

## Exploration flows

### 1. Platform Owner — global administration

1. Sign in as `owner@club-erp.test`.
2. From the dashboard, open **Administration**.
3. Open **Universities** to create or edit a university.
4. Open a university to manage campuses, faculties, and departments.
5. Open its staff page to assign university, campus, faculty, or department
   staff positions.
6. Open **Users** to inspect profiles and suspend or reactivate an account.
7. Open **Roles** to inspect system roles, create platform roles, and choose
   granular permission bundles.
8. Open **Club requests** to review submitted club creation or affiliation
   requests.
9. Open **Audit** to inspect security and business changes.

Expected result: this is the only persona that can enter the global `/admin`
area. Destructive or sensitive changes are recorded in the audit trail.

### 2. Applicant — discovery and membership application

1. Sign in as `applicant@club-erp.test`.
2. Open **Discover clubs**.
3. Open the public robotics club and submit a membership application with a
   motivation.
4. Open **My memberships** to see the pending application.
5. Open **Discover events** to see public events. Member-only events remain
   protected.
6. Open **Notifications**; it starts empty until a workflow targets this user.

Expected result: the applicant can discover public content and submit their own
application, but cannot manage a club or read private member data.

### 3. Club President — approve and operate the club

1. Sign in as `club-president@club-erp.test`.
2. Open **Club workspaces**, then the robotics club.
3. Create or edit a team and inspect leadership assignments.
4. Open **Members** to review the applicant's request, approve or reject it,
   invite registered users, suspend/restore memberships, renew validity, or end
   a membership.
5. Open **Events** to create a draft event or workshop and submit it for
   approval.
6. Open **Operations** to create and publish a versioned form, create tasks,
   assign a task to a member, add document metadata, and draft/publish an
   announcement.

Expected result: the president has club and team management permissions. A
president cannot approve an event that the same account created; use the
University Admin for the second-person approval step.

### 4. University Admin — scoped oversight and second-person approval

1. Sign in as `university-admin@club-erp.test`.
2. Open **Club workspaces** and enter the same robotics club.
3. Inspect teams, leadership, members, events, and operations across the
   university's club scope.
4. Open the event submitted by the Club President and publish it.
5. Review the event status history and approval identity.
6. Create or manage club content when university-level intervention is needed.

Expected result: university scope inherits club and team permissions for that
university. The current UI does not yet expose a separate university-admin
console; the global `/admin` area remains Platform Owner-only.

### 5. Club Member — member self-service

1. Sign in as `club-member@club-erp.test`.
2. Open **My memberships** to inspect the active membership and validity.
3. Open **Discover events** and register for the event published by the
   University Admin.
4. If capacity is full, the registration becomes waitlisted. Cancelling a
   confirmed registration promotes the oldest waitlisted registration.
5. Enter the club **Operations** page to submit published dynamic forms, read
   member announcements and documents, and comment on visible tasks.
6. Open **Notifications** and mark announcement or task notifications as read.

Expected result: the member can act on their own registrations, submissions,
notifications, and assigned tasks without receiving management permissions.

### 6. Team Lead — current team-scoped experience

1. Sign in as `team-lead@club-erp.test`.
2. Open the robotics club and inspect the Programs team.
3. Use the member-facing event, form, task comment, membership, and
   notification flows.
4. Compare this account with the Club Member to confirm the team role is stored
   separately from club membership.

Expected result: the account has the `team_lead` role and
`team.tasks_manage` permission in the database. A dedicated team task workspace
is not exposed in the Phase 3 UI yet, so team-only task creation is not a
complete browser flow at this stage.

## Cross-persona end-to-end scenarios

### Membership lifecycle

1. Applicant submits an application.
2. Club President approves it.
3. Applicant signs back in and sees the active membership.
4. President renews, suspends/restores, or ends it.
5. Both sides see the updated state; management actions keep history.

### Event lifecycle and separation of duties

1. Club President creates a draft event and submits it.
2. University Admin publishes it. The creator cannot approve their own event.
3. Club Member registers; another user can be waitlisted when capacity is full.
4. President records attendance or corrects it with a reason.
5. Status and attendance history remain available for review.

### Collaboration and notifications

1. Club President publishes a dynamic form and assigns a task to Club Member.
2. Club Member submits the form, comments on the task, changes an assigned task
   status, and reads the task notification.
3. President registers protected document metadata and publishes an
   announcement.
4. Club Member receives the announcement notification and reads authorized
   content only.

## What the platform currently delivers

### Identity and authorization

- Email/password authentication with confirmed local demo accounts.
- Active/suspended account enforcement.
- Scoped RBAC at platform, university, club, and team levels.
- Server-side permission checks plus database RLS and privileged RPC checks.
- Arabic and English routes with locale switching.

### Platform and university administration

- University lifecycle management.
- Campus, faculty, and department hierarchy.
- Scoped university staff assignments.
- User suspension/reactivation.
- Configurable platform roles and permission bundles.
- Auditable administrative changes.
- Club creation/affiliation request review.

### Club and membership operations

- Club workspaces, teams, and leadership assignments.
- Public club discovery.
- Applications, invitations, approval/rejection, renewals, suspension,
  restoration, resignation, ending, and membership history.
- Personal student membership portal.

### Events and workshops

- Draft, approval, publication, cancellation, and completion lifecycle.
- Second-person publication approval.
- Public/member visibility and eligibility rules.
- Capacity, confirmed registration, atomic waitlist promotion, cancellation,
  attendance, corrections, and history.

### Forms and collaboration

- Versioned dynamic form definitions and publication.
- Server-validated answers and retained submission versions.
- Club tasks, assignees, priorities, due dates, status history, comments, and
  assignment notifications.
- Protected document/media metadata with manager/member visibility.
- Draft/published announcements and recipient-owned in-app notifications.

### Current boundaries

- Phase 4 finance, expenses, assets, sponsors, partnerships, certificates,
  reporting, and export workflows are not implemented yet.
- Cloudinary metadata and access rules exist, but real upload/signing remains
  disabled until restricted credentials are configured.
- External email delivery, Canva, Sentry, and managed rate limiting are not
  enabled in the local environment.
- The University Admin uses club workspaces today; a dedicated university admin
  console is not exposed yet.
- Team Lead authorization exists, but a dedicated team task UI is still missing.
