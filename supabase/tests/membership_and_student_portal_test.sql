begin;

select plan(38);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('b1111111-1111-4111-8111-111111111111', 'membership-president@example.test', '{"display_name":"Membership President"}'),
  ('b2222222-2222-4222-8222-222222222222', 'membership-applicant@example.test', '{"display_name":"Membership Applicant"}'),
  ('b3333333-3333-4333-8333-333333333333', 'membership-invitee@example.test', '{"display_name":"Membership Invitee"}'),
  ('b4444444-4444-4444-8444-444444444444', 'membership-outsider@example.test', '{"display_name":"Membership Outsider"}');

insert into public.universities (id, name, slug, status, created_by)
values (
  'b0000000-0000-4000-8000-000000000001',
  'Membership University',
  'membership-university',
  'active',
  'b1111111-1111-4111-8111-111111111111'
);

insert into public.clubs (
  id, university_id, name, slug, description, visibility, status, created_by
) values (
  'bc000000-0000-4000-8000-000000000001',
  'b0000000-0000-4000-8000-000000000001',
  'Public Membership Club',
  'public-membership-club',
  'A discoverable club with a protected membership workflow.',
  'public',
  'active',
  'b1111111-1111-4111-8111-111111111111'
);

insert into public.club_role_assignments (club_id, user_id, role_id, assigned_by)
select
  'bc000000-0000-4000-8000-000000000001',
  'b1111111-1111-4111-8111-111111111111',
  role.id,
  'b1111111-1111-4111-8111-111111111111'
from public.roles as role
where role.key = 'club_president' and role.scope_type = 'club' and role.is_system;

set local role authenticated;
set local request.jwt.claim.sub = 'b2222222-2222-4222-8222-222222222222';

select results_eq(
  $$ select club_slug from public.list_discoverable_clubs('Membership') $$,
  array['public-membership-club']::text[],
  'student can discover a matching public club'
);

select lives_ok(
  $$
    select public.submit_membership_application(
      'bc000000-0000-4000-8000-000000000001', 'join', null,
      'I want to contribute to workshops and student projects.',
      '{"interests":["workshops","projects"]}'::jsonb
    )
  $$,
  'student can submit a membership application'
);

select results_eq(
  $$ select status from public.list_my_membership_applications() $$,
  array['submitted']::text[],
  'applicant can track their application'
);

select throws_ok(
  $$
    select public.submit_membership_application(
      'bc000000-0000-4000-8000-000000000001', 'join', null,
      'This duplicate open application must not be accepted.', '{}'::jsonb
    )
  $$,
  '23505', null,
  'duplicate open applications are blocked'
);

select throws_ok(
  $$
    select public.transition_membership_application(
      (select application_id from public.list_my_membership_applications()),
      'under_review', ''
    )
  $$,
  '42501', null,
  'applicant cannot review their own application'
);

set local request.jwt.claim.sub = 'b4444444-4444-4444-8444-444444444444';

select is_empty(
  $$ select application_id from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001') $$,
  'unrelated user cannot see the club review queue'
);

select throws_ok(
  $$
    select public.transition_membership_application(
      (select id from public.membership_applications limit 1), 'under_review', ''
    )
  $$,
  '42501', null,
  'unrelated user cannot transition an application'
);

select throws_ok(
  $$
    insert into public.club_memberships (club_id, user_id, created_by)
    values (
      'bc000000-0000-4000-8000-000000000001',
      'b4444444-4444-4444-8444-444444444444',
      'b4444444-4444-4444-8444-444444444444'
    )
  $$,
  '42501', null,
  'authenticated users cannot insert memberships directly'
);

set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

select results_eq(
  $$ select applicant_email from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001') where status = 'submitted' $$,
  array['membership-applicant@example.test']::text[],
  'authorized reviewer sees submitted applications'
);

