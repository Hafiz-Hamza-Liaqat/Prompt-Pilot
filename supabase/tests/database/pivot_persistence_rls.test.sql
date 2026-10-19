begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'pivot-a@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Pivot A"}', now(), now()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'pivot-b@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Pivot B"}', now(), now()
  );

insert into public.projects (id, owner_id, title)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Pivot Project A'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Pivot Project B');

set local role authenticated;
set local request.jwt.claim.sub = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

insert into public.content_references (
  id, project_id, owner_id, reference_kind, access_status, canonical_url
) values (
  '11111111-1111-1111-1111-111111111111',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'youtube_url',
  'public',
  'https://www.youtube.com/watch?v=test-a'
);

select ok(
  (
    select count(*) = 1
    from public.content_references
    where id = '11111111-1111-1111-1111-111111111111'
  ),
  'owner can read own content reference'
);

set local request.jwt.claim.sub = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select ok(
  (
    select count(*) = 0
    from public.content_references
    where id = '11111111-1111-1111-1111-111111111111'
  ),
  'foreign user cannot read content reference'
);

select throws_ok(
  $$insert into public.content_references (
      id, project_id, owner_id, reference_kind, access_status
    ) values (
      '22222222-2222-2222-2222-222222222222',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'youtube_url',
      'public'
    )$$,
  '42501',
  null,
  'foreign user cannot insert into another owner project'
);

set local request.jwt.claim.sub = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

insert into public.content_fingerprints (
  id, scope_user_id, reference_kind, fingerprint_algorithm_version,
  identity_descriptor, fingerprint_inputs, state
) values (
  '33333333-3333-3333-3333-333333333333',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'youtube_url',
  1,
  'canonical-url:https://www.youtube.com/watch?v=test-a',
  '[{"factor":"canonical_url","descriptor":"https://www.youtube.com/watch?v=test-a"}]'::jsonb,
  'active'
);

insert into public.reference_analyses (
  id, project_id, owner_id, reference_id, fingerprint_id,
  pipeline_version, analysis_version, is_latest, change_reason, payload
) values (
  '44444444-4444-4444-4444-444444444444',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '1.0.0',
  1,
  true,
  'initial',
  '{"analysisId":"44444444-4444-4444-4444-444444444444"}'::jsonb
);

select ok(
  (
    select count(*) = 1
    from public.reference_analyses
    where id = '44444444-4444-4444-4444-444444444444'
  ),
  'owner can read own reference analysis'
);

set local request.jwt.claim.sub = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select ok(
  (
    select count(*) = 0
    from public.reference_analyses
    where id = '44444444-4444-4444-4444-444444444444'
  ),
  'foreign user cannot read reference analysis'
);

set local request.jwt.claim.sub = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

insert into public.analysis_jobs (
  id, project_id, owner_id, reference_id, state, progress_percent
) values (
  '55555555-5555-5555-5555-555555555555',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'queued',
  10
);

select ok(
  (
    select count(*) = 1
    from public.analysis_jobs
    where id = '55555555-5555-5555-5555-555555555555'
  ),
  'owner can read own analysis job'
);

set local request.jwt.claim.sub = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

select ok(
  (
    select count(*) = 0
    from public.analysis_jobs
    where id = '55555555-5555-5555-5555-555555555555'
  ),
  'foreign user cannot read analysis job'
);

select ok(
  (
    select relrowsecurity from pg_class where oid = 'public.content_references'::regclass
  ),
  'RLS enabled on content_references'
);

select ok(
  (
    select relforcerowsecurity from pg_class where oid = 'public.reference_analyses'::regclass
  ),
  'RLS forced on reference_analyses'
);

select ok(
  (
    select relrowsecurity from pg_class where oid = 'public.cache_entries'::regclass
  ),
  'RLS enabled on cache_entries'
);

select * from finish();

rollback;
