alter table public.profiles
  add column account_status text not null default 'active'
    check (account_status in ('active', 'suspended')),
  add column suspended_at timestamptz,
  add column suspended_by uuid references public.profiles (id) on delete restrict,
  add column suspension_reason text
    check (suspension_reason is null or char_length(suspension_reason) between 5 and 500),
  add constraint profiles_suspension_state_check check (
    (account_status = 'active'
      and suspended_at is null
      and suspended_by is null
      and suspension_reason is null)
    or
    (account_status = 'suspended'
      and suspended_at is not null
      and suspended_by is not null
      and suspension_reason is not null)
  );

create index profiles_account_status_idx on public.profiles (account_status);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null check (action ~ '^[a-z]+(?:\.[a-z_]+)+$'),
  resource_type text not null check (resource_type ~ '^[a-z][a-z_]{1,63}$'),
  resource_id uuid,
  university_id uuid references public.universities (id) on delete restrict,
  club_id uuid references public.clubs (id) on delete restrict,
  before_state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(before_state) = 'object'),
  after_state jsonb not null default '{}'::jsonb
    check (jsonb_typeof(after_state) = 'object'),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default statement_timestamp()
);

comment on table public.audit_events is
  'Append-only security and business audit history. Application roles cannot insert, update, or delete rows directly.';

create index audit_events_created_at_idx
  on public.audit_events (created_at desc, id desc);
create index audit_events_actor_id_idx
  on public.audit_events (actor_id, created_at desc);
create index audit_events_resource_idx
  on public.audit_events (resource_type, resource_id, created_at desc);
create index audit_events_university_id_idx
  on public.audit_events (university_id, created_at desc)
  where university_id is not null;
create index audit_events_club_id_idx
  on public.audit_events (club_id, created_at desc)
  where club_id is not null;

alter table public.audit_events enable row level security;
revoke all on table public.audit_events from public, anon, authenticated;
grant select on table public.audit_events to authenticated;

insert into public.permissions (key, name, description, scope_type)
values
  ('platform.users_manage', 'Manage platform users', 'View users and manage application account status.', 'platform')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
join public.permissions as permission
  on permission.key = 'platform.users_manage'
where role.key = 'platform_owner'
  and role.scope_type = 'platform'
  and role.is_system
on conflict do nothing;

create function private.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.account_status = 'active'
  );
$$;

revoke execute on function private.current_user_is_active()
  from public, anon;
grant execute on function private.current_user_is_active()
  to authenticated;

create or replace function private.has_platform_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.current_user_is_active()) and exists (
    select 1
    from public.platform_role_assignments as assignment
    join public.roles as role
      on role.id = assignment.role_id
      and role.scope_type = 'platform'
      and role.archived_at is null
    join public.role_permissions as role_permission
      on role_permission.role_id = role.id
    join public.permissions as permission
      on permission.id = role_permission.permission_id
    where assignment.user_id = (select auth.uid())
      and assignment.revoked_at is null
      and assignment.starts_at <= statement_timestamp()
      and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
      and permission.key = permission_key
  );
$$;

create or replace function private.has_university_permission(
  target_university_id uuid,
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.current_user_is_active()) and (
    (select private.has_platform_permission(permission_key))
    or exists (
      select 1
      from public.university_role_assignments as assignment
      join public.roles as role
        on role.id = assignment.role_id
        and role.scope_type = 'university'
        and role.archived_at is null
        and (role.is_system or role.university_id = assignment.university_id)
      join public.role_permissions as role_permission
        on role_permission.role_id = role.id
      join public.permissions as permission
        on permission.id = role_permission.permission_id
      where assignment.university_id = target_university_id
        and assignment.user_id = (select auth.uid())
        and assignment.revoked_at is null
        and assignment.starts_at <= statement_timestamp()
        and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
        and permission.key = permission_key
    )
  );
$$;

