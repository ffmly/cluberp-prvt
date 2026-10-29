create function private.actor_can_grant_role(target_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select private.has_platform_permission('platform.roles_manage'))
    and exists (
      select 1
      from public.roles as role
      where role.id = target_role_id
        and role.scope_type = 'platform'
        and not role.is_system
        and role.archived_at is null
    )
    and not exists (
      select 1
      from public.role_permissions as role_permission
      join public.permissions as permission on permission.id = role_permission.permission_id
      where role_permission.role_id = target_role_id
        and not (select private.has_platform_permission(permission.key))
    );
$$;

create function private.list_platform_roles()
returns table (
  role_id uuid,
  role_key text,
  role_name text,
  description text,
  is_system boolean,
  archived_at timestamptz,
  permission_keys text[],
  active_assignment_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.has_platform_permission('platform.roles_manage')) then
    return;
  end if;

  return query
  select
    role.id,
    role.key,
    role.name,
    role.description,
    role.is_system,
    role.archived_at,
    coalesce(array_agg(permission.key order by permission.key)
      filter (where permission.key is not null), '{}'::text[]),
    count(distinct assignment.id) filter (
      where assignment.revoked_at is null
        and assignment.starts_at <= statement_timestamp()
        and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
    )
  from public.roles as role
  left join public.role_permissions as role_permission on role_permission.role_id = role.id
  left join public.permissions as permission on permission.id = role_permission.permission_id
  left join public.platform_role_assignments as assignment on assignment.role_id = role.id
  where role.scope_type = 'platform'
  group by role.id
  order by role.is_system desc, role.name;
end;
$$;

create function private.list_grantable_platform_permissions()
returns table (
  permission_key text,
  permission_name text,
  description text,
  scope_type text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.has_platform_permission('platform.roles_manage')) then
    return;
  end if;

  return query
  select permission.key, permission.name, permission.description, permission.scope_type
  from public.permissions as permission
  where (select private.has_platform_permission(permission.key))
  order by permission.scope_type, permission.key;
end;
$$;

