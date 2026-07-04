begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rpc-a@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"RPC A"}', now(), now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'rpc-b@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"RPC B"}', now(), now()
  );

insert into public.projects (owner_id, title) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'RPC Project A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'RPC Project B');

insert into public.video_briefs (
  project_id, source_type, source_text, working_title, objective, target_audience,
  publishing_destination, aspect_ratio, video_category, duration_seconds, visual_style, tone,
  budget_priority, quality_priority
) values
  (
    (select id from public.projects where title = 'RPC Project A' limit 1),
    'idea',
    'A compelling RPC regression concept for urban professionals.',
    'RPC Launch',
    'Showcase the new product line to young professionals seeking quality.',
    'Urban professionals aged 25-35',
    'youtube',
    '16:9',
    'product_advertisement',
    30,
    'Cinematic',
    'Upbeat',
    'balanced',
    'highest_quality'
  ),
  (
    (select id from public.projects where title = 'RPC Project B' limit 1),
    'idea',
    'Another compelling RPC regression concept for urban professionals.',
    'RPC Beta',
    'Showcase the new product line to young professionals seeking quality.',
    'Urban professionals aged 25-35',
    'youtube',
    '16:9',
    'product_advertisement',
    30,
    'Cinematic',
    'Upbeat',
    'balanced',
    'highest_quality'
  );

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select lives_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'RPC Project A' limit 1)
    )$$,
  'complete valid brief A succeeds'
);

select lives_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'RPC Project A' limit 1)
    )$$,
  'repeated completion is idempotent'
);

select is(
  pg_catalog.current_setting('prompt_pilot.completing_brief', true),
  '',
  'completion flag is inactive after successful completion'
);

update public.video_briefs vb
set working_title = 'RPC Launch Updated'
from public.projects p
where p.id = vb.project_id
  and p.title = 'RPC Project A';

select is_empty(
  $$select * from public.video_briefs vb
    join public.projects p on p.id = vb.project_id
    where p.title = 'RPC Project A'
      and vb.completed_at is not null$$,
  'content update after completion reopens the brief'
);

select lives_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'RPC Project A' limit 1)
    )$$,
  're-completing after valid edit succeeds'
);

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select throws_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'RPC Project A' limit 1)
    )$$,
  'P0002',
  null,
  'user B cannot complete user A brief'
);

set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

update public.projects
set archived_at = now()
where title = 'RPC Project A';

select throws_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'RPC Project A' limit 1)
    )$$,
  'P0002',
  null,
  'archived-project completion remains blocked'
);

update public.projects
set archived_at = null
where title = 'RPC Project A';

select throws_ok(
  $$update public.video_briefs vb
    set completed_at = now()
    from public.projects p
    where p.id = vb.project_id
      and p.title = 'RPC Project A'$$,
  '42501',
  null,
  'authenticated user cannot directly set completed_at'
);

set local role anon;

select throws_ok(
  $$select public.prompt_pilot_complete_video_brief(
      (select id from public.projects where title = 'RPC Project B' limit 1)
    )$$,
  '42501',
  null,
  'unauthenticated user cannot execute completion'
);

select * from finish();

rollback;