select throws_ok(
  $$
    select public.transition_membership_application(
      (select application_id from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001')),
      'approved', 'Approved immediately'
    )
  $$,
  '22023', null,
  'reviewer cannot skip under-review state'
);

select lives_ok(
  $$
    select public.transition_membership_application(
      (select application_id from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001')),
      'under_review', ''
    )
  $$,
  'reviewer can start application review'
);

select throws_ok(
  $$
    select public.transition_membership_application(
      (select application_id from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001')),
      'rejected', ''
    )
  $$,
  '22023', null,
  'rejection requires a reason'
);

select lives_ok(
  $$
    select public.transition_membership_application(
      (select application_id from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001')),
      'approved', 'Application meets club requirements'
    )
  $$,
  'reviewer can approve an application atomically'
);

select is(
  (select count(*) from public.list_club_members('bc000000-0000-4000-8000-000000000001') where membership_status = 'active'),
  1::bigint,
  'approval creates one active membership'
);

set local request.jwt.claim.sub = 'b2222222-2222-4222-8222-222222222222';

select results_eq(
  $$ select membership_status from public.list_my_memberships() $$,
  array['active']::text[],
  'student portal lists the approved membership'
);

select ok(
  private.current_user_has_club_access('bc000000-0000-4000-8000-000000000001'),
  'active member receives club workspace access'
);

select results_eq(
  $$ select club_slug from public.list_my_club_workspaces() $$,
  array['public-membership-club']::text[],
  'active member sees the club workspace'
);

set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.transition_membership_status(
      (select membership_id from public.list_club_members('bc000000-0000-4000-8000-000000000001')),
      'suspended', 'Temporary conduct review in progress'
    )
  $$,
  'authorized manager can suspend a membership'
);

set local request.jwt.claim.sub = 'b2222222-2222-4222-8222-222222222222';

select is(
  private.current_user_has_club_access('bc000000-0000-4000-8000-000000000001'),
  false,
  'suspension removes club access immediately'
);

set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.transition_membership_status(
      (select membership_id from public.list_club_members('bc000000-0000-4000-8000-000000000001')),
      'active', 'Conduct review completed successfully'
    )
  $$,
  'authorized manager can reactivate a suspended membership'
);

set local request.jwt.claim.sub = 'b2222222-2222-4222-8222-222222222222';

select lives_ok(
  $$
    select public.resign_membership(
      (select membership_id from public.list_my_memberships()),
      'Leaving after completing the academic year'
    )
  $$,
  'member can resign their own membership'
);

select results_eq(
  $$ select membership_status from public.list_my_memberships() $$,
  array['resigned']::text[],
  'resignation is visible in membership history'
);

select lives_ok(
  $$
    select public.submit_membership_application(
      'bc000000-0000-4000-8000-000000000001', 'renewal',
      (select membership_id from public.list_my_memberships()),
      'I want to renew and continue contributing next year.', '{}'::jsonb
    )
  $$,
  'former member can submit an eligible renewal'
);

set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.transition_membership_application(
      (select application_id from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001') where application_type = 'renewal'),
      'under_review', ''
    )
  $$,
  'reviewer can start renewal review'
);

select lives_ok(
  $$
    select public.transition_membership_application(
      (select application_id from public.list_reviewable_membership_applications('bc000000-0000-4000-8000-000000000001') where application_type = 'renewal'),
      'approved', 'Renewal requirements verified'
    )
  $$,
  'renewal approval reactivates the existing membership'
);

select is(
  (select membership_status from public.list_club_members('bc000000-0000-4000-8000-000000000001')),
  'active',
  'renewed membership is active'
);

select is(
  (select count(*) from public.membership_status_history where user_id = 'b2222222-2222-4222-8222-222222222222'),
  5::bigint,
  'all membership lifecycle transitions append history'
);

select lives_ok(
  $$
    select public.create_club_invitation(
      'bc000000-0000-4000-8000-000000000001',
      'membership-invitee@example.test',
      'membership-invitation-token-0000000000000001',
      statement_timestamp() + interval '7 days'
    )
  $$,
  'authorized manager can create a hashed invitation'
);

select results_eq(
  $$ select recipient_email from public.list_club_invitations('bc000000-0000-4000-8000-000000000001') where invitation_status = 'pending' $$,
  array['membership-invitee@example.test']::text[],
  'manager can list pending invitations without raw tokens'
);

reset role;

select isnt(
  (select token_digest from public.club_invitations where recipient_email = 'membership-invitee@example.test'),
  'membership-invitation-token-0000000000000001',
  'invitation stores only the token digest'
);

set local role authenticated;
set local request.jwt.claim.sub = 'b4444444-4444-4444-8444-444444444444';

select throws_ok(
  $$ select public.accept_club_invitation('membership-invitation-token-0000000000000001') $$,
  '42501', null,
  'invitation cannot be accepted by another email'
);

set local request.jwt.claim.sub = 'b3333333-3333-4333-8333-333333333333';

select lives_ok(
  $$ select public.accept_club_invitation('membership-invitation-token-0000000000000001') $$,
  'intended recipient can accept the invitation'
);

select results_eq(
  $$ select membership_status from public.list_my_memberships() $$,
  array['active']::text[],
  'accepted invitation creates an active membership'
);

select throws_ok(
  $$ select public.accept_club_invitation('membership-invitation-token-0000000000000001') $$,
  '42501', null,
  'an invitation token cannot be reused'
);

set local request.jwt.claim.sub = 'b1111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.create_club_invitation(
      'bc000000-0000-4000-8000-000000000001',
      'membership-outsider@example.test',
      'membership-invitation-token-0000000000000002',
      statement_timestamp() + interval '7 days'
    )
  $$,
  'manager can create another invitation'
);

select lives_ok(
  $$
    select public.revoke_club_invitation(
      (select invitation_id from public.list_club_invitations('bc000000-0000-4000-8000-000000000001') where recipient_email = 'membership-outsider@example.test')
    )
  $$,
  'manager can revoke a pending invitation'
);

reset role;

select is(
  (
    select count(*) from public.audit_events
    where club_id = 'bc000000-0000-4000-8000-000000000001'
      and action like 'membership_application.%'
  ),
  6::bigint,
  'application submissions and review transitions are audited'
);

set local role anon;

select throws_ok(
  $$ select * from public.list_discoverable_clubs('') $$,
  '42501', null,
  'anonymous callers cannot use the student club directory'
);

select * from finish();

rollback;
