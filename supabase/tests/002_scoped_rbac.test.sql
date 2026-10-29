begin;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'university-admin@example.test', '{"display_name":"University Admin"}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'club-leader@example.test', '{"display_name":"Club Leader"}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'platform-owner@example.test', '{"display_name":"Platform Owner"}'::jsonb);

insert into public.universities (id, name, slug, status, created_by)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'First University', 'first-university', 'active', '33333333-3333-3333-3333-333333333333'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Second University', 'second-university', 'active', '33333333-3333-3333-3333-333333333333');

insert into public.clubs (id, university_id, name, slug, visibility, status, created_by)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'First Club', 'first-club', 'private', 'active', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Second Club', 'second-club', 'private', 'active', '33333333-3333-3333-3333-333333333333');

insert into public.teams (id, club_id, name, created_by)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'First Team', '22222222-2222-2222-2222-222222222222'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Second Team', '33333333-3333-3333-3333-333333333333');

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select
  '33333333-3333-3333-3333-333333333333',
  id,
  '33333333-3333-3333-3333-333333333333'
from public.roles
where key = 'platform_owner' and scope_type = 'platform' and is_system;

insert into public.university_role_assignments (
  university_id,
  user_id,
  role_id,
  assigned_by
)
select
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '11111111-1111-1111-1111-111111111111',
  id,
  '33333333-3333-3333-3333-333333333333'
from public.roles
where key = 'university_admin' and scope_type = 'university' and is_system;

insert into public.club_role_assignments (club_id, user_id, role_id, assigned_by)
select
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
  '22222222-2222-2222-2222-222222222222',
  id,
  '11111111-1111-1111-1111-111111111111'
from public.roles
where key = 'club_president' and scope_type = 'club' and is_system;

insert into public.team_role_assignments (team_id, user_id, role_id, assigned_by)
select
  'cccccccc-cccc-cccc-cccc-ccccccccccc1',
  '22222222-2222-2222-2222-222222222222',
  id,
  '11111111-1111-1111-1111-111111111111'
from public.roles
where key = 'team_lead' and scope_type = 'team' and is_system;

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select ok(
  private.has_platform_permission('platform.universities_manage'),
  'platform owner receives platform permission'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select ok(
  not private.has_platform_permission('platform.universities_manage'),
  'university administrator does not receive platform permission'
);

select ok(
  private.has_university_permission(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'university.settings_manage'
  ),
  'university administrator receives permission in assigned university'
);

select ok(
  not private.has_university_permission(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'university.settings_manage'
  ),
  'university administrator is isolated from another university'
);

select ok(
  private.has_club_permission(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'club.events_manage'
  ),
  'university administrator receives descendant club permission'
);

select ok(
  not private.has_club_permission(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'club.events_manage'
  ),
  'descendant club permission does not cross university boundaries'
);

select results_eq(
  $$select university_id::text from public.university_role_assignments order by university_id$$,
  array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1']::text[],
  'users can read only their own university assignments'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select ok(
  private.has_club_permission(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'club.finance_approve'
  ),
  'club president receives club permission in assigned club'
);

select ok(
  not private.has_club_permission(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'club.finance_approve'
  ),
  'club permission does not cross club boundaries'
);

select ok(
  private.has_team_permission(
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'team.tasks_manage'
  ),
  'team lead receives team permission in assigned team'
);

select ok(
  not private.has_team_permission(
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'team.tasks_manage'
  ),
  'team permission does not cross team boundaries'
);

select is_empty(
  $$select university_id from public.university_role_assignments$$,
  'club leader cannot read another user university assignment'
);

reset role;

select throws_ok(
  $$
    insert into public.club_role_assignments (club_id, user_id, role_id, assigned_by)
    select
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
      '22222222-2222-2222-2222-222222222222',
      id,
      '33333333-3333-3333-3333-333333333333'
    from public.roles
    where key = 'university_admin' and scope_type = 'university' and is_system
  $$,
  '23514',
  'Role is not valid for this assignment scope',
  'database rejects a role assigned to the wrong scope'
);

set local role anon;

select throws_ok(
  $$select private.has_platform_permission('platform.universities_manage')$$,
  '42501',
  null,
  'anonymous callers cannot execute private authorization helpers'
);

select * from finish();

rollback;