create or replace function private.has_club_permission(
  target_club_id uuid,
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.current_user_is_active()) and (
    (select private.has_platform_permission(permission_key))
    or exists (
      select 1
      from public.clubs as club
      join public.university_role_assignments as assignment
        on assignment.university_id = club.university_id
      join public.roles as role
        on role.id = assignment.role_id
        and role.scope_type = 'university'
        and role.archived_at is null
        and (role.is_system or role.university_id = assignment.university_id)
      join public.role_permissions as role_permission
        on role_permission.role_id = role.id
      join public.permissions as permission
        on permission.id = role_permission.permission_id
      where club.id = target_club_id
        and assignment.user_id = (select auth.uid())
        and assignment.revoked_at is null
        and assignment.starts_at <= statement_timestamp()
        and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
        and permission.key = permission_key
    )
    or exists (
      select 1
      from public.club_role_assignments as assignment
      join public.roles as role
        on role.id = assignment.role_id
        and role.scope_type = 'club'
        and role.archived_at is null
        and (role.is_system or role.club_id = assignment.club_id)
      join public.role_permissions as role_permission
        on role_permission.role_id = role.id
      join public.permissions as permission
        on permission.id = role_permission.permission_id
      where assignment.club_id = target_club_id
        and assignment.user_id = (select auth.uid())
        and assignment.revoked_at is null
        and assignment.starts_at <= statement_timestamp()
        and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
        and permission.key = permission_key
    )
  );
$$;

create or replace function private.has_team_permission(
  target_team_id uuid,
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.current_user_is_active()) and (
    exists (
      select 1
      from public.teams as team
      where team.id = target_team_id
        and (select private.has_club_permission(team.club_id, permission_key))
    )
    or exists (
      select 1
      from public.team_role_assignments as assignment
      join public.roles as role
        on role.id = assignment.role_id
        and role.scope_type = 'team'
        and role.archived_at is null
        and (role.is_system or role.team_id = assignment.team_id)
      join public.role_permissions as role_permission
        on role_permission.role_id = role.id
      join public.permissions as permission
        on permission.id = role_permission.permission_id
      where assignment.team_id = target_team_id
        and assignment.user_id = (select auth.uid())
        and assignment.revoked_at is null
        and assignment.starts_at <= statement_timestamp()
        and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
        and permission.key = permission_key
    )
  );
$$;

create policy audit_events_select_platform_auditors
on public.audit_events
for select
to authenticated
using ((select private.has_platform_permission('platform.audit_view')));

