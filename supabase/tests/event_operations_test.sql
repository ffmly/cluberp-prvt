begin;

select plan(25);

insert into auth.users (id, email, raw_user_meta_data) values
  ('e1111111-1111-4111-8111-111111111111', 'event-creator@example.test', '{"display_name":"Event Creator"}'),
  ('e2222222-2222-4222-8222-222222222222', 'event-approver@example.test', '{"display_name":"Event Approver"}'),
  ('e3333333-3333-4333-8333-333333333333', 'event-student-one@example.test', '{"display_name":"Student One"}'),
  ('e4444444-4444-4444-8444-444444444444', 'event-student-two@example.test', '{"display_name":"Student Two"}'),
  ('e5555555-5555-4555-8555-555555555555', 'event-outsider@example.test', '{"display_name":"Event Outsider"}');

insert into public.universities (id, name, slug, status, created_by)
values ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Event University', 'event-university', 'active', 'e1111111-1111-4111-8111-111111111111');
insert into public.clubs (id, university_id, name, slug, description, visibility, status, created_by)
values ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Event Club', 'event-club', 'Club for event tests.', 'public', 'active', 'e1111111-1111-4111-8111-111111111111');

insert into public.club_role_assignments (club_id, user_id, role_id, assigned_by)
select 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', user_id, role.id, 'e1111111-1111-4111-8111-111111111111'
from public.roles role cross join (values
  ('e1111111-1111-4111-8111-111111111111'::uuid),
  ('e2222222-2222-4222-8222-222222222222'::uuid)
) users(user_id)
where role.key = 'club_president' and role.scope_type = 'club' and role.is_system;

set local role authenticated;
set local request.jwt.claim.sub = 'e1111111-1111-4111-8111-111111111111';

select lives_ok(
  $$select public.create_club_event(
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'Robotics Workshop',
    'Build and program a small mobile robot.', 'workshop', 'Innovation Lab',
    statement_timestamp() + interval '10 days', statement_timestamp() + interval '10 days 2 hours',
    statement_timestamp() + interval '9 days', 1, 'public', 'authenticated'
  )$$,
  'authorized leader creates a future event'
);

select is((select status from public.club_events where title = 'Robotics Workshop'), 'draft', 'new event starts as draft');
select is((select count(*) from public.event_status_history where to_status = 'draft'), 1::bigint, 'creation writes status history');

select throws_ok(
  $$select public.create_club_event(
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'Bad Schedule', 'This schedule is intentionally invalid.',
    'event', 'Lab', statement_timestamp() - interval '1 day', statement_timestamp() + interval '1 hour',
    statement_timestamp() - interval '2 days', 10, 'public', 'authenticated'
  )$$,
  '22023', null, 'past events are rejected'
);

select lives_ok(
  $$select public.update_club_event(
    (select id from public.club_events where title = 'Robotics Workshop'), 'Advanced Robotics Workshop',
    'Build, program, and test a mobile robot.', 'workshop', 'Main Innovation Lab',
    statement_timestamp() + interval '10 days', statement_timestamp() + interval '10 days 3 hours',
    statement_timestamp() + interval '9 days', 1, 'public', 'authenticated'
  )$$,
  'draft event can be edited'
);

select lives_ok(
  $$select public.transition_club_event((select id from public.club_events where title = 'Advanced Robotics Workshop'), 'pending_approval', null)$$,
  'creator submits event for approval'
);

select throws_ok(
  $$select public.transition_club_event((select id from public.club_events where title = 'Advanced Robotics Workshop'), 'published', null)$$,
  '42501', null, 'creator cannot approve own event'
);

set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';
select lives_ok(
  $$select public.transition_club_event((select id from public.club_events where title = 'Advanced Robotics Workshop'), 'published', 'Schedule and safety plan verified')$$,
  'a second authorized leader publishes the event'
);
select is((select status from public.club_events where title = 'Advanced Robotics Workshop'), 'published', 'event is published');
select is((select approved_by from public.club_events where title = 'Advanced Robotics Workshop'), 'e2222222-2222-4222-8222-222222222222'::uuid, 'approver is recorded');

set local request.jwt.claim.sub = 'e3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.list_discoverable_events()), 1::bigint, 'student discovers published event');
select is(
  public.register_for_event((select id from public.club_events where title = 'Advanced Robotics Workshop')),
  'registered', 'first student receives the available place'
);
select throws_ok(
  $$select public.register_for_event((select id from public.club_events where title = 'Advanced Robotics Workshop'))$$,
  '23505', null, 'duplicate registration is rejected'
);

set local request.jwt.claim.sub = 'e4444444-4444-4444-8444-444444444444';
select is(
  public.register_for_event((select id from public.club_events where title = 'Advanced Robotics Workshop')),
  'waitlisted', 'capacity overflow joins the waitlist'
);
select is((select registration_status from public.list_discoverable_events()), 'waitlisted', 'student sees personal waitlist status');

set local request.jwt.claim.sub = 'e3333333-3333-4333-8333-333333333333';
select lives_ok(
  $$select public.cancel_event_registration((select id from public.event_registrations where user_id = 'e3333333-3333-4333-8333-333333333333'))$$,
  'confirmed student can cancel registration'
);
set local request.jwt.claim.sub = 'e4444444-4444-4444-8444-444444444444';
select is(
  (select status from public.event_registrations where user_id = 'e4444444-4444-4444-8444-444444444444'),
  'registered', 'oldest waitlisted student is promoted atomically'
);
select set_config(
  'test.event_registration_id',
  (select id::text from public.event_registrations where user_id = 'e4444444-4444-4444-8444-444444444444'),
  true
);

set local request.jwt.claim.sub = 'e5555555-5555-4555-8555-555555555555';
select throws_ok(
  $$select public.mark_event_attendance(
    current_setting('test.event_registration_id')::uuid,
    'attended', 'Attempted unauthorized check-in'
  )$$,
  '42501', null, 'outsider cannot mark attendance'
);

set local request.jwt.claim.sub = 'e2222222-2222-4222-8222-222222222222';
select lives_ok(
  $$select public.mark_event_attendance(
    (select id from public.event_registrations where user_id = 'e4444444-4444-4444-8444-444444444444'),
    'attended', 'Checked in at the event desk'
  )$$,
  'authorized leader marks attendance'
);
select is((select status from public.event_registrations where user_id = 'e4444444-4444-4444-8444-444444444444'), 'attended', 'attendance updates registration');
select lives_ok(
  $$select public.mark_event_attendance(
    (select id from public.event_registrations where user_id = 'e4444444-4444-4444-8444-444444444444'),
    'no_show', 'Corrected after roster reconciliation'
  )$$,
  'authorized attendance correction succeeds'
);
select is((select count(*) from public.attendance_history), 2::bigint, 'every attendance change is retained');

set local request.jwt.claim.sub = 'e5555555-5555-4555-8555-555555555555';
select throws_ok(
  $$insert into public.event_registrations (event_id, user_id, status) values (
    (select id from public.club_events where title = 'Advanced Robotics Workshop'),
    'e5555555-5555-4555-8555-555555555555', 'registered'
  )$$,
  '42501', null, 'direct registration writes are denied'
);

set local role anon;
select throws_ok(
  $$select * from public.list_discoverable_events()$$,
  '42501', null, 'anonymous callers cannot execute event functions'
);

reset role;
select is((select count(*) from public.audit_events where resource_type in ('club_event', 'event_registration')), 6::bigint, 'event lifecycle and attendance changes are audited');

select * from finish();
rollback;
