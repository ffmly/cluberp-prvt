create function private.list_manageable_clubs()
returns table (
  club_id uuid,
  university_id uuid,
  club_name text,
  club_slug text,
  club_description text,
  club_status text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.current_user_is_active()) then
    return;
  end if;

  return query
  select
    club.id,
    club.university_id,
    club.name,
    club.slug,
    club.description,
    club.status
  from public.clubs as club
  where club.status in ('active', 'suspended')
    and (select private.has_club_permission(club.id, 'club.settings_manage'))
  order by club.name;
end;
$$;

create function public.list_manageable_clubs()
returns table (
  club_id uuid,
  university_id uuid,
  club_name text,
  club_slug text,
  club_description text,
  club_status text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select * from private.list_manageable_clubs();
$$;

revoke execute on function private.list_manageable_clubs() from public, anon;
revoke execute on function public.list_manageable_clubs() from public, anon;

grant execute on function private.list_manageable_clubs() to authenticated;
grant execute on function public.list_manageable_clubs() to authenticated;
