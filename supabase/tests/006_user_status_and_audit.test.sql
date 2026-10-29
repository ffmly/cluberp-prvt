begin;

select plan(17);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '71111111-1111-4111-8111-111111111111',
    'user-admin@example.test',
    '{"display_name":"User Admin"}'::jsonb
  ),
  (
    '72222222-2222-4222-8222-222222222222',
    'managed-user@example.test',
    '{"display_name":"Managed User"}'::jsonb
  ),
  (
    '73333333-3333-4333-8333-333333333333',
    'audit-outsider@example.test',
    '{"display_name":"Audit Outsider"}'::jsonb
  );

insert into public.universities (id, name, slug, status, created_by)
values (
  '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'User Status University',
  'user-status-university',
  'active',
  '71111111-1111-4111-8111-111111111111'
);

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select
  '71111111-1111-4111-8111-111111111111',
  id,
  '71111111-1111-4111-8111-111111111111'
from public.roles
where key = 'platform_owner' and scope_type = 'platform' and is_system;

insert into public.university_role_assignments (
  university_id,
  user_id,
  role_id,
  assigned_by
)
select
  '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '72222222-2222-4222-8222-222222222222',
  id,
  '71111111-1111-4111-8111-111111111111'
from public.roles
where key = 'university_admin' and scope_type = 'university' and is_system;

set local role authenticated;
set local request.jwt.claim.sub = '71111111-1111-4111-8111-111111111111';

select ok(
  public.current_user_has_permission('platform.users_manage', 'platform'),
  'platform owner receives user-management permission'
);

select results_eq(
  $$
    select email
    from public.list_platform_users('managed-user', 20, 0)
  $$,
  array['managed-user@example.test']::text[],
  'authorized user manager can search the user directory'
);

set local request.jwt.claim.sub = '73333333-3333-4333-8333-333333333333';

select is_empty(
  $$ select user_id from public.list_platform_users(null, 20, 0) $$,
  'unrelated users cannot enumerate the platform directory'
);

select is_empty(
  $$ select event_id from public.list_platform_audit_events(20) $$,
  'unrelated users cannot read platform audit events'
);

set local request.jwt.claim.sub = '71111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.set_user_account_status(
      '72222222-2222-4222-8222-222222222222',
      'suspended',
      'Repeated policy violation'
    )
  $$,
  'authorized manager can suspend another account'
);

select is(
  (
    select account_status
    from public.list_platform_users('managed-user@example.test', 20, 0)
  ),
  'suspended',
  'account status is updated atomically'
);

select is(
  (
    select count(*)
    from public.audit_events
    where resource_id = '72222222-2222-4222-8222-222222222222'
      and action = 'user.suspended'
  ),
  1::bigint,
  'suspension appends one audit event'
);

set local request.jwt.claim.sub = '72222222-2222-4222-8222-222222222222';

select ok(
  not public.current_user_has_permission(
    'university.settings_manage',
    'university',
    '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  ),
  'suspension immediately removes effective permissions'
);

select is_empty(
  $$ select user_id from public.list_platform_users(null, 20, 0) $$,
  'suspended users cannot call privileged directory functions'
);

set local request.jwt.claim.sub = '71111111-1111-4111-8111-111111111111';

select throws_ok(
  $$
    select public.set_user_account_status(
      '71111111-1111-4111-8111-111111111111',
      'suspended',
      'Attempted self suspension'
    )
  $$,
  '42501',
  null,
  'a manager cannot suspend their own account'
);

select throws_ok(
  $$
    insert into public.audit_events (
      actor_id,
      action,
      resource_type,
      resource_id
    ) values (
      '71111111-1111-4111-8111-111111111111',
      'user.fabricated',
      'user_account',
      '72222222-2222-4222-8222-222222222222'
    )
  $$,
  '42501',
  null,
  'authenticated callers cannot fabricate audit events'
);

select results_eq(
  $$
    select action
    from public.list_platform_audit_events(20)
    where resource_id = '72222222-2222-4222-8222-222222222222'
  $$,
  array['user.suspended']::text[],
  'authorized auditors can read the suspension event'
);

select lives_ok(
  $$
    select public.set_user_account_status(
      '72222222-2222-4222-8222-222222222222',
      'active',
      'Account reinstatement approved'
    )
  $$,
  'authorized manager can reactivate an account'
);

select is(
  (
    select account_status
    from public.list_platform_users('managed-user@example.test', 20, 0)
  ),
  'active',
  'reactivation clears the suspension state'
);

select is(
  (
    select count(*)
    from public.audit_events
    where resource_id = '72222222-2222-4222-8222-222222222222'
      and action in ('user.suspended', 'user.reactivated')
  ),
  2::bigint,
  'each status transition has an append-only audit event'
);

set local role anon;

select throws_ok(
  $$ select * from public.list_platform_users(null, 20, 0) $$,
  '42501',
  null,
  'anonymous callers cannot execute the user directory'
);

select throws_ok(
  $$
    select public.set_user_account_status(
      '72222222-2222-4222-8222-222222222222',
      'suspended',
      'Anonymous suspension attempt'
    )
  $$,
  '42501',
  null,
  'anonymous callers cannot change account status'
);

select * from finish();

rollback;
