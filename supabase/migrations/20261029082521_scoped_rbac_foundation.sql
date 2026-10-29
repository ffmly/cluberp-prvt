create table public.teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  description text check (description is null or char_length(description) <= 2000),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  unique (club_id, name),
  check (archived_at is null or status = 'archived')
);

create index teams_club_id_idx on public.teams (club_id);

create trigger teams_set_updated_at
before update on public.teams
for each row execute function private.set_updated_at();

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique
    check (key ~ '^[a-z]+(?:\.[a-z_]+)+$'),
  name text not null check (char_length(name) between 2 and 120),
  description text not null check (char_length(description) between 2 and 500),
  scope_type text not null
    check (scope_type in ('platform', 'university', 'club', 'team')),
  created_at timestamptz not null default statement_timestamp()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null check (key ~ '^[a-z][a-z0-9_]{1,63}$'),
  name text not null check (char_length(name) between 2 and 120),
  description text check (description is null or char_length(description) <= 500),
  scope_type text not null
    check (scope_type in ('platform', 'university', 'club', 'team')),
  university_id uuid references public.universities (id) on delete restrict,
  club_id uuid references public.clubs (id) on delete restrict,
  team_id uuid references public.teams (id) on delete restrict,
  is_system boolean not null default false,
  created_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  constraint roles_scope_key_unique unique nulls not distinct (
    scope_type,
    university_id,
    club_id,
    team_id,
    key
  ),
  check (is_system or created_by is not null),
  check (
    (scope_type = 'platform'
      and university_id is null and club_id is null and team_id is null)
    or
    (scope_type = 'university'
      and club_id is null and team_id is null
      and ((is_system and university_id is null)
        or (not is_system and university_id is not null)))
    or
    (scope_type = 'club'
      and university_id is null and team_id is null
      and ((is_system and club_id is null)
        or (not is_system and club_id is not null)))
    or
    (scope_type = 'team'
      and university_id is null and club_id is null
      and ((is_system and team_id is null)
        or (not is_system and team_id is not null)))
  )
);

create index roles_university_id_idx on public.roles (university_id)
  where university_id is not null;
create index roles_club_id_idx on public.roles (club_id)
  where club_id is not null;
create index roles_team_id_idx on public.roles (team_id)
  where team_id is not null;

create trigger roles_set_updated_at
before update on public.roles
for each row execute function private.set_updated_at();

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete restrict,
  granted_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  primary key (role_id, permission_id)
);

create index role_permissions_permission_id_idx
  on public.role_permissions (permission_id);

create table public.platform_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  role_id uuid not null references public.roles (id) on delete restrict,
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete restrict,
  revocation_reason text check (
    revocation_reason is null or char_length(revocation_reason) between 2 and 500
  ),
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (ends_at is null or ends_at > starts_at),
  check ((revoked_at is null) = (revoked_by is null)),
  check (revoked_at is null or revocation_reason is not null)
);

create unique index platform_role_assignments_active_unique
  on public.platform_role_assignments (user_id, role_id)
  where revoked_at is null;
create index platform_role_assignments_user_id_idx
  on public.platform_role_assignments (user_id);
create index platform_role_assignments_role_id_idx
  on public.platform_role_assignments (role_id);

create table public.university_role_assignments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role_id uuid not null references public.roles (id) on delete restrict,
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete restrict,
  revocation_reason text check (
    revocation_reason is null or char_length(revocation_reason) between 2 and 500
  ),
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (ends_at is null or ends_at > starts_at),
  check ((revoked_at is null) = (revoked_by is null)),
  check (revoked_at is null or revocation_reason is not null)
);

create unique index university_role_assignments_active_unique
  on public.university_role_assignments (university_id, user_id, role_id)
  where revoked_at is null;
create index university_role_assignments_user_id_idx
  on public.university_role_assignments (user_id);
create index university_role_assignments_role_id_idx
  on public.university_role_assignments (role_id);

create table public.club_role_assignments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role_id uuid not null references public.roles (id) on delete restrict,
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete restrict,
  revocation_reason text check (
    revocation_reason is null or char_length(revocation_reason) between 2 and 500
  ),
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (ends_at is null or ends_at > starts_at),
  check ((revoked_at is null) = (revoked_by is null)),
  check (revoked_at is null or revocation_reason is not null)
);

create unique index club_role_assignments_active_unique
  on public.club_role_assignments (club_id, user_id, role_id)
  where revoked_at is null;
create index club_role_assignments_user_id_idx
  on public.club_role_assignments (user_id);
create index club_role_assignments_role_id_idx
  on public.club_role_assignments (role_id);

