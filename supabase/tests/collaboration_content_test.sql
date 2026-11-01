begin;
select plan(26);

insert into auth.users(id,email,raw_user_meta_data) values
 ('c1111111-1111-4111-8111-111111111111','collab-manager@example.test','{"display_name":"Collab Manager"}'),
 ('c2222222-2222-4222-8222-222222222222','collab-member@example.test','{"display_name":"Collab Member"}'),
 ('c3333333-3333-4333-8333-333333333333','collab-outsider@example.test','{"display_name":"Collab Outsider"}');
insert into public.universities(id,name,slug,status,created_by) values('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Collab University','collab-university','active','c1111111-1111-4111-8111-111111111111');
insert into public.clubs(id,university_id,name,slug,description,visibility,status,created_by) values('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Collab Club','collab-club','Collaboration test club.','public','active','c1111111-1111-4111-8111-111111111111');
insert into public.club_role_assignments(club_id,user_id,role_id,assigned_by)
select 'cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','c1111111-1111-4111-8111-111111111111',id,'c1111111-1111-4111-8111-111111111111' from public.roles where key='club_president' and scope_type='club' and is_system;
insert into public.club_memberships(club_id,user_id,status,joined_at,created_by) values('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','c2222222-2222-4222-8222-222222222222','active',statement_timestamp(),'c1111111-1111-4111-8111-111111111111');

set local role authenticated; set local request.jwt.claim.sub='c1111111-1111-4111-8111-111111111111';
select throws_ok($$select public.create_form_version('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','Bad form','survey',null,'{"fields":[]}'::jsonb)$$,'22023',null,'empty form schema is rejected');
select lives_ok($$select public.create_form_version('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','Workshop feedback','feedback',null,'{"fields":[{"id":"rating","type":"number","label":"Rating","required":true},{"id":"comment","type":"long_text","label":"Comment","required":true,"minLength":5,"maxLength":200}]}'::jsonb)$$,'manager creates a versioned form');
select is((select version from public.form_versions),1,'first form version is numbered one');
select lives_ok($$select public.publish_form((select id from public.form_definitions where name='Workshop feedback'))$$,'manager publishes latest form version');

set local request.jwt.claim.sub='c2222222-2222-4222-8222-222222222222';
select throws_ok($$select public.submit_form((select id from public.form_definitions where name='Workshop feedback'),'{"rating":5,"comment":"no"}'::jsonb)$$,'22023',null,'server rejects invalid answer length');
select lives_ok($$select public.submit_form((select id from public.form_definitions where name='Workshop feedback'),'{"rating":5,"comment":"Excellent workshop"}'::jsonb)$$,'member submits validated answers');
select is((select version from public.form_versions version join public.form_submissions submission on submission.version_id=version.id),1,'submission remains linked to exact schema version');
select throws_ok($$update public.form_versions set schema='{}'::jsonb$$,'42501',null,'clients cannot mutate published schemas directly');

set local request.jwt.claim.sub='c1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_club_task('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','Prepare event brief','Draft the event operations brief.','c2222222-2222-4222-8222-222222222222','high',statement_timestamp()+interval '5 days')$$,'manager creates and assigns a task');
set local request.jwt.claim.sub='c2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.notifications where notification_type='task.assigned'),1::bigint,'assignment creates an in-app notification');

select lives_ok($$select public.transition_club_task((select id from public.club_tasks where title='Prepare event brief'),'in_progress','Started the assigned work')$$,'assignee changes own task status');
select lives_ok($$select public.add_task_comment((select id from public.club_tasks where title='Prepare event brief'),'Initial outline is ready.')$$,'club member comments on a visible task');
select is((select count(*) from public.task_history),2::bigint,'task lifecycle history is retained');

set local request.jwt.claim.sub='c3333333-3333-4333-8333-333333333333';
select throws_ok($$select public.transition_club_task((select id from public.club_tasks where title='Prepare event brief'),'done','Unauthorized completion')$$,'P0002',null,'RLS hides task identifier from outsider lookup');

set local request.jwt.claim.sub='c1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.register_club_document('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','Meeting minutes','meeting_minutes','cloudinary','private/minutes-001','application/pdf',2048,'members')$$,'manager registers protected document metadata');
select is((select status from public.club_documents where title='Meeting minutes'),'active','document metadata starts active');

set local request.jwt.claim.sub='c2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.club_documents where title='Meeting minutes'),1::bigint,'active member reads member document metadata');
set local request.jwt.claim.sub='c3333333-3333-4333-8333-333333333333';
select is((select count(*) from public.club_documents),0::bigint,'outsider cannot read protected document metadata');

set local request.jwt.claim.sub='c1111111-1111-4111-8111-111111111111';
select lives_ok($$select public.create_announcement('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','Workshop reminder','The workshop starts tomorrow at ten.','members')$$,'manager creates announcement draft');
select lives_ok($$select public.publish_announcement((select id from public.announcements where title='Workshop reminder'))$$,'manager publishes announcement');
set local request.jwt.claim.sub='c2222222-2222-4222-8222-222222222222';
select is((select count(*) from public.notifications where notification_type='announcement.published'),1::bigint,'published announcement notifies active members');

select is((select count(*) from public.announcements where status='published'),1::bigint,'member reads published announcement');
select lives_ok($$select public.mark_notification_read((select id from public.notifications where notification_type='announcement.published'))$$,'recipient marks notification read');
select ok((select bool_and(read_at is not null) from public.notifications where user_id='c2222222-2222-4222-8222-222222222222' and notification_type='announcement.published'),'read timestamp is stored');
select throws_ok($$insert into public.notifications(user_id,notification_type,title,body) values('c2222222-2222-4222-8222-222222222222','fake','Fake','Injected')$$,'42501',null,'clients cannot forge notifications');

set local role anon;
select throws_ok($$select public.submit_form(gen_random_uuid(),'{}'::jsonb)$$,'42501',null,'anonymous callers cannot submit forms');
select * from finish(); rollback;
