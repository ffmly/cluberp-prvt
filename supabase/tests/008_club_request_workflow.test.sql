begin;

select plan(20);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('91111111-1111-4111-8111-111111111111', 'club-applicant@example.test', '{"display_name":"Club Applicant"}'),
  ('92222222-2222-4222-8222-222222222222', 'club-reviewer@example.test', '{"display_name":"Club Reviewer"}'),
  ('93333333-3333-4333-8333-333333333333', 'club-outsider@example.test', '{"display_name":"Club Outsider"}'),
  ('94444444-4444-4444-8444-444444444444', 'club-suspended@example.test', '{"display_name":"Suspended Applicant"}');

insert into public.universities (id, name, slug, status, created_by)
values ('9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Club Workflow University', 'club-workflow-university', 'active', '92222222-2222-4222-8222-222222222222');

insert into public.university_role_assignments (university_id, user_id, role_id, assigned_by)
select '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '92222222-2222-4222-8222-222222222222', id, '92222222-2222-4222-8222-222222222222'
from public.roles where key = 'university_admin' and scope_type = 'university' and is_system;

update public.profiles
set account_status = 'suspended', suspended_at = statement_timestamp(),
    suspended_by = '92222222-2222-4222-8222-222222222222',
    suspension_reason = 'Security review pending'
where id = '94444444-4444-4444-8444-444444444444';

set local role authenticated;
set local request.jwt.claim.sub = '91111111-1111-4111-8111-111111111111';

select lives_ok(
  $$ select public.submit_club_request('9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'create', null, 'Robotics Club', 'robotics-club', 'Build and learn robotics together.') $$,
  'active user can submit a club creation request'
);

select results_eq(
  $$ select proposed_slug || ':' || status from public.list_my_club_requests() $$,
  array['robotics-club:submitted']::text[],
  'submitter can list their request'
);

select throws_ok(
  $$ select public.transition_club_request((select request_id from public.list_my_club_requests() where proposed_slug = 'robotics-club'), 'under_review', '') $$,
  '42501', null,
  'submitter cannot review their own request'
);

set local request.jwt.claim.sub = '93333333-3333-4333-8333-333333333333';

select is_empty(
  $$ select request_id from public.list_reviewable_club_requests() $$,
  'unrelated users cannot see the review queue'
);

select throws_ok(
  $$ select public.transition_club_request('90000000-0000-4000-8000-000000000009', 'under_review', '') $$,
  '42501', null,
  'unrelated users cannot transition requests'
);

set local request.jwt.claim.sub = '92222222-2222-4222-8222-222222222222';

select results_eq(
  $$ select proposed_slug from public.list_reviewable_club_requests() where status = 'submitted' $$,
  array['robotics-club']::text[],
  'authorized reviewer sees submitted requests'
);

select throws_ok(
  $$ select public.transition_club_request((select request_id from public.list_reviewable_club_requests() where proposed_slug = 'robotics-club'), 'approved', 'Approved') $$,
  '22023', null,
  'reviewer cannot skip the under-review transition'
);

select lives_ok(
  $$ select public.transition_club_request((select request_id from public.list_reviewable_club_requests() where proposed_slug = 'robotics-club'), 'under_review', '') $$,
  'reviewer can start review'
);

select is(
  (select status from public.list_reviewable_club_requests() where proposed_slug = 'robotics-club'),
  'under_review',
  'request enters under-review state'
);

select throws_ok(
  $$ select public.transition_club_request((select request_id from public.list_reviewable_club_requests() where proposed_slug = 'robotics-club'), 'rejected', '') $$,
  '22023', null,
  'rejection requires a reason'
);

select lives_ok(
  $$ select public.transition_club_request((select request_id from public.list_reviewable_club_requests() where proposed_slug = 'robotics-club'), 'approved', 'Governance requirements verified') $$,
  'reviewer can approve a request under review'
);

select is(
  (select status from public.clubs where university_id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' and slug = 'robotics-club'),
  'active',
  'approval atomically creates an active club'
);

select ok(
  (select club_id is not null from public.list_reviewable_club_requests() where proposed_slug = 'robotics-club'),
  'approved request links to the created club'
);

reset role;

select is(
  (select count(*) from public.audit_events where resource_type = 'club_request' and actor_id in ('91111111-1111-4111-8111-111111111111', '92222222-2222-4222-8222-222222222222')),
  3::bigint,
  'submission and both review transitions are audited'
);

set local role authenticated;
set local request.jwt.claim.sub = '91111111-1111-4111-8111-111111111111';

select ok(
  public.current_user_has_permission(
    'club.settings_manage', 'club',
    (select club_id from public.list_my_club_requests() where proposed_slug = 'robotics-club')
  ),
  'approved creator receives the system club-president role'
);

select lives_ok(
  $$
    select public.submit_club_request(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'renewal',
      (select club_id from public.list_my_club_requests() where proposed_slug = 'robotics-club'),
      'Robotics Club', 'robotics-club', 'Renewed robotics program.'
    )
  $$,
  'authorized club leader can submit a renewal request'
);

select throws_ok(
  $$ select public.submit_club_request('9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'create', null, 'Duplicate Robotics', 'robotics-club', '') $$,
  '23505', null,
  'creation requests cannot reuse an existing club slug'
);

set local request.jwt.claim.sub = '94444444-4444-4444-8444-444444444444';

select throws_ok(
  $$ select public.submit_club_request('9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'create', null, 'Suspended Club', 'suspended-club', '') $$,
  '42501', null,
  'suspended users cannot submit club requests'
);

set local request.jwt.claim.sub = '93333333-3333-4333-8333-333333333333';

select throws_ok(
  $$ insert into public.club_requests (university_id, request_type, submitter_id, proposed_name, proposed_slug) values ('9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'create', '93333333-3333-4333-8333-333333333333', 'Injected Club', 'injected-club') $$,
  '42501', null,
  'authenticated callers cannot bypass the submission RPC'
);

set local role anon;

select throws_ok(
  $$ select * from public.list_my_club_requests() $$,
  '42501', null,
  'anonymous callers cannot execute club request functions'
);

select * from finish();

rollback;