create table public.team_role_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role_id uuid not null references public.roles (id) on delete restrict,
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete restrict,
  revocation_reason text check (
    revocation_reason is null or char_length(revocation_reason) between 2 and 500
  ),
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  check (ends_at is null or ends_at > starts_at),
  check ((revoked_at is null) = (revoked_by is null)),
  check (revoked_at is null or revocation_reason is not null)
);

create unique index team_role_assignments_active_unique
  on public.team_role_assignments (team_id, user_id, role_id)
  where revoked_at is null;
create index team_role_assignments_user_id_idx
  on public.team_role_assignments (user_id);
create index team_role_assignments_role_id_idx
  on public.team_role_assignments (role_id);

create trigger platform_role_assignments_set_updated_at
before update on public.platform_role_assignments
for each row execute function private.set_updated_at();

create trigger university_role_assignments_set_updated_at
before update on public.university_role_assignments
for each row execute function private.set_updated_at();

create trigger club_role_assignments_set_updated_at
before update on public.club_role_assignments
for each row execute function private.set_updated_at();

create trigger team_role_assignments_set_updated_at
before update on public.team_role_assignments
for each row execute function private.set_updated_at();

create function private.validate_role_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_scope text;
  assignment_scope_id uuid;
  role_is_valid boolean;
begin
  expected_scope := case tg_table_name
    when 'platform_role_assignments' then 'platform'
    when 'university_role_assignments' then 'university'
    when 'club_role_assignments' then 'club'
    when 'team_role_assignments' then 'team'
    else null
  end;

  assignment_scope_id := case expected_scope
    when 'university' then nullif(to_jsonb(new) ->> 'university_id', '')::uuid
    when 'club' then nullif(to_jsonb(new) ->> 'club_id', '')::uuid
    when 'team' then nullif(to_jsonb(new) ->> 'team_id', '')::uuid
    else null
  end;

  select exists (
    select 1
    from public.roles as role
    where role.id = new.role_id
      and role.scope_type = expected_scope
      and role.archived_at is null
      and (
        expected_scope = 'platform'
        or role.is_system
        or (expected_scope = 'university' and role.university_id = assignment_scope_id)
        or (expected_scope = 'club' and role.club_id = assignment_scope_id)
        or (expected_scope = 'team' and role.team_id = assignment_scope_id)
      )
  ) into role_is_valid;

  if expected_scope is null or not role_is_valid then
    raise exception 'Role is not valid for this assignment scope'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.validate_role_assignment()
  from public, anon, authenticated;

create trigger platform_role_assignments_validate_role
before insert or update of role_id on public.platform_role_assignments
for each row execute function private.validate_role_assignment();

create trigger university_role_assignments_validate_role
before insert or update of university_id, role_id on public.university_role_assignments
for each row execute function private.validate_role_assignment();

create trigger club_role_assignments_validate_role
before insert or update of club_id, role_id on public.club_role_assignments
for each row execute function private.validate_role_assignment();

create trigger team_role_assignments_validate_role
before insert or update of team_id, role_id on public.team_role_assignments
for each row execute function private.validate_role_assignment();

create function private.validate_role_permission_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_scope text;
  permission_scope text;
  role_rank integer;
  permission_rank integer;
begin
  select scope_type into role_scope
  from public.roles
  where id = new.role_id and archived_at is null;

  select scope_type into permission_scope
  from public.permissions
  where id = new.permission_id;

  role_rank := case role_scope
    when 'platform' then 1
    when 'university' then 2
    when 'club' then 3
    when 'team' then 4
    else null
  end;

  permission_rank := case permission_scope
    when 'platform' then 1
    when 'university' then 2
    when 'club' then 3
    when 'team' then 4
    else null
  end;

  if role_rank is null or permission_rank is null or permission_rank < role_rank then
    raise exception 'Permission scope is not valid for this role'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function private.validate_role_permission_scope()
  from public, anon, authenticated;

create trigger role_permissions_validate_scope
before insert or update on public.role_permissions
for each row execute function private.validate_role_permission_scope();

