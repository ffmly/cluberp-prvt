create table public.club_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 180),
  description text not null check (char_length(description) between 10 and 8000),
  event_type text not null check (event_type in ('event', 'workshop')),
  location text not null check (char_length(location) between 2 and 300),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  registration_deadline timestamptz not null,
  capacity integer check (capacity is null or capacity between 1 and 100000),
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  eligibility text not null default 'authenticated' check (eligibility in ('authenticated', 'active_members')),
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'published', 'cancelled', 'completed')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  approved_by uuid references public.profiles (id) on delete restrict,
  published_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text check (cancellation_reason is null or char_length(cancellation_reason) between 5 and 1000),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint club_events_time_order check (
    registration_deadline <= starts_at and starts_at < ends_at
  )
);

create table public.event_status_history (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.club_events (id) on delete restrict,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp()
);

create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.club_events (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  status text not null check (status in ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show')),
  registered_at timestamptz not null default statement_timestamp(),
  cancelled_at timestamptz,
  updated_at timestamptz not null default statement_timestamp(),
  unique (event_id, user_id)
);

create table public.attendance_history (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.event_registrations (id) on delete restrict,
  previous_status text not null,
  new_status text not null check (new_status in ('attended', 'no_show')),
  reason text not null check (char_length(reason) between 5 and 500),
  changed_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp()
);

create index club_events_club_schedule_idx on public.club_events (club_id, starts_at desc);
create index club_events_discovery_idx on public.club_events (status, visibility, starts_at);
create index event_registrations_event_queue_idx on public.event_registrations (event_id, status, registered_at, id);
create index event_registrations_user_idx on public.event_registrations (user_id, registered_at desc);
create index event_status_history_event_idx on public.event_status_history (event_id, created_at desc);
create index attendance_history_registration_idx on public.attendance_history (registration_id, created_at desc);

create trigger club_events_set_updated_at before update on public.club_events
for each row execute function private.set_updated_at();
create trigger event_registrations_set_updated_at before update on public.event_registrations
for each row execute function private.set_updated_at();

alter table public.club_events enable row level security;
alter table public.event_status_history enable row level security;
alter table public.event_registrations enable row level security;
alter table public.attendance_history enable row level security;

revoke all on table public.club_events, public.event_status_history,
  public.event_registrations, public.attendance_history from public, anon, authenticated;
grant select on table public.club_events, public.event_status_history,
  public.event_registrations, public.attendance_history to authenticated;

create policy club_events_select_authorized on public.club_events for select to authenticated
using (
  (select private.current_user_has_club_access(club_id))
  or (
    status in ('published', 'completed')
    and (
      visibility = 'public'
      or exists (
        select 1 from public.club_memberships membership
        where membership.club_id = club_events.club_id
          and membership.user_id = (select auth.uid())
          and membership.status = 'active'
      )
    )
  )
);

create policy event_status_history_select_authorized on public.event_status_history for select to authenticated
using (exists (
  select 1 from public.club_events event
  where event.id = event_status_history.event_id
    and (select private.current_user_has_club_access(event.club_id))
));

create policy event_registrations_select_authorized on public.event_registrations for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.club_events event
    where event.id = event_registrations.event_id
      and (select private.has_club_permission(event.club_id, 'club.events_manage'))
  )
);

create policy attendance_history_select_authorized on public.attendance_history for select to authenticated
using (exists (
  select 1 from public.event_registrations registration
  join public.club_events event on event.id = registration.event_id
  where registration.id = attendance_history.registration_id
    and (
      registration.user_id = (select auth.uid())
      or (select private.has_club_permission(event.club_id, 'club.events_manage'))
    )
));

