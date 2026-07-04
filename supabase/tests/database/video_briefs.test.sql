begin;

create extension if not exists pgtap with schema extensions;

select plan(52);

select has_table('public', 'video_briefs', 'public.video_briefs should exist');

select has_column('public', 'video_briefs', 'project_id', 'video_briefs.project_id should exist');
select has_column('public', 'video_briefs', 'source_type', 'video_briefs.source_type should exist');
select has_column('public', 'video_briefs', 'completed_at', 'video_briefs.completed_at should exist');
select has_column('public', 'video_briefs', 'requires_voiceover', 'video_briefs.requires_voiceover should exist');

select fk_ok(
  'public',
  'video_briefs',
  array['project_id'],
  'public',
  'projects',
  array['id'],
  'video_briefs.project_id should reference public.projects.id'
);

select ok(
  (
    select confdeltype = 'c'
    from pg_constraint
    where conname = 'video_briefs_project_id_fkey'
  ),
  'project hard deletion cascades to video briefs'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.video_briefs'::regclass),
  'RLS should be enabled on video_briefs'
);

select ok(
  (select relforcerowsecurity from pg_class where oid = 'public.video_briefs'::regclass),
  'RLS should be forced on video_briefs'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'brief-a@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Brief A"}', now(), now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'brief-b@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Brief B"}', now(), now()
  );

insert into public.projects (owner_id, title) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Brief Project A'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Brief Project C'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Brief Project B');

set local role anon;

select throws_ok(
  'select * from public.video_briefs',
  '42501',
  null,
  'anon should not select video briefs'
);

