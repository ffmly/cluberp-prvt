insert into public.permissions (key, name, description, scope_type)
values
  (
    'club.teams_manage',
    'Manage club teams',
    'Create, update, and archive club teams and committees.',
    'club'
  )
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
join public.permissions as permission
  on permission.key = 'club.teams_manage'
where role.is_system
  and role.key in ('platform_owner', 'university_admin', 'club_president')
on conflict (role_id, permission_id) do nothing;

create function private.current_user_has_club_access(target_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.current_user_is_active()) and exists (
    select 1
    from public.clubs as club
    where club.id = target_club_id
      and club.status in ('active', 'suspended')
      and (
        exists (
          select 1
          from public.platform_role_assignments as assignment
          join public.roles as role on role.id = assignment.role_id
          where assignment.user_id = (select auth.uid())
            and assignment.revoked_at is null
            and assignment.starts_at <= statement_timestamp()
            and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
            and role.scope_type = 'platform'
            and role.archived_at is null
        )
        or exists (
          select 1
          from public.university_role_assignments as assignment
          join public.roles as role on role.id = assignment.role_id
          where assignment.university_id = club.university_id
            and assignment.user_id = (select auth.uid())
            and assignment.revoked_at is null
            and assignment.starts_at <= statement_timestamp()
            and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
            and role.scope_type = 'university'
            and role.archived_at is null
        )
        or exists (
          select 1
          from public.club_role_assignments as assignment
          join public.roles as role on role.id = assignment.role_id
          where assignment.club_id = club.id
            and assignment.user_id = (select auth.uid())
            and assignment.revoked_at is null
            and assignment.starts_at <= statement_timestamp()
            and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
            and role.scope_type = 'club'
            and role.archived_at is null
        )
      )
  );
$$;

revoke execute on function private.current_user_has_club_access(uuid)
  from public, anon;
grant execute on function private.current_user_has_club_access(uuid)
  to authenticated;

grant select on table public.teams to authenticated;

create policy teams_select_club_access
on public.teams
for select
to authenticated
using ((select private.current_user_has_club_access(club_id)));

