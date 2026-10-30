alter table public.audit_events
  drop constraint audit_events_action_check;
alter table public.audit_events
  add constraint audit_events_action_check
  check (action ~ '^[a-z][a-z_]*(?:\.[a-z_]+)+$');

create table public.club_requests (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  club_id uuid references public.clubs (id) on delete restrict,
  request_type text not null check (request_type in ('create', 'renewal')),
  submitter_id uuid not null references public.profiles (id) on delete restrict,
  proposed_name text not null check (char_length(proposed_name) between 2 and 160),
  proposed_slug text not null check (proposed_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  proposed_description text check (
    proposed_description is null or char_length(proposed_description) <= 5000
  ),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  reviewer_id uuid references public.profiles (id) on delete restrict,
  decision_reason text check (
    decision_reason is null or char_length(decision_reason) between 5 and 1000
  ),
  submitted_at timestamptz not null default statement_timestamp(),
  reviewed_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (
    request_type = 'create'
    or (request_type = 'renewal' and club_id is not null)
  ),
  check (
    (status = 'submitted' and reviewer_id is null and reviewed_at is null)
    or (status = 'under_review' and reviewer_id is not null and reviewed_at is null)
    or (status in ('approved', 'rejected') and reviewer_id is not null and reviewed_at is not null)
    or status = 'withdrawn'
  ),
  check (status <> 'rejected' or decision_reason is not null)
);

create trigger club_requests_set_updated_at
before update on public.club_requests
for each row execute function private.set_updated_at();

create unique index club_requests_open_create_slug_unique
  on public.club_requests (university_id, proposed_slug)
  where request_type = 'create' and status in ('submitted', 'under_review');
create unique index club_requests_open_renewal_unique
  on public.club_requests (club_id)
  where request_type = 'renewal' and status in ('submitted', 'under_review');
create index club_requests_submitter_idx
  on public.club_requests (submitter_id, created_at desc);
create index club_requests_review_queue_idx
  on public.club_requests (university_id, status, submitted_at);

alter table public.club_requests enable row level security;
revoke all on table public.club_requests from public, anon, authenticated;
grant select on table public.club_requests to authenticated;

create policy club_requests_select_submitter_or_reviewer
on public.club_requests
for select
to authenticated
using (
  submitter_id = (select auth.uid())
  or (select private.has_university_permission(
    university_id,
    'university.clubs_review'
  ))
);

create policy clubs_select_authorized_governance
on public.clubs
for select
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.clubs_review'
  ))
  or (select private.has_club_permission(id, 'club.settings_manage'))
);

create function private.submit_club_request(
  target_university_id uuid,
  request_type text,
  target_club_id uuid,
  proposed_name text,
  proposed_slug text,
  proposed_description text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_name text := trim(proposed_name);
  normalized_slug text := lower(trim(proposed_slug));
  normalized_description text := nullif(trim(proposed_description), '');
  request_id uuid;
begin
  if actor_user_id is null or not (select private.current_user_is_active()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if request_type not in ('create', 'renewal')
    or char_length(normalized_name) < 2
    or char_length(normalized_name) > 160
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or (normalized_description is not null and char_length(normalized_description) > 5000) then
    raise exception 'Invalid club request' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.universities
    where id = target_university_id and status = 'active'
  ) then
    raise exception 'University is not active' using errcode = '22023';
  end if;

  if request_type = 'create' then
    if target_club_id is not null then
      raise exception 'Create requests cannot target an existing club' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.clubs
      where university_id = target_university_id and slug = normalized_slug
    ) then
      raise exception 'Club slug already exists' using errcode = '23505';
    end if;
  else
    if target_club_id is null
      or not exists (
        select 1 from public.clubs
        where id = target_club_id
          and university_id = target_university_id
          and status in ('active', 'suspended')
      )
      or not (select private.has_club_permission(target_club_id, 'club.settings_manage')) then
      raise exception 'Not authorized to renew this club' using errcode = '42501';
    end if;
  end if;

  insert into public.club_requests (
    university_id, club_id, request_type, submitter_id,
    proposed_name, proposed_slug, proposed_description
  ) values (
    target_university_id, target_club_id, request_type, actor_user_id,
    normalized_name, normalized_slug, normalized_description
  ) returning id into request_id;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, university_id, club_id, after_state
  ) values (
    actor_user_id,
    'club_request.submitted',
    'club_request',
    request_id,
    target_university_id,
    target_club_id,
    jsonb_build_object(
      'request_type', request_type,
      'status', 'submitted',
      'proposed_slug', normalized_slug
    )
  );
  return request_id;
end;
$$;

