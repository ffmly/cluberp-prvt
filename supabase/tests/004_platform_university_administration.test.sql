begin;

select plan(12);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '51111111-1111-1111-1111-111111111111',
    'platform-manager@example.test',
    '{"display_name":"Platform Manager"}'::jsonb
  ),
  (
    '52222222-2222-2222-2222-222222222222',
    'regular-member@example.test',
    '{"display_name":"Regular Member"}'::jsonb
  );

insert into public.universities (id, name, slug, status, created_by)
values
  (
    '5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Visible University',
    'admin-visible-university',
    'active',
    '51111111-1111-1111-1111-111111111111'
  ),
  (
    '5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Draft University',
    'admin-draft-university',
    'draft',
    '51111111-1111-1111-1111-111111111111'
  );

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select
  '51111111-1111-1111-1111-111111111111',
  id,
  '51111111-1111-1111-1111-111111111111'
from public.roles
where key = 'platform_owner'
  and scope_type = 'platform'
  and is_system;

set local role authenticated;
set local request.jwt.claim.sub = '51111111-1111-1111-1111-111111111111';

select ok(
  public.current_user_has_permission(
    'platform.universities_manage',
    'platform'
  ),
  'platform manager can query their platform permission through the public helper'
);

select ok(
  not public.current_user_has_permission(
    'platform.universities_manage',
    'platform',
    '5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
  ),
  'platform permission rejects an unexpected scope identifier'
);

select is(
  (select count(*) from public.universities),
  2::bigint,
  'platform manager can read active and non-active universities'
);

select lives_ok(
  $$
    insert into public.universities (
      name,
      slug,
      status,
      default_locale,
      default_time_zone,
      default_currency,
      created_by
    ) values (
      'Created University',
      'admin-created-university',
      'draft',
      'ar',
      'Africa/Algiers',
      'DZD',
      '51111111-1111-1111-1111-111111111111'
    )
  $$,
  'platform manager can create a university'
);

select lives_ok(
  $$
    update public.universities
    set status = 'archived', archived_at = statement_timestamp()
    where slug = 'admin-created-university'
  $$,
  'platform manager can archive a university without deleting it'
);

select is(
  (
    select status
    from public.universities
    where slug = 'admin-created-university'
  ),
  'archived',
  'archived university remains available for audit and recovery'
);

select throws_ok(
  $$
    update public.universities
    set status = 'active'
    where slug = 'admin-created-university'
  $$,
  '23514',
  null,
  'database rejects a non-archived status while archived_at is set'
);

set local request.jwt.claim.sub = '52222222-2222-2222-2222-222222222222';

select ok(
  not public.current_user_has_permission(
    'platform.universities_manage',
    'platform'
  ),
  'regular member does not receive platform management permission'
);

select results_eq(
  $$select slug from public.universities order by slug$$,
  array['admin-visible-university']::text[],
  'regular member sees only active universities'
);

select throws_ok(
  $$
    insert into public.universities (name, slug, created_by)
    values (
      'Unauthorized University',
      'admin-unauthorized-university',
      '52222222-2222-2222-2222-222222222222'
    )
  $$,
  '42501',
  null,
  'RLS rejects university creation by a regular member'
);

select results_eq(
  $$
    with changed as (
      update public.universities
      set name = 'Unauthorized Rename'
      where slug = 'admin-visible-university'
      returning id
    )
    select count(*) from changed
  $$,
  array[0::bigint],
  'RLS prevents university updates by a regular member'
);

set local role anon;

select throws_ok(
  $$
    select public.current_user_has_permission(
      'platform.universities_manage',
      'platform'
    )
  $$,
  '42501',
  null,
  'anonymous callers cannot execute the public authorization helper'
);

select * from finish();

rollback;
