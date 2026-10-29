\set ON_ERROR_STOP on

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
values (
  '00000000-0000-0000-0000-000000000000',
  'e2e00000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'platform-admin@example.test',
  crypt('PlatformTest!2026', gen_salt('bf')),
  statement_timestamp(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"E2E Platform Admin"}'::jsonb,
  statement_timestamp(),
  statement_timestamp(),
  false,
  false
)
on conflict (id) do update
set
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  updated_at = excluded.updated_at;

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  'e2e00000-0000-4000-8000-000000000001',
  'e2e00000-0000-4000-8000-000000000001',
  '{"sub":"e2e00000-0000-4000-8000-000000000001","email":"platform-admin@example.test","email_verified":true}'::jsonb,
  'email',
  statement_timestamp(),
  statement_timestamp(),
  statement_timestamp()
)
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select
  'e2e00000-0000-4000-8000-000000000001',
  role.id,
  'e2e00000-0000-4000-8000-000000000001'
from public.roles as role
where role.key = 'platform_owner'
  and role.scope_type = 'platform'
  and role.is_system
  and not exists (
    select 1
    from public.platform_role_assignments as assignment
    where assignment.user_id = 'e2e00000-0000-4000-8000-000000000001'
      and assignment.role_id = role.id
      and assignment.revoked_at is null
  );
