create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(display_name) between 2 and 120),
  locale text not null default 'en'
    check (locale in ('en', 'ar')),
  time_zone text not null default 'UTC'
    check (char_length(time_zone) between 1 and 100),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

comment on table public.profiles is
  'Application profile data for a Supabase Auth user. Authorization data is deliberately stored elsewhere.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_name text;
begin
  requested_name := trim(new.raw_user_meta_data ->> 'display_name');

  insert into public.profiles (id, display_name)
  values (
    new.id,
    case
      when char_length(requested_name) between 2 and 120 then requested_name
      else 'New member'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 200),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  default_locale text not null default 'en'
    check (default_locale in ('en', 'ar')),
  default_time_zone text not null default 'UTC'
    check (char_length(default_time_zone) between 1 and 100),
  default_currency char(3) not null default 'DZD'
    check (default_currency ~ '^[A-Z]{3}$'),
  settings jsonb not null default '{}'::jsonb
    check (jsonb_typeof(settings) = 'object'),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  unique (slug),
  check (archived_at is null or status = 'archived')
);

create index universities_status_idx on public.universities (status);

create trigger universities_set_updated_at
before update on public.universities
for each row execute function private.set_updated_at();

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 160),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text check (description is null or char_length(description) <= 5000),
  visibility text not null default 'private'
    check (visibility in ('public', 'university', 'private')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  archived_at timestamptz,
  unique (university_id, slug),
  check (archived_at is null or status = 'archived')
);

create index clubs_university_id_idx on public.clubs (university_id);
create index clubs_university_status_idx on public.clubs (university_id, status);
create index clubs_public_discovery_idx
  on public.clubs (university_id, name)
  where status = 'active' and visibility = 'public';

create trigger clubs_set_updated_at
before update on public.clubs
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.universities enable row level security;
alter table public.clubs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.universities from anon, authenticated;
revoke all on table public.clubs from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, locale, time_zone, onboarding_completed)
  on table public.profiles to authenticated;

grant select on table public.universities to authenticated;
grant select on table public.clubs to authenticated;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy universities_select_active
on public.universities
for select
to authenticated
using (status = 'active');

create policy clubs_select_public_active
on public.clubs
for select
to authenticated
using (status = 'active' and visibility = 'public');
