insert into public.permissions (key, name, description, scope_type) values
  ('club.forms_manage', 'Manage club forms', 'Create and publish versioned club forms.', 'club'),
  ('club.announcements_manage', 'Manage club announcements', 'Create and publish club announcements.', 'club')
on conflict (key) do nothing;
insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id from public.roles role cross join public.permissions permission
where role.is_system and role.key in ('platform_owner','university_admin','club_president')
  and permission.key in ('club.forms_manage','club.announcements_manage')
on conflict (role_id, permission_id) do nothing;

create table public.form_definitions (
  id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs(id) on delete restrict,
  name text not null check (char_length(name) between 3 and 160), purpose text not null check (purpose in ('membership','event_registration','workshop_registration','survey','feedback','administrative_request')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table public.form_versions (
  id uuid primary key default gen_random_uuid(), form_id uuid not null references public.form_definitions(id) on delete restrict,
  version integer not null check (version > 0), schema jsonb not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(), published_at timestamptz,
  unique(form_id, version), check (jsonb_typeof(schema) = 'object')
);
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(), form_id uuid not null references public.form_definitions(id) on delete restrict,
  version_id uuid not null references public.form_versions(id) on delete restrict,
  submitter_id uuid not null references public.profiles(id) on delete restrict,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  submitted_at timestamptz not null default statement_timestamp()
);
create table public.club_tasks (
  id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs(id) on delete restrict,
  team_id uuid references public.teams(id) on delete restrict, title text not null check (char_length(title) between 3 and 180),
  description text check (description is null or char_length(description) <= 5000), assignee_id uuid references public.profiles(id) on delete restrict,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','done','cancelled')),
  due_at timestamptz, created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table public.task_history (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.club_tasks(id) on delete restrict,
  from_status text, to_status text not null, reason text, changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default statement_timestamp()
);
create table public.task_comments (
  id uuid primary key default gen_random_uuid(), task_id uuid not null references public.club_tasks(id) on delete restrict,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 2000), created_at timestamptz not null default statement_timestamp()
);
create table public.club_documents (
  id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 180), category text not null check (category in ('meeting_minutes','club_document','event_attachment','member_file','design_asset','certificate','other')),
  provider text not null check (provider in ('cloudinary','external')), provider_asset_id text not null check (char_length(provider_asset_id) between 3 and 500),
  mime_type text not null check (char_length(mime_type) between 3 and 120), size_bytes bigint not null check (size_bytes between 1 and 52428800),
  visibility text not null default 'members' check (visibility in ('members','managers')),
  status text not null default 'active' check (status in ('active','archived')),
  owner_id uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  unique(provider, provider_asset_id)
);
create table public.announcements (
  id uuid primary key default gen_random_uuid(), club_id uuid not null references public.clubs(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 180), body text not null check (char_length(body) between 5 and 10000),
  audience text not null default 'members' check (audience in ('members','public')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null references public.profiles(id) on delete restrict, published_at timestamptz,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null, title text not null check (char_length(title) between 1 and 180), body text not null check (char_length(body) between 1 and 1000),
  resource_type text, resource_id uuid, read_at timestamptz, created_at timestamptz not null default statement_timestamp()
);

create index form_definitions_club_idx on public.form_definitions(club_id,status);
create index form_submissions_form_idx on public.form_submissions(form_id,submitted_at desc);
create index club_tasks_club_idx on public.club_tasks(club_id,status,due_at);
create index club_documents_club_idx on public.club_documents(club_id,status,created_at desc);
create index announcements_club_idx on public.announcements(club_id,status,published_at desc);
create index notifications_user_idx on public.notifications(user_id,read_at,created_at desc);
create trigger form_definitions_set_updated_at before update on public.form_definitions for each row execute function private.set_updated_at();
create trigger club_tasks_set_updated_at before update on public.club_tasks for each row execute function private.set_updated_at();
create trigger club_documents_set_updated_at before update on public.club_documents for each row execute function private.set_updated_at();
create trigger announcements_set_updated_at before update on public.announcements for each row execute function private.set_updated_at();

alter table public.form_definitions enable row level security; alter table public.form_versions enable row level security;
alter table public.form_submissions enable row level security; alter table public.club_tasks enable row level security;
alter table public.task_history enable row level security; alter table public.task_comments enable row level security;
alter table public.club_documents enable row level security; alter table public.announcements enable row level security;
alter table public.notifications enable row level security;
revoke all on table public.form_definitions, public.form_versions, public.form_submissions, public.club_tasks,
  public.task_history, public.task_comments, public.club_documents, public.announcements, public.notifications from public,anon,authenticated;
grant select on table public.form_definitions, public.form_versions, public.form_submissions, public.club_tasks,
  public.task_history, public.task_comments, public.club_documents, public.announcements, public.notifications to authenticated;

create policy forms_select_access on public.form_definitions for select to authenticated using ((select private.current_user_has_club_access(club_id)));
create policy form_versions_select_access on public.form_versions for select to authenticated using (exists(select 1 from public.form_definitions form where form.id=form_versions.form_id and (select private.current_user_has_club_access(form.club_id))));
create policy submissions_select_access on public.form_submissions for select to authenticated using (submitter_id=(select auth.uid()) or exists(select 1 from public.form_definitions form where form.id=form_submissions.form_id and (select private.has_club_permission(form.club_id,'club.forms_manage'))));
create policy tasks_select_access on public.club_tasks for select to authenticated using ((select private.current_user_has_club_access(club_id)));
create policy task_history_select_access on public.task_history for select to authenticated using (exists(select 1 from public.club_tasks task where task.id=task_history.task_id and (select private.current_user_has_club_access(task.club_id))));
create policy task_comments_select_access on public.task_comments for select to authenticated using (exists(select 1 from public.club_tasks task where task.id=task_comments.task_id and (select private.current_user_has_club_access(task.club_id))));
create policy documents_select_access on public.club_documents for select to authenticated using (
  (visibility='members' and (select private.current_user_has_club_access(club_id))) or (select private.has_club_permission(club_id,'club.documents_manage'))
);
create policy announcements_select_access on public.announcements for select to authenticated using (
  (select private.has_club_permission(club_id,'club.announcements_manage')) or (status='published' and (audience='public' or (select private.current_user_has_club_access(club_id))))
);
create policy notifications_select_own on public.notifications for select to authenticated using (user_id=(select auth.uid()));

create function private.assert_valid_form_schema(form_schema jsonb) returns void language plpgsql immutable set search_path='' as $$
declare field jsonb; field_id text; seen_ids text[] := array[]::text[];
begin
  if jsonb_typeof(form_schema->'fields') <> 'array' or jsonb_array_length(form_schema->'fields') < 1 or jsonb_array_length(form_schema->'fields') > 50 then
    raise exception 'Form must contain between 1 and 50 fields' using errcode='22023';
  end if;
  for field in select value from jsonb_array_elements(form_schema->'fields') loop
    field_id := field->>'id';
    if field_id is null or field_id !~ '^[a-z][a-z0-9_]{0,49}$' or field_id=any(seen_ids)
      or field->>'type' not in ('short_text','long_text','email','phone','number','single_choice','multiple_choice','dropdown','date','consent','file')
      or char_length(coalesce(field->>'label','')) not between 1 and 160 then
      raise exception 'Invalid form field schema' using errcode='22023';
    end if;
    if field->>'type' in ('single_choice','multiple_choice','dropdown') and (jsonb_typeof(field->'options') <> 'array' or jsonb_array_length(field->'options') not between 1 and 100) then
      raise exception 'Choice fields require options' using errcode='22023';
    end if;
    seen_ids := array_append(seen_ids,field_id);
  end loop;
end; $$;

create function private.assert_valid_form_answers(form_schema jsonb, answers jsonb) returns void language plpgsql stable set search_path='' as $$
declare field jsonb; answer jsonb; field_type text; answer_text text; option_value jsonb;
begin
  if jsonb_typeof(answers) <> 'object' then raise exception 'Answers must be an object' using errcode='22023'; end if;
  for field in select value from jsonb_array_elements(form_schema->'fields') loop
    answer := answers->(field->>'id'); field_type := field->>'type'; answer_text := answers->>(field->>'id');
    if coalesce((field->>'required')::boolean,false) and (answer is null or answer='null'::jsonb or answer_text='') then
      raise exception 'Required answer missing: %', field->>'id' using errcode='22023';
    end if;
    if answer is null or answer='null'::jsonb or answer_text='' then continue; end if;
    if field_type in ('short_text','long_text','email','phone','date') and jsonb_typeof(answer)<>'string' then raise exception 'Invalid text answer' using errcode='22023'; end if;
    if field_type='email' and answer_text !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Invalid email answer' using errcode='22023'; end if;
    if field_type='number' and jsonb_typeof(answer)<>'number' then raise exception 'Invalid numeric answer' using errcode='22023'; end if;
    if field_type='consent' and (jsonb_typeof(answer)<>'boolean' or (coalesce((field->>'required')::boolean,false) and answer<>'true'::jsonb)) then raise exception 'Invalid consent answer' using errcode='22023'; end if;
    if field_type in ('single_choice','dropdown') and not (field->'options' @> jsonb_build_array(answer_text)) then raise exception 'Invalid choice answer' using errcode='22023'; end if;
    if field_type='multiple_choice' then
      if jsonb_typeof(answer)<>'array' then raise exception 'Invalid multiple choice answer' using errcode='22023'; end if;
      for option_value in select value from jsonb_array_elements(answer) loop if not (field->'options' @> jsonb_build_array(option_value)) then raise exception 'Invalid multiple choice option' using errcode='22023'; end if; end loop;
    end if;
    if field_type in ('short_text','long_text','email','phone') and (char_length(answer_text)>coalesce((field->>'maxLength')::integer,5000) or char_length(answer_text)<coalesce((field->>'minLength')::integer,0)) then raise exception 'Answer length invalid' using errcode='22023'; end if;
    if field_type='file' and (jsonb_typeof(answer)<>'object' or coalesce((answer->>'size')::bigint,0)>10485760 or answer->>'assetId' is null) then raise exception 'Invalid file metadata' using errcode='22023'; end if;
  end loop;
  if exists(
    select 1 from jsonb_object_keys(answers) as answer_key(key_name)
    where not exists(
      select 1 from jsonb_array_elements(form_schema->'fields') as schema_field(value)
      where schema_field.value->>'id'=answer_key.key_name
    )
  ) then raise exception 'Unknown form answer' using errcode='22023'; end if;
end; $$;

create function private.create_form_version(target_club_id uuid, form_name text, form_purpose text, target_form_id uuid, form_schema jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=(select auth.uid()); created_form_id uuid:=target_form_id; version_number integer;
begin
  if actor_id is null or not (select private.has_club_permission(target_club_id,'club.forms_manage')) then raise exception 'Form management permission required' using errcode='42501'; end if;
  perform private.assert_valid_form_schema(form_schema);
  if created_form_id is null then insert into public.form_definitions(club_id,name,purpose,created_by) values(target_club_id,trim(form_name),form_purpose,actor_id) returning id into created_form_id;
  else
    if not exists(select 1 from public.form_definitions where id=created_form_id and club_id=target_club_id and status<>'archived') then raise exception 'Form not found' using errcode='P0002'; end if;
    update public.form_definitions set name=trim(form_name),purpose=form_purpose,status='draft' where id=created_form_id;
  end if;
  select coalesce(max(version),0)+1 into version_number from public.form_versions where form_id=created_form_id;
  insert into public.form_versions(form_id,version,schema,created_by) values(created_form_id,version_number,form_schema,actor_id);
  return created_form_id;
end; $$;

create function private.publish_form(target_form_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare club_identifier uuid; latest_version_id uuid;
begin
  select club_id into club_identifier from public.form_definitions where id=target_form_id for update;
  if club_identifier is null then raise exception 'Form not found' using errcode='P0002'; end if;
  if not (select private.has_club_permission(club_identifier,'club.forms_manage')) then raise exception 'Form management permission required' using errcode='42501'; end if;
  select id into latest_version_id from public.form_versions where form_id=target_form_id order by version desc limit 1;
  update public.form_versions set published_at=statement_timestamp() where id=latest_version_id;
  update public.form_definitions set status='published' where id=target_form_id;
end; $$;

create function private.submit_form(target_form_id uuid, answers jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=(select auth.uid()); version_record public.form_versions; submission_id uuid;
begin
  if actor_id is null or not (select private.current_user_is_active()) then raise exception 'Authentication required' using errcode='42501'; end if;
  select version.* into version_record from public.form_versions version join public.form_definitions form on form.id=version.form_id
  where form.id=target_form_id and form.status='published' and version.published_at is not null order by version.version desc limit 1;
  if version_record.id is null then raise exception 'Form is not published' using errcode='22023'; end if;
  perform private.assert_valid_form_answers(version_record.schema,answers);
  insert into public.form_submissions(form_id,version_id,submitter_id,answers) values(target_form_id,version_record.id,actor_id,answers) returning id into submission_id;
  return submission_id;
end; $$;

create function private.create_club_task(target_club_id uuid, task_title text, task_description text, assignee_id uuid, priority text, due_at timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=(select auth.uid()); task_id uuid;
begin
 if not (select private.has_club_permission(target_club_id,'club.tasks_manage')) then raise exception 'Task management permission required' using errcode='42501'; end if;
 if assignee_id is not null and not exists(select 1 from public.profiles profile where profile.id=assignee_id and profile.account_status='active') then raise exception 'Active assignee required' using errcode='22023'; end if;
 insert into public.club_tasks(club_id,title,description,assignee_id,priority,due_at,created_by) values(target_club_id,trim(task_title),nullif(trim(task_description),''),assignee_id,priority,due_at,actor_id) returning id into task_id;
 insert into public.task_history(task_id,from_status,to_status,reason,changed_by) values(task_id,null,'todo','Task created',actor_id);
 if assignee_id is not null then insert into public.notifications(user_id,notification_type,title,body,resource_type,resource_id) values(assignee_id,'task.assigned',trim(task_title),'A club task was assigned to you.','club_task',task_id); end if;
 return task_id;
end; $$;

create function private.transition_club_task(target_task_id uuid,new_status text,reason text) returns void language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=(select auth.uid()); task public.club_tasks;
begin
 select * into task from public.club_tasks where id=target_task_id for update;
 if task.id is null then raise exception 'Task not found' using errcode='P0002'; end if;
 if not ((select private.has_club_permission(task.club_id,'club.tasks_manage')) or task.assignee_id=actor_id) then raise exception 'Task permission required' using errcode='42501'; end if;
 if new_status not in ('todo','in_progress','blocked','done','cancelled') or task.status=new_status or char_length(trim(reason))<3 then raise exception 'Invalid task transition' using errcode='22023'; end if;
 update public.club_tasks set status=new_status where id=target_task_id;
 insert into public.task_history(task_id,from_status,to_status,reason,changed_by) values(target_task_id,task.status,new_status,trim(reason),actor_id);
end; $$;

create function private.add_task_comment(target_task_id uuid,comment_body text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=(select auth.uid()); comment_id uuid;
begin
 if not exists(select 1 from public.club_tasks task where task.id=target_task_id and (select private.current_user_has_club_access(task.club_id))) then raise exception 'Task access required' using errcode='42501'; end if;
 insert into public.task_comments(task_id,author_id,body) values(target_task_id,actor_id,trim(comment_body)) returning id into comment_id; return comment_id;
end; $$;

create function private.register_club_document(target_club_id uuid,document_title text,category text,provider text,provider_asset_id text,mime_type text,size_bytes bigint,visibility text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=(select auth.uid()); document_id uuid;
begin
 if not (select private.has_club_permission(target_club_id,'club.documents_manage')) then raise exception 'Document management permission required' using errcode='42501'; end if;
 insert into public.club_documents(club_id,title,category,provider,provider_asset_id,mime_type,size_bytes,visibility,owner_id)
 values(target_club_id,trim(document_title),category,provider,trim(provider_asset_id),trim(mime_type),size_bytes,visibility,actor_id) returning id into document_id; return document_id;
end; $$;
create function private.archive_club_document(target_document_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare club_identifier uuid; begin select club_id into club_identifier from public.club_documents where id=target_document_id for update;
 if not (select private.has_club_permission(club_identifier,'club.documents_manage')) then raise exception 'Document management permission required' using errcode='42501'; end if;
 update public.club_documents set status='archived' where id=target_document_id; end; $$;

create function private.create_announcement(target_club_id uuid,announcement_title text,announcement_body text,audience text)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor_id uuid:=(select auth.uid()); announcement_id uuid;
begin if not (select private.has_club_permission(target_club_id,'club.announcements_manage')) then raise exception 'Announcement management permission required' using errcode='42501'; end if;
 insert into public.announcements(club_id,title,body,audience,created_by) values(target_club_id,trim(announcement_title),trim(announcement_body),audience,actor_id) returning id into announcement_id; return announcement_id; end; $$;
create function private.publish_announcement(target_announcement_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare club_identifier uuid; announcement_record public.announcements;
begin select * into announcement_record from public.announcements where id=target_announcement_id for update; club_identifier:=announcement_record.club_id;
 if announcement_record.id is null then raise exception 'Announcement not found' using errcode='P0002'; end if;
 if not (select private.has_club_permission(club_identifier,'club.announcements_manage')) then raise exception 'Announcement management permission required' using errcode='42501'; end if;
 if announcement_record.status<>'draft' then raise exception 'Announcement is not a draft' using errcode='22023'; end if;
 update public.announcements set status='published',published_at=statement_timestamp() where id=target_announcement_id;
 insert into public.notifications(user_id,notification_type,title,body,resource_type,resource_id)
 select membership.user_id,'announcement.published',announcement_record.title,left(announcement_record.body,1000),'announcement',target_announcement_id
 from public.club_memberships membership where membership.club_id=club_identifier and membership.status='active';
end; $$;
create function private.mark_notification_read(target_notification_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin update public.notifications set read_at=coalesce(read_at,statement_timestamp()) where id=target_notification_id and user_id=(select auth.uid());
 if not found then raise exception 'Notification not found' using errcode='P0002'; end if; end; $$;

create function public.create_form_version(target_club_id uuid,form_name text,form_purpose text,target_form_id uuid,form_schema jsonb) returns uuid language sql security invoker set search_path='' as $$select private.create_form_version(target_club_id,form_name,form_purpose,target_form_id,form_schema)$$;
create function public.publish_form(target_form_id uuid) returns void language sql security invoker set search_path='' as $$select private.publish_form(target_form_id)$$;
create function public.submit_form(target_form_id uuid,answers jsonb) returns uuid language sql security invoker set search_path='' as $$select private.submit_form(target_form_id,answers)$$;
create function public.create_club_task(target_club_id uuid,task_title text,task_description text,assignee_id uuid,priority text,due_at timestamptz) returns uuid language sql security invoker set search_path='' as $$select private.create_club_task(target_club_id,task_title,task_description,assignee_id,priority,due_at)$$;
create function public.transition_club_task(target_task_id uuid,new_status text,reason text) returns void language sql security invoker set search_path='' as $$select private.transition_club_task(target_task_id,new_status,reason)$$;
create function public.add_task_comment(target_task_id uuid,comment_body text) returns uuid language sql security invoker set search_path='' as $$select private.add_task_comment(target_task_id,comment_body)$$;
create function public.register_club_document(target_club_id uuid,document_title text,category text,provider text,provider_asset_id text,mime_type text,size_bytes bigint,visibility text) returns uuid language sql security invoker set search_path='' as $$select private.register_club_document(target_club_id,document_title,category,provider,provider_asset_id,mime_type,size_bytes,visibility)$$;
create function public.archive_club_document(target_document_id uuid) returns void language sql security invoker set search_path='' as $$select private.archive_club_document(target_document_id)$$;
create function public.create_announcement(target_club_id uuid,announcement_title text,announcement_body text,audience text) returns uuid language sql security invoker set search_path='' as $$select private.create_announcement(target_club_id,announcement_title,announcement_body,audience)$$;
create function public.publish_announcement(target_announcement_id uuid) returns void language sql security invoker set search_path='' as $$select private.publish_announcement(target_announcement_id)$$;
create function public.mark_notification_read(target_notification_id uuid) returns void language sql security invoker set search_path='' as $$select private.mark_notification_read(target_notification_id)$$;

revoke execute on all functions in schema private from public,anon;
revoke execute on function public.create_form_version(uuid,text,text,uuid,jsonb),public.publish_form(uuid),public.submit_form(uuid,jsonb),public.create_club_task(uuid,text,text,uuid,text,timestamptz),public.transition_club_task(uuid,text,text),public.add_task_comment(uuid,text),public.register_club_document(uuid,text,text,text,text,text,bigint,text),public.archive_club_document(uuid),public.create_announcement(uuid,text,text,text),public.publish_announcement(uuid),public.mark_notification_read(uuid) from public,anon;
grant execute on function private.create_form_version(uuid,text,text,uuid,jsonb),private.publish_form(uuid),private.submit_form(uuid,jsonb),private.create_club_task(uuid,text,text,uuid,text,timestamptz),private.transition_club_task(uuid,text,text),private.add_task_comment(uuid,text),private.register_club_document(uuid,text,text,text,text,text,bigint,text),private.archive_club_document(uuid),private.create_announcement(uuid,text,text,text),private.publish_announcement(uuid),private.mark_notification_read(uuid) to authenticated;
grant execute on function public.create_form_version(uuid,text,text,uuid,jsonb),public.publish_form(uuid),public.submit_form(uuid,jsonb),public.create_club_task(uuid,text,text,uuid,text,timestamptz),public.transition_club_task(uuid,text,text),public.add_task_comment(uuid,text),public.register_club_document(uuid,text,text,text,text,text,bigint,text),public.archive_club_document(uuid),public.create_announcement(uuid,text,text,text),public.publish_announcement(uuid),public.mark_notification_read(uuid) to authenticated;
