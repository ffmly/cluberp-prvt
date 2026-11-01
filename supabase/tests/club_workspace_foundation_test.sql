begin;

select plan(24);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('a1111111-1111-4111-8111-111111111111', 'workspace-president@example.test', '{"display_name":"Workspace President"}'),
  ('a2222222-2222-4222-8222-222222222222', 'workspace-candidate@example.test', '{"display_name":"Workspace Candidate"}'),
  ('a3333333-3333-4333-8333-333333333333', 'workspace-outsider@example.test', '{"display_name":"Workspace Outsider"}'),
  ('a4444444-4444-4444-8444-444444444444', 'workspace-university-admin@example.test', '{"display_name":"Workspace University Admin"}');

insert into public.universities (id, name, slug, status, created_by)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Workspace University',
  'workspace-university',
  'active',
  'a4444444-4444-4444-8444-444444444444'
);

insert into public.clubs (
  id, university_id, name, slug, description, visibility, status, created_by
) values (
  'ac000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Workspace Club',
  'workspace-club',
  'A club used to verify the workspace foundation.',
  'private',
  'active',
  'a1111111-1111-4111-8111-111111111111'
);

insert into public.club_role_assignments (club_id, user_id, role_id, assigned_by)
select
  'ac000000-0000-4000-8000-000000000001',
  'a1111111-1111-4111-8111-111111111111',
  role.id,
  'a1111111-1111-4111-8111-111111111111'
from public.roles as role
where role.key = 'club_president' and role.scope_type = 'club' and role.is_system;

insert into public.university_role_assignments (
  university_id, user_id, role_id, assigned_by
)
select
  'a0000000-0000-4000-8000-000000000001',
  'a4444444-4444-4444-8444-444444444444',
  role.id,
  'a4444444-4444-4444-8444-444444444444'
from public.roles as role
where role.key = 'university_admin' and role.scope_type = 'university' and role.is_system;

set local role authenticated;
set local request.jwt.claim.sub = 'a1111111-1111-4111-8111-111111111111';

select results_eq(
  $$ select club_slug from public.list_my_club_workspaces() $$,
  array['workspace-club']::text[],
  'club president sees their workspace'
);

select is(
  (select can_manage_teams from public.get_club_workspace('ac000000-0000-4000-8000-000000000001')),
  true,
  'workspace exposes server-authorized capabilities'
);

select lives_ok(
  $$ select public.save_club_team('ac000000-0000-4000-8000-000000000001', null, 'Events Committee', 'Plans club events.') $$,
  'authorized leader can create a team'
);

select results_eq(
  $$ select team_name || ':' || team_status from public.list_club_teams('ac000000-0000-4000-8000-000000000001') $$,
  array['Events Committee:active']::text[],
  'authorized club users can list teams'
);

select lives_ok(
  $$
    select public.save_club_team(
      'ac000000-0000-4000-8000-000000000001',
      (select team_id from public.list_club_teams('ac000000-0000-4000-8000-000000000001') where team_name = 'Events Committee'),
      'Programs Committee',
      'Plans programs and events.'
    )
  $$,
  'authorized leader can update a team'
);

select lives_ok(
  $$
    select public.archive_club_team(
      'ac000000-0000-4000-8000-000000000001',
      (select team_id from public.list_club_teams('ac000000-0000-4000-8000-000000000001') where team_name = 'Programs Committee')
    )
  $$,
  'authorized leader can archive a team'
);

select results_eq(
  $$ select team_status from public.list_club_teams('ac000000-0000-4000-8000-000000000001') $$,
  array['archived']::text[],
  'archived team remains visible in workspace history'
);

select results_eq(
  $$ select email from public.lookup_club_role_candidate('ac000000-0000-4000-8000-000000000001', 'WORKSPACE-CANDIDATE@example.test') $$,
  array['workspace-candidate@example.test']::text[],
  'role manager can find an exact email candidate'
);

select ok(
  exists (
    select 1 from public.list_assignable_club_roles('ac000000-0000-4000-8000-000000000001')
    where role_key = 'club_president'
  ),
  'authorized roles are available for assignment'
);

select lives_ok(
  $$
    select public.assign_club_role(
      'ac000000-0000-4000-8000-000000000001',
      'a2222222-2222-4222-8222-222222222222',
      (select role_id from public.list_assignable_club_roles('ac000000-0000-4000-8000-000000000001') where role_key = 'club_president')
    )
  $$,
  'authorized leader can assign a club leadership role'
);

