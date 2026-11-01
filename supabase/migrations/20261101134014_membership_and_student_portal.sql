insert into public.permissions (key, name, description, scope_type)
values (
  'club.members_manage',
  'Manage club memberships',
  'Manage membership lifecycle, invitations, renewals, and member status.',
  'club'
)
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
join public.permissions as permission on permission.key = 'club.members_manage'
where role.is_system
  and role.key in ('platform_owner', 'university_admin', 'club_president')
on conflict (role_id, permission_id) do nothing;

create table public.club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'expired', 'resigned', 'removed')),
  joined_at timestamptz not null default statement_timestamp(),
  valid_until date,
  ended_at timestamptz,
  ended_by uuid references public.profiles (id) on delete restrict,
  end_reason text check (end_reason is null or char_length(end_reason) between 5 and 500),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (
    (status in ('active', 'suspended') and ended_at is null and ended_by is null and end_reason is null)
    or
    (status in ('expired', 'resigned', 'removed') and ended_at is not null and end_reason is not null)
  )
);

create unique index club_memberships_current_unique
  on public.club_memberships (club_id, user_id)
  where status in ('active', 'suspended');
create index club_memberships_user_idx
  on public.club_memberships (user_id, status, updated_at desc);
create index club_memberships_club_idx
  on public.club_memberships (club_id, status, joined_at);

create trigger club_memberships_set_updated_at
before update on public.club_memberships
for each row execute function private.set_updated_at();

create table public.membership_applications (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete restrict,
  applicant_id uuid not null references public.profiles (id) on delete restrict,
  application_type text not null default 'join'
    check (application_type in ('join', 'renewal')),
  membership_id uuid references public.club_memberships (id) on delete restrict,
  form_version integer not null default 1 check (form_version > 0),
  motivation text not null check (char_length(motivation) between 10 and 3000),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
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
    (application_type = 'join' and (membership_id is null or status = 'approved'))
    or (application_type = 'renewal' and membership_id is not null)
  ),
  check (
    (status = 'submitted' and reviewer_id is null and reviewed_at is null)
    or (status = 'under_review' and reviewer_id is not null and reviewed_at is null)
    or (status in ('approved', 'rejected') and reviewer_id is not null and reviewed_at is not null)
    or status = 'withdrawn'
  ),
  check (status <> 'rejected' or decision_reason is not null)
);

create unique index membership_applications_open_unique
  on public.membership_applications (club_id, applicant_id)
  where status in ('submitted', 'under_review');
create index membership_applications_applicant_idx
  on public.membership_applications (applicant_id, created_at desc);
create index membership_applications_review_idx
  on public.membership_applications (club_id, status, submitted_at);

create trigger membership_applications_set_updated_at
before update on public.membership_applications
for each row execute function private.set_updated_at();

create table public.membership_status_history (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.club_memberships (id) on delete restrict,
  club_id uuid not null references public.clubs (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  from_status text,
  to_status text not null
    check (to_status in ('active', 'suspended', 'expired', 'resigned', 'removed')),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  reason text check (reason is null or char_length(reason) between 5 and 500),
  created_at timestamptz not null default statement_timestamp()
);

create index membership_status_history_membership_idx
  on public.membership_status_history (membership_id, created_at);
create index membership_status_history_user_idx
  on public.membership_status_history (user_id, created_at desc);

create table public.club_invitations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete restrict,
  recipient_email text not null check (recipient_email = lower(recipient_email)),
  token_digest text not null unique check (token_digest ~ '^[0-9a-f]{64}$'),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete restrict,
  membership_id uuid references public.club_memberships (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (expires_at > created_at),
  check (
    (status = 'accepted' and accepted_by is not null and membership_id is not null)
    or (status <> 'accepted' and accepted_by is null and membership_id is null)
  )
);

create unique index club_invitations_pending_email_unique
  on public.club_invitations (club_id, recipient_email)
  where status = 'pending';
create index club_invitations_club_idx
  on public.club_invitations (club_id, status, created_at desc);

create trigger club_invitations_set_updated_at
before update on public.club_invitations
for each row execute function private.set_updated_at();

alter table public.club_memberships enable row level security;
alter table public.membership_applications enable row level security;
alter table public.membership_status_history enable row level security;
alter table public.club_invitations enable row level security;

revoke all on table public.club_memberships from public, anon, authenticated;
revoke all on table public.membership_applications from public, anon, authenticated;
revoke all on table public.membership_status_history from public, anon, authenticated;
revoke all on table public.club_invitations from public, anon, authenticated;

grant select on table public.club_memberships to authenticated;
grant select on table public.membership_applications to authenticated;
grant select on table public.membership_status_history to authenticated;
grant select on table public.club_invitations to authenticated;

create or replace function private.current_user_has_club_access(target_club_id uuid)
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
        or exists (
          select 1
          from public.club_memberships as membership
          where membership.club_id = club.id
            and membership.user_id = (select auth.uid())
            and membership.status = 'active'
            and (membership.valid_until is null or membership.valid_until >= current_date)
        )
      )
  );
