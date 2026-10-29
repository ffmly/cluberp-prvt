create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9-]{0,19}$'),
  name text not null check (char_length(name) between 2 and 160),
  address text check (address is null or char_length(address) <= 1000),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  unique (university_id, code),
  unique (id, university_id),
  check (archived_at is null or status = 'archived')
);

create index campuses_university_status_idx
  on public.campuses (university_id, status);

create trigger campuses_set_updated_at
before update on public.campuses
for each row execute function private.set_updated_at();

create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  campus_id uuid not null,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9-]{0,19}$'),
  name text not null check (char_length(name) between 2 and 160),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  foreign key (campus_id, university_id)
    references public.campuses (id, university_id) on delete restrict,
  unique (university_id, code),
  unique (id, university_id),
  check (archived_at is null or status = 'archived')
);

create index faculties_university_status_idx
  on public.faculties (university_id, status);
create index faculties_campus_id_idx on public.faculties (campus_id);

create trigger faculties_set_updated_at
before update on public.faculties
for each row execute function private.set_updated_at();

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  faculty_id uuid not null,
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9-]{0,19}$'),
  name text not null check (char_length(name) between 2 and 160),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  foreign key (faculty_id, university_id)
    references public.faculties (id, university_id) on delete restrict,
  unique (university_id, code),
  unique (id, university_id),
  check (archived_at is null or status = 'archived')
);

create index departments_university_status_idx
  on public.departments (university_id, status);
create index departments_faculty_id_idx on public.departments (faculty_id);

create trigger departments_set_updated_at
before update on public.departments
for each row execute function private.set_updated_at();

create table public.university_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  scope_type text not null
    check (scope_type in ('university', 'campus', 'faculty', 'department')),
  campus_id uuid,
  faculty_id uuid,
  department_id uuid,
  staff_type text not null
    check (staff_type in ('administrator', 'supervisor', 'reviewer', 'other')),
  title text check (title is null or char_length(title) between 2 and 160),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'ended')),
  starts_at timestamptz not null default statement_timestamp(),
  ends_at timestamptz,
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  foreign key (campus_id, university_id)
    references public.campuses (id, university_id) on delete restrict,
  foreign key (faculty_id, university_id)
    references public.faculties (id, university_id) on delete restrict,
  foreign key (department_id, university_id)
    references public.departments (id, university_id) on delete restrict,
  check (ends_at is null or ends_at > starts_at),
  check ((status = 'ended') = (ends_at is not null)),
  check (
    (scope_type = 'university'
      and campus_id is null and faculty_id is null and department_id is null)
    or
    (scope_type = 'campus'
      and campus_id is not null and faculty_id is null and department_id is null)
    or
    (scope_type = 'faculty'
      and campus_id is null and faculty_id is not null and department_id is null)
    or
    (scope_type = 'department'
      and campus_id is null and faculty_id is null and department_id is not null)
  )
);

create unique index university_staff_assignments_current_unique
  on public.university_staff_assignments (
    university_id,
    user_id,
    scope_type,
    campus_id,
    faculty_id,
    department_id,
    staff_type
  ) nulls not distinct
  where status in ('invited', 'active', 'suspended');

create index university_staff_assignments_user_id_idx
  on public.university_staff_assignments (user_id);
create index university_staff_assignments_university_status_idx
  on public.university_staff_assignments (university_id, status);
create index university_staff_assignments_campus_id_idx
  on public.university_staff_assignments (campus_id)
  where campus_id is not null;
create index university_staff_assignments_faculty_id_idx
  on public.university_staff_assignments (faculty_id)
  where faculty_id is not null;
create index university_staff_assignments_department_id_idx
  on public.university_staff_assignments (department_id)
  where department_id is not null;

create trigger university_staff_assignments_set_updated_at
before update on public.university_staff_assignments
for each row execute function private.set_updated_at();

insert into public.permissions (key, name, description, scope_type)
values
  (
    'university.units_view',
    'View university units',
    'View campuses, faculties, and departments in an assigned university.',
    'university'
  ),
  (
    'university.units_manage',
    'Manage university units',
    'Create and update campuses, faculties, and departments in an assigned university.',
    'university'
  );

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles as role
cross join public.permissions as permission
where permission.key in ('university.units_view', 'university.units_manage')
  and role.is_system
  and (
    (role.scope_type = 'platform' and role.key = 'platform_owner')
    or
    (role.scope_type = 'university' and role.key = 'university_admin')
  );

alter table public.campuses enable row level security;
alter table public.faculties enable row level security;
alter table public.departments enable row level security;
alter table public.university_staff_assignments enable row level security;

revoke all on table public.campuses from anon, authenticated;
revoke all on table public.faculties from anon, authenticated;
revoke all on table public.departments from anon, authenticated;
revoke all on table public.university_staff_assignments from anon, authenticated;

grant select on table public.campuses to authenticated;
grant select on table public.faculties to authenticated;
grant select on table public.departments to authenticated;
grant select on table public.university_staff_assignments to authenticated;

grant insert (
  university_id,
  code,
  name,
  address,
  status,
  created_by,
  archived_at
) on table public.campuses to authenticated;
grant update (code, name, address, status, archived_at)
  on table public.campuses to authenticated;

grant insert (
  university_id,
  campus_id,
  code,
  name,
  status,
  created_by,
  archived_at
) on table public.faculties to authenticated;
grant update (campus_id, code, name, status, archived_at)
  on table public.faculties to authenticated;

grant insert (
  university_id,
  faculty_id,
  code,
  name,
  status,
  created_by,
  archived_at
) on table public.departments to authenticated;
grant update (faculty_id, code, name, status, archived_at)
  on table public.departments to authenticated;

grant insert (
  university_id,
  user_id,
  scope_type,
  campus_id,
  faculty_id,
  department_id,
  staff_type,
  title,
  status,
  starts_at,
  ends_at,
  assigned_by
) on table public.university_staff_assignments to authenticated;
grant update (staff_type, title, status, starts_at, ends_at)
  on table public.university_staff_assignments to authenticated;

create policy campuses_select_authorized
on public.campuses
for select
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.units_view'
  ))
);

create policy campuses_insert_authorized
on public.campuses
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
);

create policy campuses_update_authorized
on public.campuses
for update
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
)
with check (
  (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
);

create policy faculties_select_authorized
on public.faculties
for select
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.units_view'
  ))
);

create policy faculties_insert_authorized
on public.faculties
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
);

create policy faculties_update_authorized
on public.faculties
for update
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
)
with check (
  (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
);

create policy departments_select_authorized
on public.departments
for select
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.units_view'
  ))
);

create policy departments_insert_authorized
on public.departments
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
);

create policy departments_update_authorized
on public.departments
for update
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
)
with check (
  (select private.has_university_permission(
    university_id,
    'university.units_manage'
  ))
);

create policy university_staff_assignments_select_authorized
on public.university_staff_assignments
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_university_permission(
    university_id,
    'university.staff_manage'
  ))
);

create policy university_staff_assignments_insert_authorized
on public.university_staff_assignments
for insert
to authenticated
with check (
  assigned_by = (select auth.uid())
  and (select private.has_university_permission(
    university_id,
    'university.staff_manage'
  ))
);

create policy university_staff_assignments_update_authorized
on public.university_staff_assignments
for update
to authenticated
using (
  (select private.has_university_permission(
    university_id,
    'university.staff_manage'
  ))
)
with check (
  (select private.has_university_permission(
    university_id,
    'university.staff_manage'
  ))
);
