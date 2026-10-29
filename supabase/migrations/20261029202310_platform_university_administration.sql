create function public.current_user_has_permission(
  permission_key text,
  scope_type text,
  scope_id uuid default null
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case scope_type
    when 'platform' then
      scope_id is null
      and (select private.has_platform_permission(permission_key))
    when 'university' then
      scope_id is not null
      and (select private.has_university_permission(scope_id, permission_key))
    when 'club' then
      scope_id is not null
      and (select private.has_club_permission(scope_id, permission_key))
    when 'team' then
      scope_id is not null
      and (select private.has_team_permission(scope_id, permission_key))
    else false
  end;
$$;

revoke execute on function public.current_user_has_permission(text, text, uuid)
  from public, anon;
grant execute on function public.current_user_has_permission(text, text, uuid)
  to authenticated;

grant insert (
  name,
  slug,
  status,
  default_locale,
  default_time_zone,
  default_currency,
  settings,
  created_by,
  archived_at
) on table public.universities to authenticated;

grant update (
  name,
  slug,
  status,
  default_locale,
  default_time_zone,
  default_currency,
  settings,
  archived_at
) on table public.universities to authenticated;

create policy universities_select_platform_managers
on public.universities
for select
to authenticated
using (
  (select private.has_platform_permission('platform.universities_manage'))
);

create policy universities_insert_platform_managers
on public.universities
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_platform_permission('platform.universities_manage'))
);

create policy universities_update_platform_managers
on public.universities
for update
to authenticated
using (
  (select private.has_platform_permission('platform.universities_manage'))
)
with check (
  (select private.has_platform_permission('platform.universities_manage'))
);
