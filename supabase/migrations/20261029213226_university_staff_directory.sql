create function private.lookup_university_staff_candidate(
  target_university_id uuid,
  email_query text
)
returns table (
  user_id uuid,
  email text,
  display_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth_user.id,
    lower(auth_user.email)::text,
    profile.display_name
  from auth.users as auth_user
  join public.profiles as profile on profile.id = auth_user.id
  where (select auth.uid()) is not null
    and (select private.has_university_permission(
      target_university_id,
      'university.staff_manage'
    ))
    and char_length(trim(email_query)) between 3 and 320
    and lower(auth_user.email) = lower(trim(email_query))
    and auth_user.deleted_at is null
    and not auth_user.is_anonymous
  limit 1;
$$;

create function private.list_university_staff(
  target_university_id uuid
)
returns table (
  assignment_id uuid,
  user_id uuid,
  email text,
  display_name text,
  scope_type text,
  scope_id uuid,
  staff_type text,
  title text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    assignment.id,
    assignment.user_id,
    lower(auth_user.email)::text,
    profile.display_name,
    assignment.scope_type,
    case assignment.scope_type
      when 'campus' then assignment.campus_id
      when 'faculty' then assignment.faculty_id
      when 'department' then assignment.department_id
      else null
    end,
    assignment.staff_type,
    assignment.title,
    assignment.status,
    assignment.starts_at,
    assignment.ends_at,
    assignment.updated_at
  from public.university_staff_assignments as assignment
  join public.profiles as profile on profile.id = assignment.user_id
  join auth.users as auth_user on auth_user.id = assignment.user_id
  where assignment.university_id = target_university_id
    and (select auth.uid()) is not null
    and (select private.has_university_permission(
      target_university_id,
      'university.staff_manage'
    ))
    and auth_user.deleted_at is null
  order by profile.display_name, assignment.created_at;
$$;

revoke execute on function private.lookup_university_staff_candidate(uuid, text)
  from public, anon;
revoke execute on function private.list_university_staff(uuid)
  from public, anon;
grant execute on function private.lookup_university_staff_candidate(uuid, text)
  to authenticated;
grant execute on function private.list_university_staff(uuid)
  to authenticated;

create function public.lookup_university_staff_candidate(
  target_university_id uuid,
  email_query text
)
returns table (
  user_id uuid,
  email text,
  display_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select candidate.user_id, candidate.email, candidate.display_name
  from private.lookup_university_staff_candidate(
    target_university_id,
    email_query
  ) as candidate;
$$;

create function public.list_university_staff(
  target_university_id uuid
)
returns table (
  assignment_id uuid,
  user_id uuid,
  email text,
  display_name text,
  scope_type text,
  scope_id uuid,
  staff_type text,
  title text,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    staff.assignment_id,
    staff.user_id,
    staff.email,
    staff.display_name,
    staff.scope_type,
    staff.scope_id,
    staff.staff_type,
    staff.title,
    staff.status,
    staff.starts_at,
    staff.ends_at,
    staff.updated_at
  from private.list_university_staff(target_university_id) as staff;
$$;

revoke execute on function public.lookup_university_staff_candidate(uuid, text)
  from public, anon;
revoke execute on function public.list_university_staff(uuid)
  from public, anon;
grant execute on function public.lookup_university_staff_candidate(uuid, text)
  to authenticated;
grant execute on function public.list_university_staff(uuid)
  to authenticated;