create function private.list_my_club_workspaces()
returns table (
  club_id uuid,
  university_id uuid,
  university_name text,
  club_name text,
  club_slug text,
  club_description text,
  club_visibility text,
  club_status text,
  role_names text,
  can_manage boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    club.id,
    club.university_id,
    university.name,
    club.name,
    club.slug,
    club.description,
    club.visibility,
    club.status,
    coalesce((
      select string_agg(role.name, ', ' order by role.name)
      from public.club_role_assignments as assignment
      join public.roles as role on role.id = assignment.role_id
      where assignment.club_id = club.id
        and assignment.user_id = (select auth.uid())
        and assignment.revoked_at is null
        and assignment.starts_at <= statement_timestamp()
        and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
        and role.archived_at is null
    ), ''),
    (select private.has_club_permission(club.id, 'club.settings_manage'))
  from public.clubs as club
  join public.universities as university on university.id = club.university_id
  where (select private.current_user_has_club_access(club.id))
  order by university.name, club.name;
$$;

create function private.get_club_workspace(target_club_id uuid)
returns table (
  club_id uuid,
  university_id uuid,
  university_name text,
  club_name text,
  club_slug text,
  club_description text,
  club_visibility text,
  club_status text,
  can_manage_settings boolean,
  can_manage_teams boolean,
  can_manage_roles boolean,
  can_view_members boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    club.id,
    club.university_id,
    university.name,
    club.name,
    club.slug,
    club.description,
    club.visibility,
    club.status,
    (select private.has_club_permission(club.id, 'club.settings_manage')),
    (select private.has_club_permission(club.id, 'club.teams_manage')),
    (select private.has_club_permission(club.id, 'club.roles_manage')),
    (select private.has_club_permission(club.id, 'club.members_view'))
  from public.clubs as club
  join public.universities as university on university.id = club.university_id
  where club.id = target_club_id
    and (select private.current_user_has_club_access(club.id));
$$;

create function private.list_club_teams(target_club_id uuid)
returns table (
  team_id uuid,
  team_name text,
  team_description text,
  team_status text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select team.id, team.name, team.description, team.status, team.updated_at
  from public.teams as team
  where team.club_id = target_club_id
    and (select private.current_user_has_club_access(target_club_id))
  order by
    case team.status when 'active' then 1 when 'inactive' then 2 else 3 end,
    team.name;
$$;

create function private.save_club_team(
  target_club_id uuid,
  target_team_id uuid,
  team_name text,
  team_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_name text := trim(team_name);
  normalized_description text := nullif(trim(team_description), '');
  saved_team_id uuid;
  previous_state jsonb := '{}'::jsonb;
begin
  if actor_user_id is null
    or not (select private.has_club_permission(target_club_id, 'club.teams_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if char_length(normalized_name) < 2
    or char_length(normalized_name) > 120
    or (normalized_description is not null and char_length(normalized_description) > 2000) then
    raise exception 'Invalid team details' using errcode = '22023';
  end if;

  if target_team_id is null then
    insert into public.teams (club_id, name, description, created_by)
    values (target_club_id, normalized_name, normalized_description, actor_user_id)
    returning id into saved_team_id;
  else
    select jsonb_build_object(
      'name', team.name,
      'description', team.description,
      'status', team.status
    ) into previous_state
    from public.teams as team
    where team.id = target_team_id and team.club_id = target_club_id
    for update;

    if previous_state is null then
      raise exception 'Team not found' using errcode = 'P0002';
    end if;

    update public.teams
    set name = normalized_name,
        description = normalized_description
    where id = target_team_id
    returning id into saved_team_id;
  end if;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id,
    before_state, after_state
  ) values (
    actor_user_id,
    case when target_team_id is null then 'team.created' else 'team.updated' end,
    'team',
    saved_team_id,
    target_club_id,
    coalesce(previous_state, '{}'::jsonb),
    jsonb_build_object(
      'name', normalized_name,
      'description', normalized_description,
      'status', 'active'
    )
  );

  return saved_team_id;
exception
  when unique_violation then
    raise exception 'A team with this name already exists' using errcode = '23505';
end;
$$;

create function private.archive_club_team(
  target_club_id uuid,
  target_team_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  previous_name text;
begin
  if actor_user_id is null
    or not (select private.has_club_permission(target_club_id, 'club.teams_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.teams
  set status = 'archived', archived_at = statement_timestamp()
  where id = target_team_id
    and club_id = target_club_id
    and status <> 'archived'
  returning name into previous_name;

  if previous_name is null then
    raise exception 'Team not found' using errcode = 'P0002';
  end if;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id,
    before_state, after_state
  ) values (
    actor_user_id,
    'team.archived',
    'team',
    target_team_id,
    target_club_id,
    jsonb_build_object('name', previous_name, 'status', 'active'),
    jsonb_build_object('name', previous_name, 'status', 'archived')
  );

  return target_team_id;
end;
$$;

create function private.list_club_leadership(target_club_id uuid)
returns table (
  assignment_id uuid,
  user_id uuid,
  display_name text,
  email text,
  role_id uuid,
  role_name text,
  role_key text,
  starts_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    assignment.id,
    assignment.user_id,
    profile.display_name,
    lower(auth_user.email)::text,
    role.id,
    role.name,
    role.key,
    assignment.starts_at
  from public.club_role_assignments as assignment
  join public.roles as role on role.id = assignment.role_id
  join public.profiles as profile on profile.id = assignment.user_id
  join auth.users as auth_user on auth_user.id = assignment.user_id
  where assignment.club_id = target_club_id
    and assignment.revoked_at is null
    and assignment.starts_at <= statement_timestamp()
    and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
    and role.archived_at is null
    and (select private.current_user_has_club_access(target_club_id))
  order by role.name, profile.display_name;
$$;

create function private.list_assignable_club_roles(target_club_id uuid)
returns table (role_id uuid, role_key text, role_name text, role_description text)
language sql
stable
security definer
set search_path = ''
as $$
  select role.id, role.key, role.name, role.description
  from public.roles as role
  where (select private.has_club_permission(target_club_id, 'club.roles_manage'))
    and role.scope_type = 'club'
    and role.archived_at is null
    and (role.is_system or role.club_id = target_club_id)
    and role.key <> 'club_member'
    and not exists (
      select 1
      from public.role_permissions as role_permission
      join public.permissions as permission on permission.id = role_permission.permission_id
      where role_permission.role_id = role.id
        and not (select private.has_club_permission(target_club_id, permission.key))
    )
  order by role.is_system desc, role.name;
$$;

create function private.lookup_club_role_candidate(
  target_club_id uuid,
  email_query text
)
returns table (user_id uuid, email text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select auth_user.id, lower(auth_user.email)::text, profile.display_name
  from auth.users as auth_user
  join public.profiles as profile on profile.id = auth_user.id
  where (select private.has_club_permission(target_club_id, 'club.roles_manage'))
    and char_length(trim(email_query)) between 3 and 320
    and lower(auth_user.email) = lower(trim(email_query))
    and auth_user.deleted_at is null
    and not auth_user.is_anonymous
    and profile.account_status = 'active'
  limit 1;
$$;

create function private.assign_club_role(
  target_club_id uuid,
  target_user_id uuid,
  target_role_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  created_assignment_id uuid;
  selected_role public.roles%rowtype;
begin
  if actor_user_id is null
    or not (select private.has_club_permission(target_club_id, 'club.roles_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into selected_role
  from public.roles as role
  where role.id = target_role_id
    and role.scope_type = 'club'
    and role.archived_at is null
    and (role.is_system or role.club_id = target_club_id)
    and role.key <> 'club_member';

  if selected_role.id is null
    or not exists (
      select 1 from public.profiles as profile
      where profile.id = target_user_id and profile.account_status = 'active'
    )
    or exists (
      select 1
      from public.role_permissions as role_permission
      join public.permissions as permission on permission.id = role_permission.permission_id
      where role_permission.role_id = target_role_id
        and not (select private.has_club_permission(target_club_id, permission.key))
    ) then
    raise exception 'Role assignment is not allowed' using errcode = '42501';
  end if;

  insert into public.club_role_assignments (
    club_id, user_id, role_id, assigned_by
  ) values (
    target_club_id, target_user_id, target_role_id, actor_user_id
  ) returning id into created_assignment_id;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id, after_state
  ) values (
    actor_user_id,
    'club_role.assigned',
    'club_role_assignment',
    created_assignment_id,
    target_club_id,
    jsonb_build_object(
      'user_id', target_user_id,
      'role_id', target_role_id,
      'role_key', selected_role.key
    )
  );

  return created_assignment_id;
exception
  when unique_violation then
    raise exception 'This role is already assigned' using errcode = '23505';
end;
$$;

create function private.revoke_club_role(
  target_club_id uuid,
  target_assignment_id uuid,
  reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_reason text := nullif(trim(reason), '');
  assignment_record record;
begin
  if actor_user_id is null
    or not (select private.has_club_permission(target_club_id, 'club.roles_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if normalized_reason is null or char_length(normalized_reason) not between 5 and 500 then
    raise exception 'A revocation reason is required' using errcode = '22023';
  end if;

  select assignment.id, assignment.user_id, assignment.role_id, role.key
  into assignment_record
  from public.club_role_assignments as assignment
  join public.roles as role on role.id = assignment.role_id
  where assignment.id = target_assignment_id
    and assignment.club_id = target_club_id
    and assignment.revoked_at is null
  for update of assignment;

  if assignment_record.id is null then
    raise exception 'Assignment not found' using errcode = 'P0002';
  end if;
  if assignment_record.key = 'club_president' and (
    select count(*)
    from public.club_role_assignments as assignment
    join public.roles as role on role.id = assignment.role_id
    where assignment.club_id = target_club_id
      and assignment.revoked_at is null
      and role.key = 'club_president'
      and role.scope_type = 'club'
  ) <= 1 then
    raise exception 'The last club president cannot be removed' using errcode = '23514';
  end if;

  update public.club_role_assignments
  set revoked_at = statement_timestamp(),
      revoked_by = actor_user_id,
      revocation_reason = normalized_reason
  where id = target_assignment_id;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id,
    before_state, after_state, metadata
  ) values (
    actor_user_id,
    'club_role.revoked',
    'club_role_assignment',
    target_assignment_id,
    target_club_id,
    jsonb_build_object(
      'user_id', assignment_record.user_id,
      'role_id', assignment_record.role_id,
      'status', 'active'
    ),
    jsonb_build_object('status', 'revoked'),
    jsonb_build_object('reason', normalized_reason)
  );

  return target_assignment_id;
end;
$$;

create function public.list_my_club_workspaces()
returns table (
  club_id uuid, university_id uuid, university_name text, club_name text,
  club_slug text, club_description text, club_visibility text,
  club_status text, role_names text, can_manage boolean
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_my_club_workspaces(); $$;

create function public.get_club_workspace(target_club_id uuid)
returns table (
  club_id uuid, university_id uuid, university_name text, club_name text,
  club_slug text, club_description text, club_visibility text,
  club_status text, can_manage_settings boolean, can_manage_teams boolean,
  can_manage_roles boolean, can_view_members boolean
)
language sql stable security invoker set search_path = ''
as $$ select * from private.get_club_workspace(target_club_id); $$;

create function public.list_club_teams(target_club_id uuid)
returns table (
  team_id uuid, team_name text, team_description text,
  team_status text, updated_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_club_teams(target_club_id); $$;

create function public.save_club_team(
  target_club_id uuid, target_team_id uuid,
  team_name text, team_description text
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.save_club_team(target_club_id, target_team_id, team_name, team_description); $$;

create function public.archive_club_team(target_club_id uuid, target_team_id uuid)
returns uuid language sql security invoker set search_path = ''
as $$ select private.archive_club_team(target_club_id, target_team_id); $$;

create function public.list_club_leadership(target_club_id uuid)
returns table (
  assignment_id uuid, user_id uuid, display_name text, email text,
  role_id uuid, role_name text, role_key text, starts_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_club_leadership(target_club_id); $$;

create function public.list_assignable_club_roles(target_club_id uuid)
returns table (role_id uuid, role_key text, role_name text, role_description text)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_assignable_club_roles(target_club_id); $$;

create function public.lookup_club_role_candidate(target_club_id uuid, email_query text)
returns table (user_id uuid, email text, display_name text)
language sql stable security invoker set search_path = ''
as $$ select * from private.lookup_club_role_candidate(target_club_id, email_query); $$;

create function public.assign_club_role(
  target_club_id uuid, target_user_id uuid, target_role_id uuid
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.assign_club_role(target_club_id, target_user_id, target_role_id); $$;

create function public.revoke_club_role(
  target_club_id uuid, target_assignment_id uuid, reason text
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.revoke_club_role(target_club_id, target_assignment_id, reason); $$;

revoke execute on function private.list_my_club_workspaces() from public, anon;
revoke execute on function private.get_club_workspace(uuid) from public, anon;
revoke execute on function private.list_club_teams(uuid) from public, anon;
revoke execute on function private.save_club_team(uuid, uuid, text, text) from public, anon;
revoke execute on function private.archive_club_team(uuid, uuid) from public, anon;
revoke execute on function private.list_club_leadership(uuid) from public, anon;
revoke execute on function private.list_assignable_club_roles(uuid) from public, anon;
revoke execute on function private.lookup_club_role_candidate(uuid, text) from public, anon;
revoke execute on function private.assign_club_role(uuid, uuid, uuid) from public, anon;
revoke execute on function private.revoke_club_role(uuid, uuid, text) from public, anon;
revoke execute on function public.list_my_club_workspaces() from public, anon;
revoke execute on function public.get_club_workspace(uuid) from public, anon;
revoke execute on function public.list_club_teams(uuid) from public, anon;
revoke execute on function public.save_club_team(uuid, uuid, text, text) from public, anon;
revoke execute on function public.archive_club_team(uuid, uuid) from public, anon;
revoke execute on function public.list_club_leadership(uuid) from public, anon;
revoke execute on function public.list_assignable_club_roles(uuid) from public, anon;
revoke execute on function public.lookup_club_role_candidate(uuid, text) from public, anon;
revoke execute on function public.assign_club_role(uuid, uuid, uuid) from public, anon;
revoke execute on function public.revoke_club_role(uuid, uuid, text) from public, anon;

grant execute on function private.list_my_club_workspaces() to authenticated;
grant execute on function private.get_club_workspace(uuid) to authenticated;
grant execute on function private.list_club_teams(uuid) to authenticated;
grant execute on function private.save_club_team(uuid, uuid, text, text) to authenticated;
grant execute on function private.archive_club_team(uuid, uuid) to authenticated;
grant execute on function private.list_club_leadership(uuid) to authenticated;
grant execute on function private.list_assignable_club_roles(uuid) to authenticated;
grant execute on function private.lookup_club_role_candidate(uuid, text) to authenticated;
grant execute on function private.assign_club_role(uuid, uuid, uuid) to authenticated;
grant execute on function private.revoke_club_role(uuid, uuid, text) to authenticated;
grant execute on function public.list_my_club_workspaces() to authenticated;
grant execute on function public.get_club_workspace(uuid) to authenticated;
grant execute on function public.list_club_teams(uuid) to authenticated;
grant execute on function public.save_club_team(uuid, uuid, text, text) to authenticated;
grant execute on function public.archive_club_team(uuid, uuid) to authenticated;
grant execute on function public.list_club_leadership(uuid) to authenticated;
grant execute on function public.list_assignable_club_roles(uuid) to authenticated;
grant execute on function public.lookup_club_role_candidate(uuid, text) to authenticated;
grant execute on function public.assign_club_role(uuid, uuid, uuid) to authenticated;
grant execute on function public.revoke_club_role(uuid, uuid, text) to authenticated;