create function private.list_my_club_requests()
returns table (
  request_id uuid, university_id uuid, university_name text, club_id uuid,
  request_type text, proposed_name text, proposed_slug text,
  proposed_description text, status text, decision_reason text,
  submitted_at timestamptz, reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select request.id, request.university_id, university.name, request.club_id,
    request.request_type, request.proposed_name, request.proposed_slug,
    request.proposed_description, request.status, request.decision_reason,
    request.submitted_at, request.reviewed_at
  from public.club_requests as request
  join public.universities as university on university.id = request.university_id
  where request.submitter_id = (select auth.uid())
    and (select private.current_user_is_active())
  order by request.created_at desc;
$$;

create function private.list_reviewable_club_requests()
returns table (
  request_id uuid, university_id uuid, university_name text, club_id uuid,
  request_type text, submitter_id uuid, submitter_name text, submitter_email text,
  proposed_name text, proposed_slug text, proposed_description text,
  status text, decision_reason text, submitted_at timestamptz, reviewed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.current_user_is_active()) then return; end if;
  return query
  select request.id, request.university_id, university.name, request.club_id,
    request.request_type, request.submitter_id, profile.display_name,
    auth_user.email::text, request.proposed_name, request.proposed_slug,
    request.proposed_description, request.status, request.decision_reason,
    request.submitted_at, request.reviewed_at
  from public.club_requests as request
  join public.universities as university on university.id = request.university_id
  join public.profiles as profile on profile.id = request.submitter_id
  join auth.users as auth_user on auth_user.id = request.submitter_id
  where (select private.has_university_permission(
    request.university_id,
    'university.clubs_review'
  ))
  order by
    case request.status when 'submitted' then 1 when 'under_review' then 2 else 3 end,
    request.submitted_at desc;
end;
$$;

create function private.transition_club_request(
  target_request_id uuid,
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
  normalized_reason text := nullif(trim(reason), '');
  request_record public.club_requests%rowtype;
  created_club_id uuid;
begin
  select * into request_record
  from public.club_requests
  where id = target_request_id
  for update;

  if actor_user_id is null
    or request_record.id is null
    or not (select private.has_university_permission(
      request_record.university_id,
      'university.clubs_review'
    )) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if request_record.submitter_id = actor_user_id then
    raise exception 'Submitters cannot review their own request' using errcode = '42501';
  end if;
  if not (
    (request_record.status = 'submitted' and new_status = 'under_review')
    or (request_record.status = 'under_review' and new_status in ('approved', 'rejected'))
  ) then
    raise exception 'Invalid request transition' using errcode = '22023';
  end if;
  if new_status = 'rejected'
    and (normalized_reason is null or char_length(normalized_reason) < 5) then
    raise exception 'Rejection reason is required' using errcode = '22023';
  end if;
  if normalized_reason is not null and char_length(normalized_reason) > 1000 then
    raise exception 'Decision reason is too long' using errcode = '22023';
  end if;

  if new_status = 'approved' then
    if request_record.request_type = 'create' then
      insert into public.clubs (
        university_id, name, slug, description, visibility, status, created_by
      ) values (
        request_record.university_id,
        request_record.proposed_name,
        request_record.proposed_slug,
        request_record.proposed_description,
        'university',
        'active',
        request_record.submitter_id
      ) returning id into created_club_id;

      insert into public.club_role_assignments (
        club_id, user_id, role_id, assigned_by
      )
      select created_club_id, request_record.submitter_id, role.id, actor_user_id
      from public.roles as role
      where role.key = 'club_president'
        and role.scope_type = 'club'
        and role.is_system;
    else
      update public.clubs
      set name = request_record.proposed_name,
          slug = request_record.proposed_slug,
          description = request_record.proposed_description,
          status = 'active',
          archived_at = null
      where id = request_record.club_id
      returning id into created_club_id;
    end if;
  end if;

  update public.club_requests
  set status = new_status,
      reviewer_id = actor_user_id,
      decision_reason = case when new_status in ('approved', 'rejected') then normalized_reason else null end,
      reviewed_at = case when new_status in ('approved', 'rejected') then statement_timestamp() else null end,
      club_id = coalesce(created_club_id, club_id)
  where id = target_request_id;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, university_id, club_id,
    before_state, after_state, metadata
  ) values (
    actor_user_id,
    'club_request.' || new_status,
    'club_request',
    target_request_id,
    request_record.university_id,
    coalesce(created_club_id, request_record.club_id),
    jsonb_build_object('status', request_record.status),
    jsonb_build_object('status', new_status),
    jsonb_build_object('reason', normalized_reason)
  );
  return target_request_id;
end;
$$;

create function public.submit_club_request(
  target_university_id uuid, request_type text, target_club_id uuid,
  proposed_name text, proposed_slug text, proposed_description text
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.submit_club_request(target_university_id, request_type, target_club_id, proposed_name, proposed_slug, proposed_description); $$;

create function public.list_my_club_requests()
returns table (
  request_id uuid, university_id uuid, university_name text, club_id uuid,
  request_type text, proposed_name text, proposed_slug text,
  proposed_description text, status text, decision_reason text,
  submitted_at timestamptz, reviewed_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_my_club_requests(); $$;

create function public.list_reviewable_club_requests()
returns table (
  request_id uuid, university_id uuid, university_name text, club_id uuid,
  request_type text, submitter_id uuid, submitter_name text, submitter_email text,
  proposed_name text, proposed_slug text, proposed_description text,
  status text, decision_reason text, submitted_at timestamptz, reviewed_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_reviewable_club_requests(); $$;

create function public.transition_club_request(target_request_id uuid, new_status text, reason text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.transition_club_request(target_request_id, new_status, reason); $$;

revoke execute on function private.submit_club_request(uuid, text, uuid, text, text, text) from public, anon;
revoke execute on function private.list_my_club_requests() from public, anon;
revoke execute on function private.list_reviewable_club_requests() from public, anon;
revoke execute on function private.transition_club_request(uuid, text, text) from public, anon;
revoke execute on function public.submit_club_request(uuid, text, uuid, text, text, text) from public, anon;
revoke execute on function public.list_my_club_requests() from public, anon;
revoke execute on function public.list_reviewable_club_requests() from public, anon;
revoke execute on function public.transition_club_request(uuid, text, text) from public, anon;

grant execute on function private.submit_club_request(uuid, text, uuid, text, text, text) to authenticated;
grant execute on function private.list_my_club_requests() to authenticated;
grant execute on function private.list_reviewable_club_requests() to authenticated;
grant execute on function private.transition_club_request(uuid, text, text) to authenticated;
grant execute on function public.submit_club_request(uuid, text, uuid, text, text, text) to authenticated;
grant execute on function public.list_my_club_requests() to authenticated;
grant execute on function public.list_reviewable_club_requests() to authenticated;
grant execute on function public.transition_club_request(uuid, text, text) to authenticated;