create function private.create_club_event(
  target_club_id uuid, event_title text, event_description text,
  event_type text, event_location text, starts_at timestamptz,
  ends_at timestamptz, registration_deadline timestamptz,
  capacity integer, visibility text, eligibility text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_user_id uuid := (select auth.uid()); new_event_id uuid;
begin
  if actor_user_id is null or not (select private.current_user_is_active())
    or not (select private.has_club_permission(target_club_id, 'club.events_manage')) then
    raise exception 'Event management permission required' using errcode = '42501';
  end if;
  if starts_at <= statement_timestamp() or registration_deadline > starts_at or starts_at >= ends_at then
    raise exception 'Invalid event schedule' using errcode = '22023';
  end if;
  insert into public.club_events (
    club_id, title, description, event_type, location, starts_at, ends_at,
    registration_deadline, capacity, visibility, eligibility, created_by
  ) values (
    target_club_id, trim(event_title), trim(event_description), event_type,
    trim(event_location), starts_at, ends_at, registration_deadline, capacity,
    visibility, eligibility, actor_user_id
  ) returning id into new_event_id;
  insert into public.event_status_history (event_id, from_status, to_status, reason, changed_by)
  values (new_event_id, null, 'draft', 'Event created', actor_user_id);
  insert into public.audit_events (actor_id, action, resource_type, resource_id, club_id, after_state)
  values (actor_user_id, 'event.created', 'club_event', new_event_id, target_club_id,
    jsonb_build_object('status', 'draft', 'title', trim(event_title)));
  return new_event_id;
end; $$;

create function private.update_club_event(
  target_event_id uuid, event_title text, event_description text,
  event_type text, event_location text, starts_at timestamptz,
  ends_at timestamptz, registration_deadline timestamptz,
  capacity integer, visibility text, eligibility text
) returns void language plpgsql security definer set search_path = '' as $$
declare actor_user_id uuid := (select auth.uid()); event_record public.club_events;
begin
  select * into event_record from public.club_events where id = target_event_id for update;
  if event_record.id is null then raise exception 'Event not found' using errcode = 'P0002'; end if;
  if actor_user_id is null or not (select private.current_user_is_active())
    or not (select private.has_club_permission(event_record.club_id, 'club.events_manage')) then
    raise exception 'Event management permission required' using errcode = '42501';
  end if;
  if event_record.status <> 'draft' then raise exception 'Only draft events can be edited' using errcode = '22023'; end if;
  if starts_at <= statement_timestamp() or registration_deadline > starts_at or starts_at >= ends_at then
    raise exception 'Invalid event schedule' using errcode = '22023';
  end if;
  update public.club_events set title = trim(event_title), description = trim(event_description),
    event_type = update_club_event.event_type, location = trim(event_location),
    starts_at = update_club_event.starts_at, ends_at = update_club_event.ends_at,
    registration_deadline = update_club_event.registration_deadline,
    capacity = update_club_event.capacity, visibility = update_club_event.visibility,
    eligibility = update_club_event.eligibility
  where id = target_event_id;
  insert into public.audit_events (actor_id, action, resource_type, resource_id, club_id, after_state)
  values (actor_user_id, 'event.updated', 'club_event', target_event_id, event_record.club_id,
    jsonb_build_object('status', 'draft', 'title', trim(event_title)));
end; $$;

create function private.transition_club_event(target_event_id uuid, new_status text, reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_user_id uuid := (select auth.uid()); event_record public.club_events; normalized_reason text := nullif(trim(reason), '');
begin
  select * into event_record from public.club_events where id = target_event_id for update;
  if event_record.id is null then raise exception 'Event not found' using errcode = 'P0002'; end if;
  if actor_user_id is null or not (select private.current_user_is_active())
    or not (select private.has_club_permission(event_record.club_id, 'club.events_manage')) then
    raise exception 'Event management permission required' using errcode = '42501';
  end if;
  if not (
    (event_record.status = 'draft' and new_status = 'pending_approval')
    or (event_record.status = 'pending_approval' and new_status in ('draft', 'published'))
    or (event_record.status = 'published' and new_status in ('cancelled', 'completed'))
  ) then raise exception 'Invalid event transition' using errcode = '22023'; end if;
  if event_record.status = 'pending_approval' and new_status = 'published' and actor_user_id = event_record.created_by then
    raise exception 'Event creator cannot approve publication' using errcode = '42501';
  end if;
  if new_status in ('draft', 'cancelled') and (normalized_reason is null or char_length(normalized_reason) < 5) then
    raise exception 'A reason is required' using errcode = '22023';
  end if;
  if new_status = 'completed' and event_record.ends_at > statement_timestamp() then
    raise exception 'Event has not ended' using errcode = '22023';
  end if;
  update public.club_events set status = new_status,
    approved_by = case when new_status = 'published' then actor_user_id else approved_by end,
    published_at = case when new_status = 'published' then statement_timestamp() else published_at end,
    cancelled_at = case when new_status = 'cancelled' then statement_timestamp() else cancelled_at end,
    cancellation_reason = case when new_status = 'cancelled' then normalized_reason else cancellation_reason end
  where id = target_event_id;
  insert into public.event_status_history (event_id, from_status, to_status, reason, changed_by)
  values (target_event_id, event_record.status, new_status, normalized_reason, actor_user_id);
  insert into public.audit_events (actor_id, action, resource_type, resource_id, club_id, before_state, after_state, metadata)
  values (actor_user_id, 'event.' || new_status, 'club_event', target_event_id, event_record.club_id,
    jsonb_build_object('status', event_record.status), jsonb_build_object('status', new_status),
    jsonb_build_object('reason', normalized_reason));
end; $$;

create function private.register_for_event(target_event_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare actor_user_id uuid := (select auth.uid()); event_record public.club_events; confirmed_count integer; resulting_status text;
begin
  select * into event_record from public.club_events where id = target_event_id for update;
  if actor_user_id is null or not (select private.current_user_is_active()) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if event_record.id is null or event_record.status <> 'published' then raise exception 'Event is not open' using errcode = '22023'; end if;
  if event_record.registration_deadline < statement_timestamp() or event_record.starts_at <= statement_timestamp() then
    raise exception 'Registration is closed' using errcode = '22023';
  end if;
  if (event_record.visibility = 'members' or event_record.eligibility = 'active_members') and not exists (
    select 1 from public.club_memberships membership where membership.club_id = event_record.club_id
      and membership.user_id = actor_user_id and membership.status = 'active'
  ) then raise exception 'Active membership required' using errcode = '42501'; end if;
  if exists (select 1 from public.event_registrations where event_id = target_event_id and user_id = actor_user_id) then
    raise exception 'Duplicate registration' using errcode = '23505';
  end if;
  select count(*) into confirmed_count from public.event_registrations
  where event_id = target_event_id and status in ('registered', 'attended', 'no_show');
  resulting_status := case when event_record.capacity is not null and confirmed_count >= event_record.capacity then 'waitlisted' else 'registered' end;
  insert into public.event_registrations (event_id, user_id, status) values (target_event_id, actor_user_id, resulting_status);
  return resulting_status;
end; $$;

create function private.cancel_event_registration(target_registration_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare actor_user_id uuid := (select auth.uid()); registration_record public.event_registrations; promoted_id uuid;
begin
  select * into registration_record from public.event_registrations where id = target_registration_id for update;
  if registration_record.id is null then raise exception 'Registration not found' using errcode = 'P0002'; end if;
  perform 1 from public.club_events where id = registration_record.event_id for update;
  if actor_user_id is null or registration_record.user_id <> actor_user_id then raise exception 'Registration owner required' using errcode = '42501'; end if;
  if registration_record.status not in ('registered', 'waitlisted') then raise exception 'Registration cannot be cancelled' using errcode = '22023'; end if;
  update public.event_registrations set status = 'cancelled', cancelled_at = statement_timestamp() where id = target_registration_id;
  if registration_record.status = 'registered' then
    select id into promoted_id from public.event_registrations
    where event_id = registration_record.event_id and status = 'waitlisted'
    order by registered_at, id limit 1 for update skip locked;
    if promoted_id is not null then update public.event_registrations set status = 'registered' where id = promoted_id; end if;
  end if;
  return promoted_id;
end; $$;

create function private.mark_event_attendance(target_registration_id uuid, attendance_status text, reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare actor_user_id uuid := (select auth.uid()); registration_record public.event_registrations; club_identifier uuid;
begin
  if attendance_status not in ('attended', 'no_show') or char_length(trim(reason)) < 5 then
    raise exception 'Invalid attendance update' using errcode = '22023';
  end if;
  select registration.* into registration_record
  from public.event_registrations registration
  where registration.id = target_registration_id for update;
  if registration_record.id is null then raise exception 'Registration not found' using errcode = 'P0002'; end if;
  select club_id into club_identifier from public.club_events where id = registration_record.event_id;
  if actor_user_id is null or not (select private.has_club_permission(club_identifier, 'club.events_manage')) then
    raise exception 'Event management permission required' using errcode = '42501';
  end if;
  if registration_record.status not in ('registered', 'attended', 'no_show') then
    raise exception 'Registration is not attendance eligible' using errcode = '22023';
  end if;
  if registration_record.status = attendance_status then return; end if;
  insert into public.attendance_history (registration_id, previous_status, new_status, reason, changed_by)
  values (target_registration_id, registration_record.status, attendance_status, trim(reason), actor_user_id);
  update public.event_registrations set status = attendance_status where id = target_registration_id;
  insert into public.audit_events (actor_id, action, resource_type, resource_id, club_id, before_state, after_state, metadata)
  values (actor_user_id, 'event.attendance_updated', 'event_registration', target_registration_id, club_identifier,
    jsonb_build_object('status', registration_record.status), jsonb_build_object('status', attendance_status),
    jsonb_build_object('reason', trim(reason)));
end; $$;

create function private.list_club_events(target_club_id uuid)
returns table (event_id uuid, title text, description text, event_type text, location text, starts_at timestamptz,
  ends_at timestamptz, registration_deadline timestamptz, capacity integer, visibility text, eligibility text,
  status text, created_by uuid, creator_name text, approved_by uuid, registered_count bigint, waitlisted_count bigint)
language sql stable security definer set search_path = '' as $$
  select event.id, event.title, event.description, event.event_type, event.location, event.starts_at,
    event.ends_at, event.registration_deadline, event.capacity, event.visibility, event.eligibility,
    event.status, event.created_by, profile.display_name, event.approved_by,
    count(registration.id) filter (where registration.status in ('registered','attended','no_show')),
    count(registration.id) filter (where registration.status = 'waitlisted')
  from public.club_events event join public.profiles profile on profile.id = event.created_by
  left join public.event_registrations registration on registration.event_id = event.id
  where event.club_id = target_club_id and (select private.current_user_has_club_access(target_club_id))
  group by event.id, profile.display_name order by event.starts_at desc;
$$;

create function private.list_discoverable_events()
returns table (event_id uuid, club_id uuid, club_name text, university_name text, title text, description text,
  event_type text, location text, starts_at timestamptz, ends_at timestamptz, registration_deadline timestamptz,
  capacity integer, eligibility text, registration_status text, registered_count bigint, waitlisted_count bigint)
language sql stable security definer set search_path = '' as $$
  select event.id, event.club_id, club.name, university.name, event.title, event.description, event.event_type,
    event.location, event.starts_at, event.ends_at, event.registration_deadline, event.capacity, event.eligibility,
    own_registration.status,
    count(registration.id) filter (where registration.status in ('registered','attended','no_show')),
    count(registration.id) filter (where registration.status = 'waitlisted')
  from public.club_events event join public.clubs club on club.id = event.club_id
  join public.universities university on university.id = club.university_id
  left join public.event_registrations own_registration on own_registration.event_id = event.id and own_registration.user_id = (select auth.uid())
  left join public.event_registrations registration on registration.event_id = event.id
  where (select private.current_user_is_active()) and event.status = 'published'
    and event.starts_at > statement_timestamp()
    and (event.visibility = 'public' or exists (
      select 1 from public.club_memberships membership where membership.club_id = event.club_id
        and membership.user_id = (select auth.uid()) and membership.status = 'active'
    ))
  group by event.id, club.name, university.name, own_registration.status order by event.starts_at;
$$;

create function private.list_event_registrations(target_event_id uuid)
returns table (registration_id uuid, user_id uuid, display_name text, email text, status text, registered_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select registration.id, registration.user_id, profile.display_name, auth_user.email::text,
    registration.status, registration.registered_at
  from public.event_registrations registration
  join public.club_events event on event.id = registration.event_id
  join public.profiles profile on profile.id = registration.user_id
  join auth.users auth_user on auth_user.id = registration.user_id
  where registration.event_id = target_event_id
    and (select private.has_club_permission(event.club_id, 'club.events_manage'))
  order by registration.registered_at, registration.id;
$$;

create function public.create_club_event(target_club_id uuid, event_title text, event_description text,
  event_type text, event_location text, starts_at timestamptz, ends_at timestamptz,
  registration_deadline timestamptz, capacity integer, visibility text, eligibility text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.create_club_event(target_club_id, event_title, event_description, event_type, event_location,
    starts_at, ends_at, registration_deadline, capacity, visibility, eligibility); $$;
create function public.update_club_event(target_event_id uuid, event_title text, event_description text,
  event_type text, event_location text, starts_at timestamptz, ends_at timestamptz,
  registration_deadline timestamptz, capacity integer, visibility text, eligibility text)
returns void language sql security invoker set search_path = '' as $$ select private.update_club_event(target_event_id,
  event_title, event_description, event_type, event_location, starts_at, ends_at, registration_deadline,
  capacity, visibility, eligibility); $$;
create function public.transition_club_event(target_event_id uuid, new_status text, reason text default null)
returns void language sql security invoker set search_path = '' as $$ select private.transition_club_event(target_event_id, new_status, reason); $$;
create function public.register_for_event(target_event_id uuid)
returns text language sql security invoker set search_path = '' as $$ select private.register_for_event(target_event_id); $$;
create function public.cancel_event_registration(target_registration_id uuid)
returns uuid language sql security invoker set search_path = '' as $$ select private.cancel_event_registration(target_registration_id); $$;
create function public.mark_event_attendance(target_registration_id uuid, attendance_status text, reason text)
returns void language sql security invoker set search_path = '' as $$ select private.mark_event_attendance(target_registration_id, attendance_status, reason); $$;
create function public.list_club_events(target_club_id uuid)
returns table (event_id uuid, title text, description text, event_type text, location text, starts_at timestamptz,
  ends_at timestamptz, registration_deadline timestamptz, capacity integer, visibility text, eligibility text,
  status text, created_by uuid, creator_name text, approved_by uuid, registered_count bigint, waitlisted_count bigint)
language sql stable security invoker set search_path = '' as $$ select * from private.list_club_events(target_club_id); $$;
create function public.list_discoverable_events()
returns table (event_id uuid, club_id uuid, club_name text, university_name text, title text, description text,
  event_type text, location text, starts_at timestamptz, ends_at timestamptz, registration_deadline timestamptz,
  capacity integer, eligibility text, registration_status text, registered_count bigint, waitlisted_count bigint)
language sql stable security invoker set search_path = '' as $$ select * from private.list_discoverable_events(); $$;
create function public.list_event_registrations(target_event_id uuid)
returns table (registration_id uuid, user_id uuid, display_name text, email text, status text, registered_at timestamptz)
language sql stable security invoker set search_path = '' as $$ select * from private.list_event_registrations(target_event_id); $$;

revoke execute on all functions in schema private from public, anon;
revoke execute on function public.create_club_event(uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text),
  public.update_club_event(uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text),
  public.transition_club_event(uuid,text,text), public.register_for_event(uuid),
  public.cancel_event_registration(uuid), public.mark_event_attendance(uuid,text,text),
  public.list_club_events(uuid), public.list_discoverable_events(), public.list_event_registrations(uuid)
from public, anon;

grant execute on function private.create_club_event(uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text),
  private.update_club_event(uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text),
  private.transition_club_event(uuid,text,text), private.register_for_event(uuid),
  private.cancel_event_registration(uuid), private.mark_event_attendance(uuid,text,text),
  private.list_club_events(uuid), private.list_discoverable_events(), private.list_event_registrations(uuid)
to authenticated;
grant execute on function public.create_club_event(uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text),
  public.update_club_event(uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,integer,text,text),
  public.transition_club_event(uuid,text,text), public.register_for_event(uuid),
  public.cancel_event_registration(uuid), public.mark_event_attendance(uuid,text,text),
  public.list_club_events(uuid), public.list_discoverable_events(), public.list_event_registrations(uuid)
to authenticated;
