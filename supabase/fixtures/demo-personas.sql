\set ON_ERROR_STOP on

-- Local-only exploration accounts for the latest active university, club, and
-- team. Run after the Phase 3 E2E fixture has created its working dataset.
begin;

do $$
begin
  if not exists (select 1 from public.clubs where status = 'active') then
    raise exception 'An active club is required before loading demo personas';
  end if;

  if not exists (
    select 1
    from public.teams as team
    join public.clubs as club on club.id = team.club_id
    where team.status = 'active' and club.status = 'active'
  ) then
    raise exception 'An active team is required before loading demo personas';
  end if;
end;
$$;

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
values
  (
    '00000000-0000-0000-0000-000000000000',
    'de000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'owner@club-erp.test',
    crypt('DemoTest!2026', gen_salt('bf')), statement_timestamp(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Platform Owner"}'::jsonb,
    statement_timestamp(), statement_timestamp(), false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'de000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'university-admin@club-erp.test',
    crypt('DemoTest!2026', gen_salt('bf')), statement_timestamp(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo University Admin"}'::jsonb,
    statement_timestamp(), statement_timestamp(), false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'de000000-0000-4000-8000-000000000003',
    'authenticated', 'authenticated', 'club-president@club-erp.test',
    crypt('DemoTest!2026', gen_salt('bf')), statement_timestamp(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Club President"}'::jsonb,
    statement_timestamp(), statement_timestamp(), false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'de000000-0000-4000-8000-000000000004',
    'authenticated', 'authenticated', 'team-lead@club-erp.test',
    crypt('DemoTest!2026', gen_salt('bf')), statement_timestamp(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Team Lead"}'::jsonb,
    statement_timestamp(), statement_timestamp(), false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'de000000-0000-4000-8000-000000000005',
    'authenticated', 'authenticated', 'club-member@club-erp.test',
    crypt('DemoTest!2026', gen_salt('bf')), statement_timestamp(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Club Member"}'::jsonb,
    statement_timestamp(), statement_timestamp(), false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'de000000-0000-4000-8000-000000000006',
    'authenticated', 'authenticated', 'applicant@club-erp.test',
    crypt('DemoTest!2026', gen_salt('bf')), statement_timestamp(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Applicant"}'::jsonb,
    statement_timestamp(), statement_timestamp(), false, false
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
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
select
  persona.id::text,
  persona.id,
  jsonb_build_object(
    'sub', persona.id::text,
    'email', persona.email,
    'email_verified', true
  ),
  'email',
  statement_timestamp(),
  statement_timestamp(),
  statement_timestamp()
from (
  values
    ('de000000-0000-4000-8000-000000000001'::uuid, 'owner@club-erp.test'),
    ('de000000-0000-4000-8000-000000000002'::uuid, 'university-admin@club-erp.test'),
    ('de000000-0000-4000-8000-000000000003'::uuid, 'club-president@club-erp.test'),
    ('de000000-0000-4000-8000-000000000004'::uuid, 'team-lead@club-erp.test'),
    ('de000000-0000-4000-8000-000000000005'::uuid, 'club-member@club-erp.test'),
    ('de000000-0000-4000-8000-000000000006'::uuid, 'applicant@club-erp.test')
) as persona(id, email)
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = excluded.updated_at;

update public.profiles
set
  display_name = case id
    when 'de000000-0000-4000-8000-000000000001' then 'Demo Platform Owner'
    when 'de000000-0000-4000-8000-000000000002' then 'Demo University Admin'
    when 'de000000-0000-4000-8000-000000000003' then 'Demo Club President'
    when 'de000000-0000-4000-8000-000000000004' then 'Demo Team Lead'
    when 'de000000-0000-4000-8000-000000000005' then 'Demo Club Member'
    when 'de000000-0000-4000-8000-000000000006' then 'Demo Applicant'
  end,
  account_status = 'active',
  suspended_at = null,
  suspended_by = null,
  suspension_reason = null
where id between
  'de000000-0000-4000-8000-000000000001'::uuid and
  'de000000-0000-4000-8000-000000000006'::uuid;

insert into public.platform_role_assignments (user_id, role_id, assigned_by)
select
  'de000000-0000-4000-8000-000000000001',
  role.id,
  'de000000-0000-4000-8000-000000000001'
from public.roles as role
where role.key = 'platform_owner'
  and role.scope_type = 'platform'
  and not exists (
    select 1 from public.platform_role_assignments as assignment
    where assignment.user_id = 'de000000-0000-4000-8000-000000000001'
      and assignment.role_id = role.id
      and assignment.revoked_at is null
  );

with target_university as (
  select club.university_id
  from public.clubs as club
  where club.status = 'active'
  order by club.created_at desc
  limit 1
)
insert into public.university_role_assignments (
  university_id, user_id, role_id, assigned_by
)
select
  target.university_id,
  'de000000-0000-4000-8000-000000000002',
  role.id,
  'de000000-0000-4000-8000-000000000001'
from target_university as target
join public.roles as role
  on role.key = 'university_admin' and role.scope_type = 'university'
where not exists (
  select 1 from public.university_role_assignments as assignment
  where assignment.university_id = target.university_id
    and assignment.user_id = 'de000000-0000-4000-8000-000000000002'
    and assignment.role_id = role.id
    and assignment.revoked_at is null
);

with target_university as (
  select club.university_id
  from public.clubs as club
  where club.status = 'active'
  order by club.created_at desc
  limit 1
)
insert into public.university_staff_assignments (
  university_id,
  user_id,
  scope_type,
  staff_type,
  title,
  assigned_by
)
select
  target.university_id,
  'de000000-0000-4000-8000-000000000002',
  'university',
  'administrator',
  'Demo University Administrator',
  'de000000-0000-4000-8000-000000000001'
from target_university as target
where not exists (
  select 1 from public.university_staff_assignments as assignment
  where assignment.university_id = target.university_id
    and assignment.user_id = 'de000000-0000-4000-8000-000000000002'
    and assignment.scope_type = 'university'
    and assignment.staff_type = 'administrator'
    and assignment.status in ('invited', 'active', 'suspended')
);

with target_club as (
  select club.id
  from public.clubs as club
  where club.status = 'active'
  order by club.created_at desc
  limit 1
), personas(user_id, role_key) as (
  values
    ('de000000-0000-4000-8000-000000000003'::uuid, 'club_president'::text),
    ('de000000-0000-4000-8000-000000000004'::uuid, 'club_member'::text),
    ('de000000-0000-4000-8000-000000000005'::uuid, 'club_member'::text)
)
insert into public.club_role_assignments (
  club_id, user_id, role_id, assigned_by
)
select
  target.id,
  persona.user_id,
  role.id,
  'de000000-0000-4000-8000-000000000001'
from target_club as target
cross join personas as persona
join public.roles as role
  on role.key = persona.role_key and role.scope_type = 'club'
where not exists (
  select 1 from public.club_role_assignments as assignment
  where assignment.club_id = target.id
    and assignment.user_id = persona.user_id
    and assignment.role_id = role.id
    and assignment.revoked_at is null
);

with target_team as (
  select team.id
  from public.teams as team
  join public.clubs as club on club.id = team.club_id
  where team.status = 'active' and club.status = 'active'
  order by team.created_at desc
  limit 1
)
insert into public.team_role_assignments (
  team_id, user_id, role_id, assigned_by
)
select
  target.id,
  'de000000-0000-4000-8000-000000000004',
  role.id,
  'de000000-0000-4000-8000-000000000001'
from target_team as target
join public.roles as role
  on role.key = 'team_lead' and role.scope_type = 'team'
where not exists (
  select 1 from public.team_role_assignments as assignment
  where assignment.team_id = target.id
    and assignment.user_id = 'de000000-0000-4000-8000-000000000004'
    and assignment.role_id = role.id
    and assignment.revoked_at is null
);

with target_club as (
  select club.id
  from public.clubs as club
  where club.status = 'active'
  order by club.created_at desc
  limit 1
), members(user_id) as (
  values
    ('de000000-0000-4000-8000-000000000003'::uuid),
    ('de000000-0000-4000-8000-000000000004'::uuid),
    ('de000000-0000-4000-8000-000000000005'::uuid)
)
insert into public.club_memberships (
  club_id,
  user_id,
  status,
  joined_at,
  valid_until,
  created_by
)
select
  target.id,
  member.user_id,
  'active',
  statement_timestamp(),
  current_date + 365,
  'de000000-0000-4000-8000-000000000003'
from target_club as target
cross join members as member
where not exists (
  select 1 from public.club_memberships as membership
  where membership.club_id = target.id
    and membership.user_id = member.user_id
    and membership.status in ('active', 'suspended')
);

commit;