insert into public.permissions (key, name, description, scope_type)
values
  ('platform.universities_manage', 'Manage universities', 'Create and administer platform universities.', 'platform'),
  ('platform.roles_manage', 'Manage platform roles', 'Manage platform-scoped roles and assignments.', 'platform'),
  ('platform.audit_view', 'View platform audit', 'View authorized platform audit events.', 'platform'),
  ('university.settings_manage', 'Manage university settings', 'Manage university identity and configuration.', 'university'),
  ('university.staff_manage', 'Manage university staff', 'Manage university staff and supervisors.', 'university'),
  ('university.clubs_review', 'Review clubs', 'Review club creation and renewal requests.', 'university'),
  ('university.reports_view', 'View university reports', 'View authorized university reports.', 'university'),
  ('club.settings_manage', 'Manage club settings', 'Manage club identity and configuration.', 'club'),
  ('club.roles_manage', 'Manage club roles', 'Manage club-scoped roles and assignments.', 'club'),
  ('club.members_view', 'View club members', 'View the authorized club member directory.', 'club'),
  ('club.members_review', 'Review membership applications', 'Review club membership applications.', 'club'),
  ('club.events_manage', 'Manage club events', 'Create and administer club events.', 'club'),
  ('club.tasks_manage', 'Manage club tasks', 'Create, assign, and update club tasks.', 'club'),
  ('club.documents_manage', 'Manage club documents', 'Manage authorized club documents.', 'club'),
  ('club.finance_manage', 'Manage club finance', 'Create budget and expense records.', 'club'),
  ('club.finance_approve', 'Approve club finance', 'Approve funding and expense decisions.', 'club'),
  ('club.design_use', 'Use Design Studio', 'Start and edit authorized club design projects.', 'club'),
  ('club.design_review', 'Review designs', 'Review authorized club design submissions.', 'club'),
  ('team.tasks_manage', 'Manage team tasks', 'Manage tasks inside an assigned team.', 'team')
on conflict (key) do nothing;

insert into public.roles (key, name, description, scope_type, is_system)
values
  ('platform_owner', 'Platform Owner', 'Full platform administration role.', 'platform', true),
  ('university_admin', 'University Administrator', 'Default university administration role.', 'university', true),
  ('club_president', 'Club President', 'Default club leadership role.', 'club', true),
  ('club_member', 'Club Member', 'Default active club membership role.', 'club', true),
  ('team_lead', 'Team Lead', 'Default team leadership role.', 'team', true)
on conflict on constraint roles_scope_key_unique do nothing;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
cross join public.permissions as permission
where role.is_system
  and (
    role.key = 'platform_owner'
    or (role.key = 'university_admin' and permission.scope_type in ('university', 'club', 'team'))
    or (role.key = 'club_president' and permission.scope_type in ('club', 'team'))
    or (role.key = 'team_lead' and permission.scope_type = 'team')
  )
on conflict (role_id, permission_id) do nothing;

create function private.has_platform_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
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

create function private.has_university_permission(
  target_university_id uuid,
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
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

create function private.has_club_permission(
  target_club_id uuid,
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
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

create function private.has_team_permission(
  target_team_id uuid,
  permission_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
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

revoke execute on function private.has_platform_permission(text) from public, anon;
revoke execute on function private.has_university_permission(uuid, text) from public, anon;
revoke execute on function private.has_club_permission(uuid, text) from public, anon;
revoke execute on function private.has_team_permission(uuid, text) from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.has_platform_permission(text) to authenticated;
grant execute on function private.has_university_permission(uuid, text) to authenticated;
grant execute on function private.has_club_permission(uuid, text) to authenticated;
grant execute on function private.has_team_permission(uuid, text) to authenticated;

alter table public.teams enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.platform_role_assignments enable row level security;
alter table public.university_role_assignments enable row level security;
alter table public.club_role_assignments enable row level security;
alter table public.team_role_assignments enable row level security;

revoke all on table public.teams from anon, authenticated;
revoke all on table public.permissions from anon, authenticated;
revoke all on table public.roles from anon, authenticated;
revoke all on table public.role_permissions from anon, authenticated;
revoke all on table public.platform_role_assignments from anon, authenticated;
revoke all on table public.university_role_assignments from anon, authenticated;
revoke all on table public.club_role_assignments from anon, authenticated;
revoke all on table public.team_role_assignments from anon, authenticated;

grant select on table public.permissions to authenticated;
grant select on table public.platform_role_assignments to authenticated;
grant select on table public.university_role_assignments to authenticated;
grant select on table public.club_role_assignments to authenticated;
grant select on table public.team_role_assignments to authenticated;

create policy permissions_select_authenticated
on public.permissions
for select
to authenticated
using (true);

create policy platform_role_assignments_select_own
on public.platform_role_assignments
for select
to authenticated
using (user_id = (select auth.uid()));

create policy university_role_assignments_select_own
on public.university_role_assignments
for select
to authenticated
using (user_id = (select auth.uid()));

create policy club_role_assignments_select_own
on public.club_role_assignments
for select
to authenticated
using (user_id = (select auth.uid()));

create policy team_role_assignments_select_own
on public.team_role_assignments
for select
to authenticated
using (user_id = (select auth.uid()));