$$;

create policy club_memberships_select_authorized
on public.club_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_has_club_access(club_id))
);

create policy membership_applications_select_authorized
on public.membership_applications for select to authenticated
using (
  applicant_id = (select auth.uid())
  or (select private.has_club_permission(club_id, 'club.members_review'))
);

create policy membership_status_history_select_authorized
on public.membership_status_history for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_has_club_access(club_id))
);

create policy club_invitations_select_authorized
on public.club_invitations for select to authenticated
using ((select private.has_club_permission(club_id, 'club.members_manage')));

create function private.list_discoverable_clubs(search_query text default '')
returns table (
  club_id uuid,
  university_id uuid,
  university_name text,
  club_name text,
  club_slug text,
  club_description text,
  application_status text,
  membership_status text
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
    (
      select application.status
      from public.membership_applications as application
      where application.club_id = club.id
        and application.applicant_id = (select auth.uid())
      order by application.created_at desc
      limit 1
    ),
    (
      select membership.status
      from public.club_memberships as membership
      where membership.club_id = club.id
        and membership.user_id = (select auth.uid())
      order by membership.created_at desc
      limit 1
    )
  from public.clubs as club
  join public.universities as university on university.id = club.university_id
  where (select private.current_user_is_active())
    and club.status = 'active'
    and club.visibility = 'public'
    and university.status = 'active'
    and (
      nullif(trim(search_query), '') is null
      or club.name ilike '%' || trim(search_query) || '%'
      or university.name ilike '%' || trim(search_query) || '%'
    )
  order by university.name, club.name
  limit 100;
$$;

create function private.submit_membership_application(
  target_club_id uuid,
  application_type text,
  target_membership_id uuid,
  motivation text,
  answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_motivation text := trim(motivation);
  application_id uuid;
begin
  if actor_user_id is null or not (select private.current_user_is_active()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if application_type not in ('join', 'renewal')
    or char_length(normalized_motivation) not between 10 and 3000
    or jsonb_typeof(coalesce(answers, '{}'::jsonb)) <> 'object' then
    raise exception 'Invalid membership application' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.clubs as club
    where club.id = target_club_id
      and club.status = 'active'
      and club.visibility in ('public', 'university')
  ) then
    raise exception 'Club is not accepting applications' using errcode = '22023';
  end if;

  if application_type = 'join' then
    if target_membership_id is not null or exists (
      select 1 from public.club_memberships as membership
      where membership.club_id = target_club_id
        and membership.user_id = actor_user_id
        and membership.status in ('active', 'suspended')
    ) then
      raise exception 'A current membership already exists' using errcode = '23505';
    end if;
  else
    if target_membership_id is null or not exists (
      select 1 from public.club_memberships as membership
      where membership.id = target_membership_id
        and membership.club_id = target_club_id
        and membership.user_id = actor_user_id
        and membership.status in ('expired', 'resigned')
    ) then
      raise exception 'Membership is not eligible for renewal' using errcode = '22023';
    end if;
  end if;

  insert into public.membership_applications (
    club_id, applicant_id, application_type, membership_id,
    motivation, answers
  ) values (
    target_club_id, actor_user_id, application_type, target_membership_id,
    normalized_motivation, coalesce(answers, '{}'::jsonb)
  ) returning id into application_id;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id, after_state
  ) values (
    actor_user_id,
    'membership_application.submitted',
    'membership_application',
    application_id,
    target_club_id,
    jsonb_build_object('type', application_type, 'status', 'submitted')
  );

  return application_id;
exception
  when unique_violation then
    raise exception 'An open membership application already exists' using errcode = '23505';
end;
$$;

create function private.withdraw_membership_application(target_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  target_club_id uuid;
begin
  update public.membership_applications
  set status = 'withdrawn'
  where id = target_application_id
    and applicant_id = actor_user_id
    and status in ('submitted', 'under_review')
  returning club_id into target_club_id;

  if target_club_id is null then
    raise exception 'Application cannot be withdrawn' using errcode = '42501';
  end if;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id,
    before_state, after_state
  ) values (
    actor_user_id, 'membership_application.withdrawn', 'membership_application',
    target_application_id, target_club_id,
    jsonb_build_object('status', 'open'), jsonb_build_object('status', 'withdrawn')
  );
  return target_application_id;
end;
$$;

create function private.list_my_membership_applications()
returns table (
  application_id uuid, club_id uuid, club_name text, university_name text,
  application_type text, membership_id uuid, motivation text, answers jsonb,
  status text, decision_reason text, submitted_at timestamptz, reviewed_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select application.id, application.club_id, club.name, university.name,
    application.application_type, application.membership_id,
    application.motivation, application.answers, application.status,
    application.decision_reason, application.submitted_at, application.reviewed_at
  from public.membership_applications as application
  join public.clubs as club on club.id = application.club_id
  join public.universities as university on university.id = club.university_id
  where application.applicant_id = (select auth.uid())
    and (select private.current_user_is_active())
  order by application.created_at desc;
$$;

create function private.list_reviewable_membership_applications(target_club_id uuid)
returns table (
  application_id uuid, applicant_id uuid, applicant_name text, applicant_email text,
  application_type text, membership_id uuid, motivation text, answers jsonb,
  status text, decision_reason text, submitted_at timestamptz, reviewed_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select application.id, application.applicant_id, profile.display_name,
    lower(auth_user.email)::text, application.application_type,
    application.membership_id, application.motivation, application.answers,
    application.status, application.decision_reason,
    application.submitted_at, application.reviewed_at
  from public.membership_applications as application
  join public.profiles as profile on profile.id = application.applicant_id
  join auth.users as auth_user on auth_user.id = application.applicant_id
  where application.club_id = target_club_id
    and (select private.has_club_permission(target_club_id, 'club.members_review'))
  order by
    case application.status when 'submitted' then 1 when 'under_review' then 2 else 3 end,
    application.submitted_at desc;
$$;

create function private.transition_membership_application(
  target_application_id uuid,
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
  application_record public.membership_applications%rowtype;
  resulting_membership_id uuid;
  previous_membership_status text;
begin
  select * into application_record
  from public.membership_applications
  where id = target_application_id
  for update;

  if actor_user_id is null
    or application_record.id is null
    or not (select private.has_club_permission(
      application_record.club_id, 'club.members_review'
    )) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if application_record.applicant_id = actor_user_id then
    raise exception 'Applicants cannot review their own application' using errcode = '42501';
  end if;
  if not (
    (application_record.status = 'submitted' and new_status = 'under_review')
    or (application_record.status = 'under_review' and new_status in ('approved', 'rejected'))
  ) then
    raise exception 'Invalid application transition' using errcode = '22023';
  end if;
  if new_status = 'rejected'
    and (normalized_reason is null or char_length(normalized_reason) < 5) then
    raise exception 'Rejection reason is required' using errcode = '22023';
  end if;
  if normalized_reason is not null and char_length(normalized_reason) > 1000 then
    raise exception 'Decision reason is too long' using errcode = '22023';
  end if;

  if new_status = 'approved' then
    if application_record.application_type = 'join' then
      insert into public.club_memberships (
        club_id, user_id, status, valid_until, created_by
      ) values (
        application_record.club_id,
        application_record.applicant_id,
        'active',
        current_date + interval '1 year',
        actor_user_id
      ) returning id into resulting_membership_id;
      previous_membership_status := null;
    else
      select status into previous_membership_status
      from public.club_memberships
      where id = application_record.membership_id
        and user_id = application_record.applicant_id
        and club_id = application_record.club_id
      for update;

      if previous_membership_status not in ('expired', 'resigned') then
        raise exception 'Membership is not eligible for renewal' using errcode = '22023';
      end if;

      update public.club_memberships
      set status = 'active',
          joined_at = statement_timestamp(),
          valid_until = current_date + interval '1 year',
          ended_at = null,
          ended_by = null,
          end_reason = null
      where id = application_record.membership_id
      returning id into resulting_membership_id;
    end if;

    insert into public.membership_status_history (
      membership_id, club_id, user_id, from_status, to_status, actor_id, reason
    ) values (
      resulting_membership_id, application_record.club_id,
      application_record.applicant_id, previous_membership_status,
      'active', actor_user_id, normalized_reason
    );
  end if;

  update public.membership_applications
  set status = new_status,
      reviewer_id = actor_user_id,
      decision_reason = case when new_status in ('approved', 'rejected') then normalized_reason else null end,
      reviewed_at = case when new_status in ('approved', 'rejected') then statement_timestamp() else null end,
      membership_id = coalesce(resulting_membership_id, membership_id)
  where id = target_application_id;

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id,
    before_state, after_state, metadata
  ) values (
    actor_user_id,
    'membership_application.' || new_status,
    'membership_application',
    target_application_id,
    application_record.club_id,
    jsonb_build_object('status', application_record.status),
    jsonb_build_object('status', new_status, 'membership_id', resulting_membership_id),
    jsonb_build_object('reason', normalized_reason)
  );
  return target_application_id;
exception
  when unique_violation then
    raise exception 'A current membership already exists' using errcode = '23505';
end;
$$;

create function private.list_my_memberships()
returns table (
  membership_id uuid, club_id uuid, club_name text, university_name text,
  membership_status text, joined_at timestamptz, valid_until date
)
language sql stable security definer set search_path = ''
as $$
  select membership.id, membership.club_id, club.name, university.name,
    membership.status, membership.joined_at, membership.valid_until
  from public.club_memberships as membership
  join public.clubs as club on club.id = membership.club_id
  join public.universities as university on university.id = club.university_id
  where membership.user_id = (select auth.uid())
    and (select private.current_user_is_active())
  order by membership.updated_at desc;
$$;

create function private.list_club_members(target_club_id uuid)
returns table (
  membership_id uuid, user_id uuid, display_name text, email text,
  membership_status text, joined_at timestamptz, valid_until date,
  ended_at timestamptz, end_reason text
)
language sql stable security definer set search_path = ''
as $$
  select membership.id, membership.user_id, profile.display_name,
    lower(auth_user.email)::text, membership.status, membership.joined_at,
    membership.valid_until, membership.ended_at, membership.end_reason
  from public.club_memberships as membership
  join public.profiles as profile on profile.id = membership.user_id
  join auth.users as auth_user on auth_user.id = membership.user_id
  where membership.club_id = target_club_id
    and (select private.current_user_has_club_access(target_club_id))
  order by
    case membership.status when 'active' then 1 when 'suspended' then 2 else 3 end,
    profile.display_name;
$$;

create function private.transition_membership_status(
  target_membership_id uuid,
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
  membership_record public.club_memberships%rowtype;
begin
  select * into membership_record
  from public.club_memberships
  where id = target_membership_id
  for update;

  if actor_user_id is null
    or membership_record.id is null
    or not (select private.has_club_permission(
      membership_record.club_id, 'club.members_manage'
    )) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if normalized_reason is null or char_length(normalized_reason) not between 5 and 500 then
    raise exception 'A status reason is required' using errcode = '22023';
  end if;
  if not (
    (membership_record.status = 'active' and new_status in ('suspended', 'expired', 'removed'))
    or (membership_record.status = 'suspended' and new_status in ('active', 'removed'))
    or (membership_record.status in ('expired', 'resigned') and new_status = 'active')
  ) then
    raise exception 'Invalid membership transition' using errcode = '22023';
  end if;

  update public.club_memberships
  set status = new_status,
      valid_until = case
        when new_status = 'active' then greatest(coalesce(valid_until, current_date), current_date + interval '1 year')
        else valid_until
      end,
      ended_at = case when new_status in ('expired', 'removed') then statement_timestamp() else null end,
      ended_by = case when new_status in ('expired', 'removed') then actor_user_id else null end,
      end_reason = case when new_status in ('expired', 'removed') then normalized_reason else null end
  where id = target_membership_id;

  insert into public.membership_status_history (
    membership_id, club_id, user_id, from_status, to_status, actor_id, reason
  ) values (
    membership_record.id, membership_record.club_id, membership_record.user_id,
    membership_record.status, new_status, actor_user_id, normalized_reason
  );

  insert into public.audit_events (
    actor_id, action, resource_type, resource_id, club_id,
    before_state, after_state, metadata
  ) values (
    actor_user_id, 'membership.' || new_status, 'club_membership',
    membership_record.id, membership_record.club_id,
    jsonb_build_object('status', membership_record.status),
    jsonb_build_object('status', new_status),
    jsonb_build_object('reason', normalized_reason)
  );
  return target_membership_id;
end;
$$;

create function private.resign_membership(target_membership_id uuid, reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_reason text := nullif(trim(reason), '');
  target_club_id uuid;
  previous_status text;
begin
  if normalized_reason is null or char_length(normalized_reason) not between 5 and 500 then
    raise exception 'A resignation reason is required' using errcode = '22023';
  end if;
  select club_id, status into target_club_id, previous_status
  from public.club_memberships
  where id = target_membership_id
    and user_id = actor_user_id
    and status in ('active', 'suspended')
  for update;

  if target_club_id is null then
    raise exception 'Membership cannot be resigned' using errcode = '42501';
  end if;

  update public.club_memberships
  set status = 'resigned', ended_at = statement_timestamp(),
      ended_by = actor_user_id, end_reason = normalized_reason
  where id = target_membership_id;

  insert into public.membership_status_history (
    membership_id, club_id, user_id, from_status, to_status, actor_id, reason
  ) values (
    target_membership_id, target_club_id, actor_user_id,
    previous_status, 'resigned', actor_user_id, normalized_reason
  );
  return target_membership_id;
end;
$$;

create function private.create_club_invitation(
  target_club_id uuid,
  recipient_email text,
  raw_token text,
  expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  normalized_email text := lower(trim(recipient_email));
  invitation_id uuid;
begin
  if actor_user_id is null
    or not (select private.has_club_permission(target_club_id, 'club.members_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    or char_length(raw_token) < 32
    or expires_at <= statement_timestamp()
    or expires_at > statement_timestamp() + interval '30 days' then
    raise exception 'Invalid invitation' using errcode = '22023';
  end if;

  insert into public.club_invitations (
    club_id, recipient_email, token_digest, invited_by, expires_at
  ) values (
    target_club_id,
    normalized_email,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    actor_user_id,
    expires_at
  ) returning id into invitation_id;

  return invitation_id;
exception
  when unique_violation then
    raise exception 'A pending invitation already exists' using errcode = '23505';
end;
$$;

create function private.accept_club_invitation(raw_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := (select auth.uid());
  actor_email text;
  invitation_record public.club_invitations%rowtype;
  created_membership_id uuid;
begin
  select lower(email)::text into actor_email
  from auth.users where id = actor_user_id and deleted_at is null;

  select * into invitation_record
  from public.club_invitations
  where token_digest = encode(extensions.digest(raw_token, 'sha256'), 'hex')
  for update;

  if actor_user_id is null
    or not (select private.current_user_is_active())
    or invitation_record.id is null
    or invitation_record.status <> 'pending'
    or invitation_record.expires_at <= statement_timestamp()
    or invitation_record.recipient_email <> actor_email then
    raise exception 'Invitation is invalid or expired' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.club_memberships as membership
    where membership.club_id = invitation_record.club_id
      and membership.user_id = actor_user_id
      and membership.status in ('active', 'suspended')
  ) then
    raise exception 'A current membership already exists' using errcode = '23505';
  end if;

  insert into public.club_memberships (
    club_id, user_id, status, valid_until, created_by
  ) values (
    invitation_record.club_id, actor_user_id, 'active',
    current_date + interval '1 year', invitation_record.invited_by
  ) returning id into created_membership_id;

  update public.club_invitations
  set status = 'accepted', accepted_by = actor_user_id,
      membership_id = created_membership_id
  where id = invitation_record.id;

  insert into public.membership_status_history (
    membership_id, club_id, user_id, from_status, to_status, actor_id, reason
  ) values (
    created_membership_id, invitation_record.club_id, actor_user_id,
    null, 'active', actor_user_id, 'Accepted club invitation'
  );
  return created_membership_id;
end;
$$;

create function private.list_club_invitations(target_club_id uuid)
returns table (
  invitation_id uuid, recipient_email text, invitation_status text,
  expires_at timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = ''
as $$
  select invitation.id, invitation.recipient_email, invitation.status,
    invitation.expires_at, invitation.created_at
  from public.club_invitations as invitation
  where invitation.club_id = target_club_id
    and (select private.has_club_permission(target_club_id, 'club.members_manage'))
  order by invitation.created_at desc;
$$;

create function private.revoke_club_invitation(target_invitation_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  invitation_club_id uuid;
begin
  select club_id into invitation_club_id
  from public.club_invitations where id = target_invitation_id;
  if invitation_club_id is null
    or not (select private.has_club_permission(invitation_club_id, 'club.members_manage')) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  update public.club_invitations
  set status = 'revoked'
  where id = target_invitation_id and status = 'pending';
  if not found then
    raise exception 'Invitation cannot be revoked' using errcode = '22023';
  end if;
  return target_invitation_id;
end;
$$;

create function public.list_discoverable_clubs(search_query text default '')
returns table (
  club_id uuid, university_id uuid, university_name text, club_name text,
  club_slug text, club_description text, application_status text, membership_status text
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_discoverable_clubs(search_query); $$;

create function public.submit_membership_application(
  target_club_id uuid, application_type text, target_membership_id uuid,
  motivation text, answers jsonb
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.submit_membership_application(target_club_id, application_type, target_membership_id, motivation, answers); $$;

create function public.withdraw_membership_application(target_application_id uuid)
returns uuid language sql security invoker set search_path = ''
as $$ select private.withdraw_membership_application(target_application_id); $$;

create function public.list_my_membership_applications()
returns table (
  application_id uuid, club_id uuid, club_name text, university_name text,
  application_type text, membership_id uuid, motivation text, answers jsonb,
  status text, decision_reason text, submitted_at timestamptz, reviewed_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_my_membership_applications(); $$;

create function public.list_reviewable_membership_applications(target_club_id uuid)
returns table (
  application_id uuid, applicant_id uuid, applicant_name text, applicant_email text,
  application_type text, membership_id uuid, motivation text, answers jsonb,
  status text, decision_reason text, submitted_at timestamptz, reviewed_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_reviewable_membership_applications(target_club_id); $$;

create function public.transition_membership_application(
  target_application_id uuid, new_status text, reason text
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.transition_membership_application(target_application_id, new_status, reason); $$;

create function public.list_my_memberships()
returns table (
  membership_id uuid, club_id uuid, club_name text, university_name text,
  membership_status text, joined_at timestamptz, valid_until date
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_my_memberships(); $$;

create function public.list_club_members(target_club_id uuid)
returns table (
  membership_id uuid, user_id uuid, display_name text, email text,
  membership_status text, joined_at timestamptz, valid_until date,
  ended_at timestamptz, end_reason text
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_club_members(target_club_id); $$;

create function public.transition_membership_status(
  target_membership_id uuid, new_status text, reason text
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.transition_membership_status(target_membership_id, new_status, reason); $$;

create function public.resign_membership(target_membership_id uuid, reason text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.resign_membership(target_membership_id, reason); $$;

create function public.create_club_invitation(
  target_club_id uuid, recipient_email text, raw_token text, expires_at timestamptz
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.create_club_invitation(target_club_id, recipient_email, raw_token, expires_at); $$;

create function public.accept_club_invitation(raw_token text)
returns uuid language sql security invoker set search_path = ''
as $$ select private.accept_club_invitation(raw_token); $$;

create function public.list_club_invitations(target_club_id uuid)
returns table (
  invitation_id uuid, recipient_email text, invitation_status text,
  expires_at timestamptz, created_at timestamptz
)
language sql stable security invoker set search_path = ''
as $$ select * from private.list_club_invitations(target_club_id); $$;

create function public.revoke_club_invitation(target_invitation_id uuid)
returns uuid language sql security invoker set search_path = ''
as $$ select private.revoke_club_invitation(target_invitation_id); $$;

revoke execute on all functions in schema private from public, anon;
revoke execute on function public.list_discoverable_clubs(text) from public, anon;
revoke execute on function public.submit_membership_application(uuid, text, uuid, text, jsonb) from public, anon;
revoke execute on function public.withdraw_membership_application(uuid) from public, anon;
revoke execute on function public.list_my_membership_applications() from public, anon;
revoke execute on function public.list_reviewable_membership_applications(uuid) from public, anon;
revoke execute on function public.transition_membership_application(uuid, text, text) from public, anon;
revoke execute on function public.list_my_memberships() from public, anon;
revoke execute on function public.list_club_members(uuid) from public, anon;
revoke execute on function public.transition_membership_status(uuid, text, text) from public, anon;
revoke execute on function public.resign_membership(uuid, text) from public, anon;
revoke execute on function public.create_club_invitation(uuid, text, text, timestamptz) from public, anon;
revoke execute on function public.accept_club_invitation(text) from public, anon;
revoke execute on function public.list_club_invitations(uuid) from public, anon;
revoke execute on function public.revoke_club_invitation(uuid) from public, anon;

grant execute on function private.list_discoverable_clubs(text) to authenticated;
grant execute on function private.submit_membership_application(uuid, text, uuid, text, jsonb) to authenticated;
grant execute on function private.withdraw_membership_application(uuid) to authenticated;
grant execute on function private.list_my_membership_applications() to authenticated;
grant execute on function private.list_reviewable_membership_applications(uuid) to authenticated;
grant execute on function private.transition_membership_application(uuid, text, text) to authenticated;
grant execute on function private.list_my_memberships() to authenticated;
grant execute on function private.list_club_members(uuid) to authenticated;
grant execute on function private.transition_membership_status(uuid, text, text) to authenticated;
grant execute on function private.resign_membership(uuid, text) to authenticated;
grant execute on function private.create_club_invitation(uuid, text, text, timestamptz) to authenticated;
grant execute on function private.accept_club_invitation(text) to authenticated;
grant execute on function private.list_club_invitations(uuid) to authenticated;
grant execute on function private.revoke_club_invitation(uuid) to authenticated;
grant execute on function public.list_discoverable_clubs(text) to authenticated;
grant execute on function public.submit_membership_application(uuid, text, uuid, text, jsonb) to authenticated;
grant execute on function public.withdraw_membership_application(uuid) to authenticated;
grant execute on function public.list_my_membership_applications() to authenticated;
grant execute on function public.list_reviewable_membership_applications(uuid) to authenticated;
grant execute on function public.transition_membership_application(uuid, text, text) to authenticated;
grant execute on function public.list_my_memberships() to authenticated;
grant execute on function public.list_club_members(uuid) to authenticated;
grant execute on function public.transition_membership_status(uuid, text, text) to authenticated;
grant execute on function public.resign_membership(uuid, text) to authenticated;
grant execute on function public.create_club_invitation(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.accept_club_invitation(text) to authenticated;
grant execute on function public.list_club_invitations(uuid) to authenticated;
grant execute on function public.revoke_club_invitation(uuid) to authenticated;