select throws_ok(
  $$insert into public.video_briefs (project_id, source_type, source_text)
    values (
      (select id from public.projects where title = 'Brief Project A' limit 1),
      'idea',
      'A compelling summer product launch concept for urban professionals.'
    )$$,
  '42501',
  null,
  'anon should not insert video briefs'
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select lives_ok(
  $$insert into public.video_briefs (project_id, source_type, source_text)
    values (
      (select id from public.projects where title = 'Brief Project A' limit 1),
      'idea',
      'A compelling summer product launch concept for urban professionals.'
    )$$,
  'user A can insert a brief for own active project'
);

select throws_ok(
  $$insert into public.video_briefs (project_id, source_type, source_text)
    values (
      (select id from public.projects where title = 'Brief Project B' limit 1),
      'idea',
      'A compelling summer product launch concept for urban professionals.'
    )$$,
  '42501',
  null,
  'user A cannot insert for user B project'
);

update public.projects
set archived_at = now()
where title = 'Brief Project C';

select throws_ok(
  $$insert into public.video_briefs (project_id, source_type, source_text)
    values (
      (select id from public.projects where title = 'Brief Project C' limit 1),
      'idea',
      'Another compelling summer product launch concept for urban professionals.'
    )$$,
  '42501',
  null,
  'user A cannot insert for archived project'
);

update public.projects
set archived_at = null
where title = 'Brief Project C';

select public.prompt_pilot_soft_delete_project(
  (select id from public.projects where title = 'Brief Project C' limit 1)
);

select throws_ok(
  $$insert into public.video_briefs (project_id, source_type, source_text)
    values (
      (select id from public.projects where title = 'Brief Project C' limit 1),
      'idea',
      'Another compelling summer product launch concept for urban professionals.'
    )$$,
  '42501',
  null,
  'user A cannot insert for soft-deleted project'
);

reset role;

update public.projects
set deleted_at = null
where title = 'Brief Project C';

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.video_briefs (project_id, source_type, source_text)
values (
  (select id from public.projects where title = 'Brief Project C' limit 1),
  'idea',
  'A compelling cascade test concept for urban professionals.'
);

reset role;

delete from public.projects where title = 'Brief Project C';

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select results_eq(
  $$select count(*)::int from public.video_briefs
    where source_text = 'A compelling cascade test concept for urban professionals.'$$,
  $$values (0)$$,
  'project hard deletion cascades brief rows'
);

select isnt_empty(
  $$select * from public.video_briefs vb
    join public.projects p on p.id = vb.project_id
    where p.owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
      and p.title = 'Brief Project A'$$,
  'user A can read own active-project brief'
);

update public.projects
set archived_at = now()
where title = 'Brief Project A';

select isnt_empty(
  $$select * from public.video_briefs vb
    join public.projects p on p.id = vb.project_id
    where p.owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
      and p.title = 'Brief Project A'$$,
  'user A can read own archived-project brief'
);

update public.projects
set archived_at = null
where title = 'Brief Project A';

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

insert into public.video_briefs (project_id, source_type, source_text)
values (
  (select id from public.projects where title = 'Brief Project B' limit 1),
  'idea',
  'A compelling winter product launch concept for urban professionals.'
);

set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is_empty(
  $$select * from public.video_briefs vb
    join public.projects p on p.id = vb.project_id
    where p.owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid$$,
  'user A cannot read user B brief'
);

select lives_ok(
  $$update public.video_briefs vb
    set working_title = 'Summer Launch'
    from public.projects p
    where p.id = vb.project_id
      and p.title = 'Brief Project A'$$,
  'user A can update own active-project brief'
);

select results_eq(
  $$with updated as (
      update public.video_briefs vb
      set working_title = 'Hacked'
      from public.projects p
      where p.id = vb.project_id
        and p.owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
      returning 1
    ) select count(*)::int from updated$$,
  $$values (0)$$,
  'user A cannot update user B brief'
);

update public.projects
set archived_at = now()
where title = 'Brief Project A';

select results_eq(
  $$with updated as (
      update public.video_briefs vb
      set working_title = 'Blocked'
      from public.projects p
      where p.id = vb.project_id
        and p.title = 'Brief Project A'
      returning 1
    ) select count(*)::int from updated$$,
  $$values (0)$$,
  'user A cannot update archived-project brief'
);

update public.projects
set archived_at = null
where title = 'Brief Project A';

select public.prompt_pilot_soft_delete_project(
  (select id from public.projects where title = 'Brief Project A' limit 1)
);

select results_eq(
  $$with updated as (
      update public.video_briefs vb
      set working_title = 'Blocked'
      from public.projects p
      where p.id = vb.project_id
        and p.title = 'Brief Project A'
      returning 1
    ) select count(*)::int from updated$$,
  $$values (0)$$,
  'user A cannot update soft-deleted-project brief'
);

reset role;

update public.projects
set deleted_at = null
where title = 'Brief Project A';

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select throws_ok(
  $$update public.video_briefs vb
    set project_id = (select id from public.projects where title = 'Brief Project B' limit 1)
    from public.projects p
    where p.id = vb.project_id
      and p.title = 'Brief Project A'$$,
  '42501',
  null,
  'project_id cannot be reassigned'
);

select throws_ok(
  $$update public.video_briefs vb
    set completed_at = now()
    from public.projects p
    where p.id = vb.project_id
      and p.title = 'Brief Project A'$$,
  '42501',
  null,
  'direct completed_at update is denied'
);

reset role;

select throws_ok(
  $$update public.video_briefs
    set source_type = 'template'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid source type fails'
);

select throws_ok(
  $$update public.video_briefs
    set source_text = 'short'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'short idea fails'
);

select throws_ok(
  $$update public.video_briefs
    set source_type = 'script',
        source_text = repeat('s', 20001),
        source_url = null
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'overlong script fails'
);

update public.video_briefs
set source_type = 'idea',
    source_text = 'A compelling summer product launch concept for urban professionals.',
    source_url = null
where project_id = (select id from public.projects where title = 'Brief Project A' limit 1);

select throws_ok(
  $$update public.video_briefs
    set source_type = 'product_url',
        source_text = null,
        source_url = 'ftp://example.com/product'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid URL format fails'
);

select throws_ok(
  $$update public.video_briefs
    set source_text = 'A compelling summer product launch concept for urban professionals.',
        source_url = 'https://example.com/product'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'source text and URL inconsistency fails'
);

select throws_ok(
  $$update public.video_briefs
    set publishing_destination = 'snapchat'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid destination fails'
);

select throws_ok(
  $$update public.video_briefs
    set aspect_ratio = '21:9'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid aspect ratio fails'
);

select throws_ok(
  $$update public.video_briefs
    set video_category = 'music_video'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid category fails'
);

select throws_ok(
  $$update public.video_briefs
    set duration_seconds = 4
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid duration fails'
);

select throws_ok(
  $$update public.video_briefs
    set budget_priority = 'cheapest'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid budget priority fails'
);

select throws_ok(
  $$update public.video_briefs
    set quality_priority = 'premium'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'invalid quality priority fails'
);

select throws_ok(
  $$update public.video_briefs
    set user_constraints = repeat('c', 2001)
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'overlong user constraints fail'
);

select throws_ok(
  $$update public.video_briefs
    set working_title = 'Bad' || chr(7) || 'Title'
    where project_id = (select id from public.projects where title = 'Brief Project A' limit 1)$$,
  '23514',
  null,
  'unsafe control characters fail'
);

select throws_ok(
  $$insert into public.video_briefs (project_id, source_type, source_text)
    values (
      (select id from public.projects where title = 'Brief Project A' limit 1),
      'idea',
      'Another compelling summer product launch concept for urban professionals.'
    )$$,
  '23505',
  null,
  'one brief per project is enforced'
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select throws_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  '23514',
  null,
  'incomplete brief cannot be completed'
);

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select throws_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  'P0002',
  null,
  'user B cannot complete user A brief'
);

