begin;

select plan(12);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('41111111-1111-1111-1111-111111111111', 'university-admin@example.test', '{"display_name":"University Admin"}'::jsonb),
  ('42222222-2222-2222-2222-222222222222', 'faculty-supervisor@example.test', '{"display_name":"Faculty Supervisor"}'::jsonb),
  ('43333333-3333-3333-3333-333333333333', 'platform-owner@example.test', '{"display_name":"Platform Owner"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'unrelated-user@example.test', '{"display_name":"Unrelated User"}'::jsonb);

insert into public.universities (id, name, slug, status, created_by)
values
  ('4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'First University', 'org-first-university', 'active', '43333333-3333-3333-3333-333333333333'),
  ('4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Second University', 'org-second-university', 'active', '43333333-3333-3333-3333-333333333333');

insert into public.campuses (id, university_id, code, name, created_by)
values
  ('4caaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'MAIN', 'Main Campus', '43333333-3333-3333-3333-333333333333'),
  ('4caaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'NORTH', 'North Campus', '43333333-3333-3333-3333-333333333333');

insert into public.faculties (
  id,
  university_id,
  campus_id,
  code,
  name,
  created_by
)
values (
  '4faaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '4caaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'SCI',
  'Faculty of Science',
  '43333333-3333-3333-3333-333333333333'
);

insert into public.departments (
  id,
  university_id,
  faculty_id,
  code,
  name,
  created_by
)
values (
  '4daaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '4faaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'CS',
  'Computer Science',
  '43333333-3333-3333-3333-333333333333'
);

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select
  '43333333-3333-3333-3333-333333333333',
  id,
  '43333333-3333-3333-3333-333333333333'
from public.roles
where key = 'platform_owner' and scope_type = 'platform' and is_system;

insert into public.university_role_assignments (
  university_id,
  user_id,
  role_id,
  assigned_by
)
select
  '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '41111111-1111-1111-1111-111111111111',
  id,
  '43333333-3333-3333-3333-333333333333'
from public.roles
where key = 'university_admin' and scope_type = 'university' and is_system;

set local role authenticated;
set local request.jwt.claim.sub = '41111111-1111-1111-1111-111111111111';

select ok(
  private.has_university_permission(
    '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'university.units_manage'
  ),
  'university administrator receives unit management permission'
);

select results_eq(
  $$select code from public.campuses order by code$$,
  array['MAIN']::text[],
  'university administrator reads units only in the assigned university'
);

select lives_ok(
  $$
    insert into public.campuses (
      university_id,
      code,
      name,
      created_by
    ) values (
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'SOUTH',
      'South Campus',
      '41111111-1111-1111-1111-111111111111'
    )
  $$,
  'university administrator can create a campus in the assigned university'
);

select throws_ok(
  $$
    insert into public.campuses (
      university_id,
      code,
      name,
      created_by
    ) values (
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      'SOUTH',
      'Unauthorized Campus',
      '41111111-1111-1111-1111-111111111111'
    )
  $$,
  '42501',
  null,
  'RLS rejects a unit created in another university'
);

select throws_ok(
  $$
    insert into public.faculties (
      university_id,
      campus_id,
      code,
      name,
      created_by
    ) values (
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      '4caaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      'BAD',
      'Cross Tenant Faculty',
      '41111111-1111-1111-1111-111111111111'
    )
  $$,
  '23503',
  null,
  'composite foreign key rejects cross-university hierarchy links'
);

select lives_ok(
  $$
    insert into public.university_staff_assignments (
      university_id,
      user_id,
      scope_type,
      faculty_id,
      staff_type,
      title,
      assigned_by
    ) values (
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      '42222222-2222-2222-2222-222222222222',
      'faculty',
      '4faaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'supervisor',
      'Faculty Supervisor',
      '41111111-1111-1111-1111-111111111111'
    )
  $$,
  'university administrator can assign staff inside the university'
);

select throws_ok(
  $$
    insert into public.university_staff_assignments (
      university_id,
      user_id,
      scope_type,
      faculty_id,
      staff_type,
      title,
      assigned_by
    ) values (
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      '42222222-2222-2222-2222-222222222222',
      'faculty',
      '4faaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'supervisor',
      'Duplicate Supervisor',
      '41111111-1111-1111-1111-111111111111'
    )
  $$,
  '23505',
  null,
  'database rejects duplicate current staff assignments'
);

select throws_ok(
  $$
    insert into public.university_staff_assignments (
      university_id,
      user_id,
      scope_type,
      staff_type,
      assigned_by
    ) values (
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
      '44444444-4444-4444-4444-444444444444',
      'university',
      'reviewer',
      '41111111-1111-1111-1111-111111111111'
    )
  $$,
  '42501',
  null,
  'RLS rejects staff assignment in another university'
);

select is(
  (select count(*) from public.university_staff_assignments),
  1::bigint,
  'university administrator reads staff only in the assigned university'
);

set local request.jwt.claim.sub = '42222222-2222-2222-2222-222222222222';

select results_eq(
  $$select staff_type from public.university_staff_assignments$$,
  array['supervisor']::text[],
  'staff member can read their own assignment'
);

select is_empty(
  $$select id from public.campuses$$,
  'an organizational staff record does not grant RBAC permissions'
);

set local request.jwt.claim.sub = '43333333-3333-3333-3333-333333333333';

select is(
  (
    select count(*)
    from public.campuses
    where university_id in (
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      '4aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
    )
  ),
  3::bigint,
  'platform owner receives descendant unit visibility across universities'
);

select * from finish();

rollback;