select is(
  (select count(*) from public.list_club_leadership('ac000000-0000-4000-8000-000000000001')),
  2::bigint,
  'leadership directory lists active assignments'
);

select throws_ok(
  $$
    select public.assign_club_role(
      'ac000000-0000-4000-8000-000000000001',
      'a2222222-2222-4222-8222-222222222222',
      (select role_id from public.list_assignable_club_roles('ac000000-0000-4000-8000-000000000001') where role_key = 'club_president')
    )
  $$,
  '23505', null,
  'duplicate active leadership assignment is rejected'
);

select lives_ok(
  $$
    select public.revoke_club_role(
      'ac000000-0000-4000-8000-000000000001',
      (select assignment_id from public.list_club_leadership('ac000000-0000-4000-8000-000000000001') where user_id = 'a1111111-1111-4111-8111-111111111111'),
      'Leadership handover completed'
    )
  $$,
  'a president can be revoked after a successor is assigned'
);

set local request.jwt.claim.sub = 'a2222222-2222-4222-8222-222222222222';

select throws_ok(
  $$
    select public.revoke_club_role(
      'ac000000-0000-4000-8000-000000000001',
      (select assignment_id from public.list_club_leadership('ac000000-0000-4000-8000-000000000001') where user_id = 'a2222222-2222-4222-8222-222222222222'),
      'Remove the final president'
    )
  $$,
  '23514', null,
  'the final club president cannot be revoked'
);

set local request.jwt.claim.sub = 'a3333333-3333-4333-8333-333333333333';

select is_empty(
  $$ select club_id from public.list_my_club_workspaces() $$,
  'unrelated user has no club workspaces'
);

select is_empty(
  $$ select team_id from public.list_club_teams('ac000000-0000-4000-8000-000000000001') $$,
  'unrelated user cannot list private club teams'
);

select throws_ok(
  $$ select public.save_club_team('ac000000-0000-4000-8000-000000000001', null, 'Injected Team', '') $$,
  '42501', null,
  'unrelated user cannot create a team'
);

select throws_ok(
  $$ insert into public.teams (club_id, name, created_by) values ('ac000000-0000-4000-8000-000000000001', 'Direct Team', 'a3333333-3333-4333-8333-333333333333') $$,
  '42501', null,
  'authenticated callers cannot bypass the team RPC'
);

select is_empty(
  $$ select user_id from public.lookup_club_role_candidate('ac000000-0000-4000-8000-000000000001', 'workspace-candidate@example.test') $$,
  'unrelated user cannot search the user directory'
);

select throws_ok(
  $$
    select public.assign_club_role(
      'ac000000-0000-4000-8000-000000000001',
      'a3333333-3333-4333-8333-333333333333',
      (select id from public.roles where key = 'club_president' and scope_type = 'club' and is_system)
    )
  $$,
  '42501', null,
  'unrelated user cannot assign leadership roles'
);

set local request.jwt.claim.sub = 'a4444444-4444-4444-8444-444444444444';

select results_eq(
  $$ select club_slug from public.list_my_club_workspaces() $$,
  array['workspace-club']::text[],
  'university administrator receives descendant club access'
);

reset role;

select is(
  (
    select count(*) from public.audit_events
    where club_id = 'ac000000-0000-4000-8000-000000000001'
      and action in ('team.created', 'team.updated', 'team.archived', 'club_role.assigned', 'club_role.revoked')
  ),
  5::bigint,
  'team and leadership changes are audited'
);

update public.profiles
set account_status = 'suspended',
    suspended_at = statement_timestamp(),
    suspended_by = 'a4444444-4444-4444-8444-444444444444',
    suspension_reason = 'Workspace access security review'
where id = 'a2222222-2222-4222-8222-222222222222';

set local role authenticated;
set local request.jwt.claim.sub = 'a2222222-2222-4222-8222-222222222222';

select is_empty(
  $$ select club_id from public.list_my_club_workspaces() $$,
  'suspended leader immediately loses workspace access'
);

set local role anon;

select throws_ok(
  $$ select * from public.list_my_club_workspaces() $$,
  '42501', null,
  'anonymous callers cannot execute workspace functions'
);

select * from finish();

rollback;
