begin;

select plan(12);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'owner@example.test',
    '{"display_name":"Owner User"}'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'other@example.test',
    '{"display_name":"Other User"}'::jsonb
  );

insert into public.universities (
  id,
  name,
  slug,
  status,
  created_by
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Active University',
    'active-university',
    'active',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Draft University',
    'draft-university',
    'draft',
    '11111111-1111-1111-1111-111111111111'
  );

insert into public.clubs (
  id,
  university_id,
  name,
  slug,
  visibility,
  status,
  created_by
)
values
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Public Club',
    'public-club',
    'public',
    'active',
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Private Club',
    'private-club',
    'private',
    'active',
    '11111111-1111-1111-1111-111111111111'
  );

set local role anon;

select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  null,
  'anonymous callers cannot read profiles'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'$$,
  array['Owner User']::text[],
  'a user can read their own profile'
);

select is_empty(
  $$select id from public.profiles where id = '22222222-2222-2222-2222-222222222222'$$,
  'a user cannot read another profile'
);

select results_eq(
  $$update public.profiles set display_name = 'Updated Owner' where id = '11111111-1111-1111-1111-111111111111' returning display_name$$,
  array['Updated Owner']::text[],
  'a user can update their own allowed profile fields'
);

select is_empty(
  $$update public.profiles set display_name = 'Compromised' where id = '22222222-2222-2222-2222-222222222222' returning id$$,
  'a user cannot update another profile'
);

select throws_ok(
  $$insert into public.profiles (id, display_name) values ('33333333-3333-3333-3333-333333333333', 'Injected User')$$,
  '42501',
  null,
  'authenticated callers cannot insert profiles directly'
);

select results_eq(
  $$select name from public.universities order by name$$,
  array['Active University']::text[],
  'authenticated callers can discover active universities'
);

select is_empty(
  $$select id from public.universities where status = 'draft'$$,
  'draft universities remain private'
);

select throws_ok(
  $$update public.universities set name = 'Changed' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'$$,
  '42501',
  null,
  'authenticated callers cannot update universities without an explicit grant'
);

select results_eq(
  $$select name from public.clubs order by name$$,
  array['Public Club']::text[],
  'authenticated callers can discover active public clubs'
);

select is_empty(
  $$select id from public.clubs where visibility = 'private'$$,
  'private clubs remain hidden without scoped access'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.clubs$$,
  '42501',
  null,
  'anonymous callers have no club table grant'
);

select * from finish();

rollback;