set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

update public.video_briefs vb
set
  working_title = 'Summer Launch',
  objective = 'Showcase the new product line to young professionals seeking quality.',
  target_audience = 'Urban professionals aged 25-35',
  publishing_destination = 'youtube',
  aspect_ratio = '16:9',
  video_category = 'product_advertisement',
  duration_seconds = 30,
  visual_style = 'Cinematic',
  tone = 'Upbeat',
  budget_priority = 'balanced',
  quality_priority = 'highest_quality',
  requires_voiceover = true,
  requires_commercial_use = true
from public.projects p
where p.id = vb.project_id
  and p.title = 'Brief Project A';

update public.projects
set archived_at = now()
where title = 'Brief Project A';

select throws_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  'P0002',
  null,
  'archived-project brief cannot be completed'
);

update public.projects
set archived_at = null
where title = 'Brief Project A';

select public.prompt_pilot_soft_delete_project(
  (select id from public.projects where title = 'Brief Project A' limit 1)
);

select throws_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  'P0002',
  null,
  'soft-deleted-project brief cannot be completed'
);

reset role;

update public.projects
set deleted_at = null
where title = 'Brief Project A';

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select lives_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  'complete valid brief can be completed'
);

select lives_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  'completing twice is safe'
);

select isnt_empty(
  $$select * from public.video_briefs vb
    join public.projects p on p.id = vb.project_id
    where p.title = 'Brief Project A'
      and vb.completed_at is not null$$,
  'completed brief stores completed_at'
);

update public.video_briefs vb
set working_title = 'Summer Launch Updated'
from public.projects p
where p.id = vb.project_id
  and p.title = 'Brief Project A';

select is_empty(
  $$select * from public.video_briefs vb
    join public.projects p on p.id = vb.project_id
    where p.title = 'Brief Project A'
      and vb.completed_at is not null$$,
  'editing completed content clears completed_at'
);

select ok(
  not has_table_privilege('authenticated', 'public.video_briefs', 'DELETE'),
  'authenticated role has no SQL DELETE privilege on video_briefs'
);

select results_eq(
  $$select count(*)::int from public.profiles
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  $$values (1)$$,
  'profile trigger still creates profiles'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.projects'::regclass),
  'projects RLS remains enabled'
);

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select throws_ok(
  $$select public.prompt_pilot_soft_delete_project(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  'P0002',
  null,
  'user B cannot soft delete user A project'
);

set local role anon;

select throws_ok(
  $$select public.prompt_pilot_soft_delete_project(
      (select id from public.projects where title = 'Brief Project A' limit 1)
    )$$,
  '42501',
  null,
  'unauthenticated soft delete RPC execution fails'
);

select * from finish();

rollback;
