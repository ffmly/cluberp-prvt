begin;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '61111111-1111-1111-1111-111111111111',
    'directory-admin@example.test',
    '{"display_name":"Directory Admin"}'::jsonb
  ),
  (
    '62222222-2222-2222-2222-222222222222',
    'directory-staff@example.test',
    '{"display_name":"Directory Staff"}'::jsonb
  ),
  (
    '63333333-3333-3333-3333-333333333333',
    'directory-outsider@example.test',
    '{"display_name":"Directory Outsider"}'::jsonb
  ),
  (
    '64444444-4444-4444-4444-444444444444',
    'directory-owner@example.test',
    '{"display_name":"Directory Owner"}'::jsonb
  );

insert into public.universities (id, name, slug, status, created_by)
values (
  '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  'Directory University',
  'directory-university',
  'active',
  '64444444-4444-4444-4444-444444444444'
);

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select
  '64444444-4444-4444-4444-444444444444',
  id,
  '64444444-4444-4444-4444-444444444444'
from public.roles
where key = 'platform_owner' and scope_type = 'platform' and is_system;

insert into public.university_role_assignments (
  university_id,
  user_id,
  role_id,
  assigned_by
)
select
  '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '61111111-1111-1111-1111-111111111111',
  id,
  '64444444-4444-4444-4444-444444444444'
from public.roles
where key = 'university_admin' and scope_type = 'university' and is_system;

insert into public.university_staff_assignments (
  university_id,
  user_id,
  scope_type,
  staff_type,
  title,
  assigned_by
)
values (
  '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
  '62222222-2222-2222-2222-222222222222',
  'university',
  'supervisor',
  'University Supervisor',
  '61111111-1111-1111-1111-111111111111'
);

set local role authenticated;
set local request.jwt.claim.sub = '61111111-1111-1111-1111-111111111111';

select results_eq(
  $$
    select email
    from public.lookup_university_staff_candidate(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'DIRECTORY-STAFF@EXAMPLE.TEST'
    )
  $$,
  array['directory-staff@example.test']::text[],
  'authorized manager can find an exact email without case sensitivity'
);

select is_empty(
  $$
    select user_id
    from public.lookup_university_staff_candidate(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'directory-staff'
    )
  $$,
  'candidate lookup does not allow partial email enumeration'
);

select results_eq(
  $$
    select display_name
    from public.list_university_staff(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
    )
  $$,
  array['Directory Staff']::text[],
  'authorized manager receives the scoped staff directory'
);

select results_eq(
  $$
    select staff_type || ':' || status
    from public.list_university_staff(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
    )
  $$,
  array['supervisor:active']::text[],
  'staff directory returns assignment details'
);

set local request.jwt.claim.sub = '63333333-3333-3333-3333-333333333333';

select is_empty(
  $$
    select user_id
    from public.lookup_university_staff_candidate(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'directory-staff@example.test'
    )
  $$,
  'unrelated user cannot look up a staff candidate'
);

select is_empty(
  $$
    select assignment_id
    from public.list_university_staff(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
    )
  $$,
  'unrelated user cannot list university staff'
);

set local request.jwt.claim.sub = '62222222-2222-2222-2222-222222222222';

select is_empty(
  $$
    select user_id
    from public.lookup_university_staff_candidate(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'directory-outsider@example.test'
    )
  $$,
  'an organizational staff assignment does not grant directory lookup permission'
);

set local request.jwt.claim.sub = '64444444-4444-4444-4444-444444444444';

select results_eq(
  $$
    select email
    from public.lookup_university_staff_candidate(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'directory-outsider@example.test'
    )
  $$,
  array['directory-outsider@example.test']::text[],
  'platform owner can use the university-scoped exact lookup'
);

set local role anon;

select throws_ok(
  $$
    select *
    from public.lookup_university_staff_candidate(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'directory-staff@example.test'
    )
  $$,
  '42501',
  null,
  'anonymous callers cannot execute candidate lookup'
);

select throws_ok(
  $$
    select *
    from public.list_university_staff(
      '6aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
    )
  $$,
  '42501',
  null,
  'anonymous callers cannot execute staff listing'
);

select * from finish();

rollback;
