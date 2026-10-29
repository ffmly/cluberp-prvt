begin;

select plan(18);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('81111111-1111-4111-8111-111111111111', 'role-owner@example.test', '{"display_name":"Role Owner"}'),
  ('82222222-2222-4222-8222-222222222222', 'delegated-role-manager@example.test', '{"display_name":"Delegated Role Manager"}'),
  ('83333333-3333-4333-8333-333333333333', 'role-target@example.test', '{"display_name":"Role Target"}'),
  ('84444444-4444-4444-8444-444444444444', 'role-outsider@example.test', '{"display_name":"Role Outsider"}');

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select '81111111-1111-4111-8111-111111111111', id, '81111111-1111-4111-8111-111111111111'
from public.roles
where key = 'platform_owner' and scope_type = 'platform' and is_system;

insert into public.roles (id, key, name, description, scope_type, created_by)
values (
  '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'delegated_role_manager',
  'Delegated Role Manager',
  'Can manage roles but cannot grant permissions it does not hold.',
  'platform',
  '81111111-1111-4111-8111-111111111111'
);

insert into public.role_permissions (role_id, permission_id, granted_by)
select '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', id, '81111111-1111-4111-8111-111111111111'
from public.permissions where key = 'platform.roles_manage';

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
values (
  '82222222-2222-4222-8222-222222222222',
  '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '81111111-1111-4111-8111-111111111111'
);

set local role authenticated;
set local request.jwt.claim.sub = '81111111-1111-4111-8111-111111111111';

select ok(
  public.current_user_has_permission('platform.roles_manage', 'platform'),
  'platform owner can manage roles'
);

select results_eq(
  $$
    select permission_key
    from public.list_grantable_platform_permissions()
    where permission_key in ('platform.roles_manage', 'platform.users_manage')
    order by permission_key
  $$,
  array['platform.roles_manage', 'platform.users_manage']::text[],
  'owner can see permissions they are allowed to grant'
);

select lives_ok(
  $$
    select public.save_platform_role(
      null,
      'user_operator',
      'User Operator',
      'Manages platform user access.',
      array['platform.users_manage']
    )
  $$,
  'owner can create a custom platform role'
);

select results_eq(
  $$
    select permission_keys[1]
    from public.list_platform_roles()
    where role_key = 'user_operator'
  $$,
  array['platform.users_manage']::text[],
  'custom role returns its granted permission set'
);

select is(
  (select count(*) from public.audit_events where action = 'role.created' and after_state ->> 'key' = 'user_operator'),
  1::bigint,
  'role creation is audited'
);

select lives_ok(
  $$
    select public.assign_platform_role(
      (select role_id from public.list_platform_roles() where role_key = 'user_operator'),
      '83333333-3333-4333-8333-333333333333'
    )
  $$,
  'owner can assign a custom role to an active user'
);

select results_eq(
  $$
    select user_email
    from public.list_platform_role_assignments()
    where role_name = 'User Operator'
  $$,
  array['role-target@example.test']::text[],
  'active assignment appears in the authorized directory'
);

set local request.jwt.claim.sub = '83333333-3333-4333-8333-333333333333';

select ok(
  public.current_user_has_permission('platform.users_manage', 'platform'),
  'assigned custom role grants its effective permission'
);

set local request.jwt.claim.sub = '81111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.revoke_platform_role_assignment(
      (select assignment_id from public.list_platform_role_assignments() where user_email = 'role-target@example.test'),
      'Operator access no longer required'
    )
  $$,
  'owner can revoke a custom role assignment with a reason'
);

set local request.jwt.claim.sub = '83333333-3333-4333-8333-333333333333';

select ok(
  not public.current_user_has_permission('platform.users_manage', 'platform'),
  'revocation removes effective permission immediately'
);

set local request.jwt.claim.sub = '81111111-1111-4111-8111-111111111111';

select throws_ok(
  $$
    select public.save_platform_role(
      (select role_id from public.list_platform_roles() where role_key = 'platform_owner'),
      'platform_owner',
      'Changed Owner',
      'Forbidden system role edit.',
      array['platform.roles_manage']
    )
  $$,
  '42501',
  null,
  'system roles cannot be edited'
);

set local request.jwt.claim.sub = '82222222-2222-4222-8222-222222222222';

select throws_ok(
  $$
    select public.save_platform_role(
      null,
      'escalated_manager',
      'Escalated Manager',
      'Attempted privilege escalation.',
      array['platform.users_manage']
    )
  $$,
  '42501',
  null,
  'delegated manager cannot grant a permission they do not possess'
);

select lives_ok(
  $$
    select public.save_platform_role(
      null,
      'role_reviewer',
      'Role Reviewer',
      'Limited to the permission held by the creator.',
      array['platform.roles_manage']
    )
  $$,
  'delegated manager can create a role limited to their own permission'
);

set local request.jwt.claim.sub = '84444444-4444-4444-8444-444444444444';

select is_empty(
  $$ select role_id from public.list_platform_roles() $$,
  'unrelated users cannot enumerate roles'
);

set local request.jwt.claim.sub = '81111111-1111-4111-8111-111111111111';

select lives_ok(
  $$
    select public.archive_platform_role(
      (select role_id from public.list_platform_roles() where role_key = 'user_operator'),
      'Role retired after workflow change'
    )
  $$,
  'owner can archive a custom role'
);

select ok(
  (select archived_at is not null from public.list_platform_roles() where role_key = 'user_operator'),
  'archived role remains visible for history'
);

select is(
  (
    select count(*)
    from public.audit_events
    where action in ('role.created', 'role.assigned', 'role.revoked', 'role.archived')
  ),
  5::bigint,
  'role lifecycle changes append audit events'
);

set local role anon;

select throws_ok(
  $$ select * from public.list_platform_roles() $$,
  '42501',
  null,
  'anonymous callers cannot execute role administration functions'
);

select * from finish();

rollback;