create function private.list_platform_users(
  search_query text default null,
  page_limit integer default 50,
  page_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  account_status text,
  suspension_reason text,
  suspended_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_query text := nullif(trim(search_query), '');
begin
  if not (select private.has_platform_permission('platform.users_manage')) then
    return;
  end if;

  if page_limit < 1 or page_limit > 100 or page_offset < 0 then
    raise exception 'Invalid pagination' using errcode = '22023';
  end if;

  if normalized_query is not null and char_length(normalized_query) < 2 then
    raise exception 'Search query is too short' using errcode = '22023';
  end if;

  return query
  select
    profile.id,
    auth_user.email::text,
    profile.display_name,
    profile.account_status,
    profile.suspension_reason,
    profile.suspended_at,
    profile.created_at,
    auth_user.last_sign_in_at
  from public.profiles as profile
  join auth.users as auth_user on auth_user.id = profile.id
  where not auth_user.is_anonymous
    and (
      normalized_query is null
      or auth_user.email ilike '%' || normalized_query || '%'
      or profile.display_name ilike '%' || normalized_query || '%'
    )
  order by profile.created_at desc, profile.id
  limit page_limit
  offset page_offset;
end;
$$;

create function public.list_platform_users(
  search_query text default null,
  page_limit integer default 50,
  page_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  display_name text,
  account_status text,
  suspension_reason text,
  suspended_at timestamptz,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from private.list_platform_users(search_query, page_limit, page_offset);
$$;

create function private.set_user_account_status(
  target_user_id uuid,
  new_status text,
  reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  current_status text;
  normalized_reason text := coalesce(trim(reason), '');
  audit_event_id uuid;
  target_is_platform_owner boolean;
  other_active_owner_exists boolean;
begin
  if actor_user_id is null
    or not (select private.has_platform_permission('platform.users_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if new_status not in ('active', 'suspended') then
    raise exception 'Invalid account status' using errcode = '22023';
  end if;

  if char_length(normalized_reason) < 5 or char_length(normalized_reason) > 500 then
    raise exception 'Reason must contain between 5 and 500 characters'
      using errcode = '22023';
  end if;

  select profile.account_status into current_status
  from public.profiles as profile
  where profile.id = target_user_id
  for update;

  if current_status is null then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  if current_status = new_status then
    raise exception 'Account already has this status' using errcode = '22023';
  end if;

  if target_user_id = actor_user_id and new_status = 'suspended' then
    raise exception 'Administrators cannot suspend their own account'
      using errcode = '42501';
  end if;

  if new_status = 'suspended' then
    select exists (
      select 1
      from public.platform_role_assignments as assignment
      join public.roles as role on role.id = assignment.role_id
      where assignment.user_id = target_user_id
        and role.key = 'platform_owner'
        and role.scope_type = 'platform'
        and role.is_system
        and assignment.revoked_at is null
        and assignment.starts_at <= statement_timestamp()
        and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
    ) into target_is_platform_owner;

    if target_is_platform_owner then
      select exists (
        select 1
        from public.platform_role_assignments as assignment
        join public.roles as role on role.id = assignment.role_id
        join public.profiles as profile on profile.id = assignment.user_id
        where assignment.user_id <> target_user_id
          and profile.account_status = 'active'
          and role.key = 'platform_owner'
          and role.scope_type = 'platform'
          and role.is_system
          and assignment.revoked_at is null
          and assignment.starts_at <= statement_timestamp()
          and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
      ) into other_active_owner_exists;

      if not other_active_owner_exists then
        raise exception 'The last active platform owner cannot be suspended'
          using errcode = '42501';
      end if;
    end if;
  end if;

  update public.profiles
  set
    account_status = new_status,
    suspended_at = case when new_status = 'suspended' then statement_timestamp() else null end,
    suspended_by = case when new_status = 'suspended' then actor_user_id else null end,
    suspension_reason = case when new_status = 'suspended' then normalized_reason else null end
  where id = target_user_id;

  insert into public.audit_events (
    actor_id,
    action,
    resource_type,
    resource_id,
    before_state,
    after_state,
    metadata
  )
  values (
    actor_user_id,
    case when new_status = 'suspended' then 'user.suspended' else 'user.reactivated' end,
    'user_account',
    target_user_id,
    jsonb_build_object('account_status', current_status),
    jsonb_build_object('account_status', new_status),
    jsonb_build_object('reason', normalized_reason)
  )
  returning id into audit_event_id;

  return audit_event_id;
end;
$$;

create function public.set_user_account_status(
  target_user_id uuid,
  new_status text,
  reason text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.set_user_account_status(target_user_id, new_status, reason);
$$;

create function private.list_platform_audit_events(page_limit integer default 50)
returns table (
  event_id uuid,
  action text,
  actor_id uuid,
  actor_email text,
  actor_name text,
  resource_type text,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.has_platform_permission('platform.audit_view')) then
    return;
  end if;

  if page_limit < 1 or page_limit > 100 then
    raise exception 'Invalid page limit' using errcode = '22023';
  end if;

  return query
  select
    event.id,
    event.action,
    event.actor_id,
    auth_user.email::text,
    profile.display_name,
    event.resource_type,
    event.resource_id,
    event.before_state,
    event.after_state,
    event.metadata,
    event.created_at
  from public.audit_events as event
  join public.profiles as profile on profile.id = event.actor_id
  join auth.users as auth_user on auth_user.id = event.actor_id
  order by event.created_at desc, event.id desc
  limit page_limit;
end;
$$;

create function public.list_platform_audit_events(page_limit integer default 50)
returns table (
  event_id uuid,
  action text,
  actor_id uuid,
  actor_email text,
  actor_name text,
  resource_type text,
  resource_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_platform_audit_events(page_limit);
$$;

revoke execute on function private.list_platform_users(text, integer, integer)
  from public, anon;
revoke execute on function private.set_user_account_status(uuid, text, text)
  from public, anon;
revoke execute on function private.list_platform_audit_events(integer)
  from public, anon;
revoke execute on function public.list_platform_users(text, integer, integer)
  from public, anon;
revoke execute on function public.set_user_account_status(uuid, text, text)
  from public, anon;
revoke execute on function public.list_platform_audit_events(integer)
  from public, anon;

grant execute on function private.list_platform_users(text, integer, integer)
  to authenticated;
grant execute on function private.set_user_account_status(uuid, text, text)
  to authenticated;
grant execute on function private.list_platform_audit_events(integer)
  to authenticated;
grant execute on function public.list_platform_users(text, integer, integer)
  to authenticated;
grant execute on function public.set_user_account_status(uuid, text, text)
  to authenticated;
grant execute on function public.list_platform_audit_events(integer)
  to authenticated;