create function private.save_platform_role(
  target_role_id uuid,
  role_key text,
  role_name text,
  role_description text,
  requested_permission_keys text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  saved_role_id uuid;
  normalized_key text := lower(trim(role_key));
  normalized_name text := trim(role_name);
  normalized_description text := nullif(trim(role_description), '');
  normalized_permissions text[];
  existing_role public.roles%rowtype;
  previous_permissions text[];
begin
  if actor_user_id is null
    or not (select private.has_platform_permission('platform.roles_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if normalized_key !~ '^[a-z][a-z0-9_]{1,63}$'
    or char_length(normalized_name) < 2
    or char_length(normalized_name) > 120
    or (normalized_description is not null and char_length(normalized_description) > 500) then
    raise exception 'Invalid role details' using errcode = '22023';
  end if;

  select array_agg(distinct requested.value order by requested.value)
  into normalized_permissions
  from unnest(requested_permission_keys) as requested(value);

  if coalesce(array_length(normalized_permissions, 1), 0) = 0
    or exists (
      select 1
      from unnest(normalized_permissions) as requested_key
      where not exists (
        select 1
        from public.permissions as permission
        where permission.key = requested_key
          and (select private.has_platform_permission(permission.key))
      )
    ) then
    raise exception 'One or more permissions cannot be granted'
      using errcode = '42501';
  end if;

  if target_role_id is null then
    insert into public.roles (
      key,
      name,
      description,
      scope_type,
      is_system,
      created_by
    ) values (
      normalized_key,
      normalized_name,
      normalized_description,
      'platform',
      false,
      actor_user_id
    ) returning id into saved_role_id;
    previous_permissions := '{}'::text[];
  else
    select * into existing_role
    from public.roles as role
    where role.id = target_role_id
    for update;

    if existing_role.id is null
      or existing_role.scope_type <> 'platform'
      or existing_role.is_system
      or existing_role.archived_at is not null then
      raise exception 'Role cannot be edited' using errcode = '42501';
    end if;

    select coalesce(array_agg(permission.key order by permission.key), '{}'::text[])
    into previous_permissions
    from public.role_permissions as role_permission
    join public.permissions as permission on permission.id = role_permission.permission_id
    where role_permission.role_id = target_role_id;

    update public.roles
    set key = normalized_key,
        name = normalized_name,
        description = normalized_description
    where id = target_role_id;
    saved_role_id := target_role_id;
    delete from public.role_permissions where role_id = target_role_id;
  end if;

  insert into public.role_permissions (role_id, permission_id, granted_by)
  select saved_role_id, permission.id, actor_user_id
  from public.permissions as permission
  where permission.key = any(normalized_permissions);

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, before_state, after_state
  ) values (
    actor_user_id,
    case when target_role_id is null then 'role.created' else 'role.updated' end,
    'platform_role',
    saved_role_id,
    jsonb_build_object('permissions', previous_permissions),
    jsonb_build_object(
      'key', normalized_key,
      'name', normalized_name,
      'permissions', normalized_permissions
    )
  );

  return saved_role_id;
end;
$$;

create function private.archive_platform_role(target_role_id uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_reason text := coalesce(trim(reason), '');
begin
  if actor_user_id is null
    or not (select private.actor_can_grant_role(target_role_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if char_length(normalized_reason) < 5 or char_length(normalized_reason) > 500 then
    raise exception 'Invalid reason' using errcode = '22023';
  end if;

  update public.roles set archived_at = statement_timestamp() where id = target_role_id;
  update public.platform_role_assignments
  set revoked_at = statement_timestamp(),
      revoked_by = actor_user_id,
      revocation_reason = normalized_reason
  where role_id = target_role_id and revoked_at is null;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, after_state, metadata
  ) values (
    actor_user_id,
    'role.archived',
    'platform_role',
    target_role_id,
    jsonb_build_object('archived', true),
    jsonb_build_object('reason', normalized_reason)
  );
  return target_role_id;
end;
$$;

create function private.list_platform_role_assignments()
returns table (
  assignment_id uuid,
  role_id uuid,
  role_name text,
  user_id uuid,
  user_email text,
  user_name text,
  starts_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.has_platform_permission('platform.roles_manage')) then return; end if;
  return query
  select assignment.id, role.id, role.name, profile.id, auth_user.email::text,
    profile.display_name, assignment.starts_at
  from public.platform_role_assignments as assignment
  join public.roles as role on role.id = assignment.role_id
  join public.profiles as profile on profile.id = assignment.user_id
  join auth.users as auth_user on auth_user.id = assignment.user_id
  where assignment.revoked_at is null
    and assignment.starts_at <= statement_timestamp()
    and (assignment.ends_at is null or assignment.ends_at > statement_timestamp())
  order by role.name, profile.display_name;
end;
$$;

create function private.assign_platform_role(target_role_id uuid, target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  assignment_id uuid;
begin
  if actor_user_id is null
    or not (select private.actor_can_grant_role(target_role_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = target_user_id and account_status = 'active'
  ) then
    raise exception 'Target user is not active' using errcode = '22023';
  end if;

  insert into public.platform_role_assignments (user_id, role_id, assigned_by)
  values (target_user_id, target_role_id, actor_user_id)
  returning id into assignment_id;

  insert into public.audit_events (actor_id, action, resource_type, resource_id, after_state)
  values (
    actor_user_id,
    'role.assigned',
    'platform_role_assignment',
    assignment_id,
    jsonb_build_object('role_id', target_role_id, 'user_id', target_user_id)
  );
  return assignment_id;
end;
$$;

create function private.revoke_platform_role_assignment(
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
  normalized_reason text := coalesce(trim(reason), '');
  assigned_role_id uuid;
  assigned_user_id uuid;
begin
  select role_id, user_id into assigned_role_id, assigned_user_id
  from public.platform_role_assignments
  where id = target_assignment_id and revoked_at is null
  for update;

  if actor_user_id is null
    or assigned_role_id is null
    or not (select private.actor_can_grant_role(assigned_role_id)) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if char_length(normalized_reason) < 5 or char_length(normalized_reason) > 500 then
    raise exception 'Invalid reason' using errcode = '22023';
  end if;

  update public.platform_role_assignments
  set revoked_at = statement_timestamp(),
      revoked_by = actor_user_id,
      revocation_reason = normalized_reason
  where id = target_assignment_id;

  insert into public.audit_events (actor_id, action, resource_type, resource_id, before_state, metadata)
  values (
    actor_user_id,
    'role.revoked',
    'platform_role_assignment',
    target_assignment_id,
    jsonb_build_object('role_id', assigned_role_id, 'user_id', assigned_user_id),
    jsonb_build_object('reason', normalized_reason)
  );
  return target_assignment_id;
end;
$$;

create function public.list_platform_roles()
returns table (
  role_id uuid, role_key text, role_name text, description text, is_system boolean,
  archived_at timestamptz, permission_keys text[], active_assignment_count bigint
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_platform_roles(); $$;

create function public.list_grantable_platform_permissions()
returns table (permission_key text, permission_name text, description text, scope_type text)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_grantable_platform_permissions(); $$;

create function public.save_platform_role(
  target_role_id uuid, role_key text, role_name text, role_description text,
  requested_permission_keys text[]
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.save_platform_role(target_role_id, role_key, role_name, role_description, requested_permission_keys); $$;

create function public.archive_platform_role(target_role_id uuid, reason text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.archive_platform_role(target_role_id, reason); $$;

create function public.list_platform_role_assignments()
returns table (
  assignment_id uuid, role_id uuid, role_name text, user_id uuid,
  user_email text, user_name text, starts_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_platform_role_assignments(); $$;

create function public.assign_platform_role(target_role_id uuid, target_user_id uuid)
returns uuid language sql security invoker set search_path = ''
as $$ select private.assign_platform_role(target_role_id, target_user_id); $$;

create function public.revoke_platform_role_assignment(target_assignment_id uuid, reason text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.revoke_platform_role_assignment(target_assignment_id, reason); $$;

revoke execute on function private.actor_can_grant_role(uuid) from public, anon;
revoke execute on function private.list_platform_roles() from public, anon;
revoke execute on function private.list_grantable_platform_permissions() from public, anon;
revoke execute on function private.save_platform_role(uuid, text, text, text, text[]) from public, anon;
revoke execute on function private.archive_platform_role(uuid, text) from public, anon;
revoke execute on function private.list_platform_role_assignments() from public, anon;
revoke execute on function private.assign_platform_role(uuid, uuid) from public, anon;
revoke execute on function private.revoke_platform_role_assignment(uuid, text) from public, anon;
revoke execute on function public.list_platform_roles() from public, anon;
revoke execute on function public.list_grantable_platform_permissions() from public, anon;
revoke execute on function public.save_platform_role(uuid, text, text, text, text[]) from public, anon;
revoke execute on function public.archive_platform_role(uuid, text) from public, anon;
revoke execute on function public.list_platform_role_assignments() from public, anon;
revoke execute on function public.assign_platform_role(uuid, uuid) from public, anon;
revoke execute on function public.revoke_platform_role_assignment(uuid, text) from public, anon;

grant execute on function private.actor_can_grant_role(uuid) to authenticated;
grant execute on function private.list_platform_roles() to authenticated;
grant execute on function private.list_grantable_platform_permissions() to authenticated;
grant execute on function private.save_platform_role(uuid, text, text, text, text[]) to authenticated;
grant execute on function private.archive_platform_role(uuid, text) to authenticated;
grant execute on function private.list_platform_role_assignments() to authenticated;
grant execute on function private.assign_platform_role(uuid, uuid) to authenticated;
grant execute on function private.revoke_platform_role_assignment(uuid, text) to authenticated;
grant execute on function public.list_platform_roles() to authenticated;
grant execute on function public.list_grantable_platform_permissions() to authenticated;
grant execute on function public.save_platform_role(uuid, text, text, text, text[]) to authenticated;
grant execute on function public.archive_platform_role(uuid, text) to authenticated;
grant execute on function public.list_platform_role_assignments() to authenticated;
grant execute on function public.assign_platform_role(uuid, uuid) to authenticated;
grant execute on function public.revoke_platform_role_assignment(uuid, text) to authenticated;
