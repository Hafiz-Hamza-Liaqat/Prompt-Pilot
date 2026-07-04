begin;

create extension if not exists pgtap with schema extensions;

select plan(48);

-- 1. All four catalogue tables exist
select ok(
  (
    select count(*) = 4
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'ai_video_providers',
        'ai_video_offerings',
        'ai_video_sources',
        'ai_video_capability_facts'
      )
  ),
  'All four catalogue tables should exist'
);

-- 2. Required columns exist on catalogue tables
select ok(
  (
    select
      exists(
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'ai_video_providers'
          and column_name = 'review_due_at'
      )
      and exists(
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'ai_video_offerings'
          and column_name = 'ownership_type'
      )
      and exists(
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'ai_video_sources'
          and column_name = 'source_kind'
      )
      and exists(
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'ai_video_capability_facts'
          and column_name = 'structured_value'
      )
  ),
  'Required catalogue columns should exist'
);

-- 3. Exactly five provider rows exist
select results_eq(
  $$select count(*)::int from public.ai_video_providers$$,
  $$values (5)$$,
  'Exactly five provider rows should exist'
);

-- 4. Provider IDs match the approved enum
select set_eq(
  $$select id from public.ai_video_providers order by id$$,
  $$values
    ('adobe_firefly'),
    ('google_veo'),
    ('kling'),
    ('openai_sora'),
    ('runway')$$,
  'Provider IDs should match the approved enum'
);

-- 5. No duplicate provider IDs exist
select results_eq(
  $$select count(*)::int from (
      select id, count(*) as row_count
      from public.ai_video_providers
      group by id
      having count(*) > 1
    ) duplicates$$,
  $$values (0)$$,
  'Provider IDs should be unique'
);

-- 6. Every provider has at least one offering
select is_empty(
  $$select p.id
    from public.ai_video_providers p
    left join public.ai_video_offerings o on o.provider_id = p.id
    group by p.id
    having count(o.id) = 0$$,
  'Every provider should have at least one offering'
);

-- 7. Every offering belongs to a valid provider
select is_empty(
  $$select o.id
    from public.ai_video_offerings o
    left join public.ai_video_providers p on p.id = o.provider_id
    where p.id is null$$,
  'Every offering should belong to a valid provider'
);

-- 8. Offering keys are unique per provider
select is_empty(
  $$select provider_id, offering_key
    from public.ai_video_offerings
    group by provider_id, offering_key
    having count(*) > 1$$,
  'Offering keys should be unique per provider'
);

-- 9. Every provider has at least one official source
select is_empty(
  $$select p.id
    from public.ai_video_providers p
    left join public.ai_video_sources s on s.provider_id = p.id
    group by p.id
    having count(s.id) = 0$$,
  'Every provider should have at least one official source'
);

-- 10. Every offering belongs to a provider with official sources
select is_empty(
  $$select o.id
    from public.ai_video_offerings o
    where not exists (
      select 1
      from public.ai_video_sources s
      where s.provider_id = o.provider_id
    )$$,
  'Every offering should belong to a provider with official sources'
);

-- 11. Every capability fact has a source
select is_empty(
  $$select f.id
    from public.ai_video_capability_facts f
    left join public.ai_video_sources s on s.id = f.source_id
    where s.id is null$$,
  'Every capability fact should have a source'
);

-- 12. Source provider matches offering provider for linked sources
select is_empty(
  $$select s.id
    from public.ai_video_sources s
    join public.ai_video_offerings o on o.id = s.offering_id
    where s.provider_id <> o.provider_id$$,
  'Linked source provider should match offering provider'
);

-- 13. HTTPS source constraint works
select throws_ok(
  $$insert into public.ai_video_sources (
      provider_id, source_kind, title, url, verified_at
    ) values (
      'google_veo',
      'developer_docs',
      'Invalid HTTP source',
      'http://ai.google.dev/gemini-api/docs/veo',
      timestamptz '2026-07-04 12:00:00+00'
    )$$,
  '23514',
  null,
  'HTTP source URLs should fail'
);

-- 14. Credential-bearing source URL fails
select throws_ok(
  $$insert into public.ai_video_sources (
      provider_id, source_kind, title, url, verified_at
    ) values (
      'google_veo',
      'developer_docs',
      'Invalid credential source',
      'https://user:secret@ai.google.dev/gemini-api/docs/veo',
      timestamptz '2026-07-04 12:00:00+00'
    )$$,
  '23514',
  null,
  'Credential-bearing source URLs should fail'
);

-- 15. Unknown lifecycle values fail
select throws_ok(
  $$update public.ai_video_providers
      set lifecycle_status = 'beta'
    where id = 'kling'$$,
  '23514',
  null,
  'Unknown lifecycle values should fail'
);

-- 16. Unknown access values fail
select throws_ok(
  $$insert into public.ai_video_offerings (
      provider_id, offering_key, display_name, offering_type, ownership_type,
      summary, lifecycle_status, api_access_status, recommendation_eligible,
      verified_at, review_due_at
    ) values (
      'google_veo',
      'invalid-access',
      'Invalid Access Offering',
      'model',
      'first_party',
      'Offering used to verify invalid API access status rejection.',
      'active',
      'private_beta',
      false,
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23514',
  null,
  'Unknown API access values should fail'
);

-- 17. Unknown support levels fail
select throws_ok(
  $$insert into public.ai_video_capability_facts (
      offering_id, capability_key, support_level, evidence_summary, source_id,
      verified_at, review_due_at
    ) values (
      'a1000001-0001-4001-8001-000000000001',
      'text_to_video',
      'maybe',
      'Invalid support level test evidence.',
      'b1000001-0001-4001-8001-000000000001',
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23514',
  null,
  'Unknown support levels should fail'
);

-- 18. Unknown capability keys fail
select throws_ok(
  $$insert into public.ai_video_capability_facts (
      offering_id, capability_key, support_level, evidence_summary, source_id,
      verified_at, review_due_at
    ) values (
      'a1000001-0001-4001-8001-000000000001',
      'prompt_ranking',
      'supported',
      'Invalid capability key test evidence.',
      'b1000001-0001-4001-8001-000000000001',
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23514',
  null,
  'Unknown capability keys should fail'
);

-- 19. Review due date before verification date fails
select throws_ok(
  $$update public.ai_video_providers
      set verified_at = timestamptz '2026-08-03 12:00:00+00',
          review_due_at = timestamptz '2026-07-04 12:00:00+00'
    where id = 'kling'$$,
  '23514',
  null,
  'Review due date before verification date should fail'
);

-- 20. Sunsetting provider cannot be recommendation eligible
select throws_ok(
  $$update public.ai_video_providers
      set recommendation_eligible = true
    where id = 'openai_sora'$$,
  '23514',
  null,
  'Sunsetting provider should not be recommendation eligible'
);

-- 21. Deprecated offering cannot be recommendation eligible
select throws_ok(
  $$insert into public.ai_video_offerings (
      provider_id, offering_key, display_name, offering_type, ownership_type,
      summary, lifecycle_status, api_access_status, recommendation_eligible,
      verified_at, review_due_at
    ) values (
      'runway',
      'deprecated-test',
      'Deprecated Test Offering',
      'model',
      'first_party',
      'Offering used to verify deprecated recommendation eligibility rejection.',
      'deprecated',
      'public',
      true,
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23514',
  null,
  'Deprecated offering should not be recommendation eligible'
);

-- 22. Unavailable offering cannot be recommendation eligible
select throws_ok(
  $$insert into public.ai_video_offerings (
      provider_id, offering_key, display_name, offering_type, ownership_type,
      summary, lifecycle_status, api_access_status, recommendation_eligible,
      verified_at, review_due_at
    ) values (
      'runway',
      'unavailable-test',
      'Unavailable Test Offering',
      'model',
      'first_party',
      'Offering used to verify unavailable recommendation eligibility rejection.',
      'unavailable',
      'unavailable',
      true,
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23514',
  null,
  'Unavailable offering should not be recommendation eligible'
);

-- 23. Limited capability requires limitation text
select throws_ok(
  $$insert into public.ai_video_capability_facts (
      offering_id, capability_key, support_level, evidence_summary, source_id,
      verified_at, review_due_at
    ) values (
      'a1000001-0001-4001-8001-000000000001',
      'camera_control',
      'limited',
      'Limited capability without limitation text should fail.',
      'b1000001-0001-4001-8001-000000000001',
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23514',
  null,
  'Limited capability should require limitation text'
);

-- 24. Unsupported capability requires evidence
select throws_ok(
  $$insert into public.ai_video_capability_facts (
      offering_id, capability_key, support_level, evidence_summary, source_id,
      verified_at, review_due_at
    ) values (
      'a1000001-0001-4001-8001-000000000001',
      'logo_accuracy',
      'unsupported',
      'Bad',
      'b1000001-0001-4001-8001-000000000001',
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23514',
  null,
  'Unsupported capability should require sufficient evidence text'
);

-- 25. Duplicate offering capability fails
select throws_ok(
  $$insert into public.ai_video_capability_facts (
      offering_id, capability_key, support_level, evidence_summary, source_id,
      verified_at, review_due_at
    ) values (
      'a1000001-0001-4001-8001-000000000001',
      'text_to_video',
      'unknown',
      'Duplicate capability key test evidence.',
      'b1000001-0001-4001-8001-000000000001',
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '23505',
  null,
  'Duplicate offering capability keys should fail'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'catalogue@test.local',
  crypt('password123', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{"display_name":"Catalogue User"}', now(), now()
);

-- 26. Anonymous user can select providers
set local role anon;
select lives_ok(
  $$select count(*) from public.ai_video_providers$$,
  'Anonymous user should select providers'
);

-- 27. Anonymous user can select offerings
select lives_ok(
  $$select count(*) from public.ai_video_offerings$$,
  'Anonymous user should select offerings'
);

-- 28. Anonymous user can select sources
select lives_ok(
  $$select count(*) from public.ai_video_sources$$,
  'Anonymous user should select sources'
);

-- 29. Anonymous user can select capability facts
select lives_ok(
  $$select count(*) from public.ai_video_capability_facts$$,
  'Anonymous user should select capability facts'
);

-- 30. Anonymous insert is denied
select throws_ok(
  $$insert into public.ai_video_providers (
      id, display_name, vendor_name, summary, lifecycle_status, api_access_status,
      recommendation_eligible, verified_at, review_due_at
    ) values (
      'runway',
      'Anon Runway',
      'Runway',
      'Anonymous insert attempt for provider catalogue mutation denial test.',
      'active',
      'public',
      false,
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '42501',
  null,
  'Anonymous insert should be denied'
);

-- 31. Anonymous update is denied
select throws_ok(
  $$update public.ai_video_providers
      set display_name = 'Anon Updated'
    where id = 'runway'$$,
  '42501',
  null,
  'Anonymous update should be denied'
);

-- 32. Anonymous delete is denied
select throws_ok(
  $$delete from public.ai_video_providers where id = 'runway'$$,
  '42501',
  null,
  'Anonymous delete should be denied'
);

-- 33. Authenticated select succeeds
set local role authenticated;
set local request.jwt.claim.sub = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
select lives_ok(
  $$select count(*) from public.ai_video_providers$$,
  'Authenticated user should select providers'
);

-- 34. Authenticated insert is denied
select throws_ok(
  $$insert into public.ai_video_offerings (
      provider_id, offering_key, display_name, offering_type, ownership_type,
      summary, lifecycle_status, api_access_status, recommendation_eligible,
      verified_at, review_due_at
    ) values (
      'runway',
      'auth-insert',
      'Auth Insert Offering',
      'model',
      'first_party',
      'Authenticated insert attempt for provider catalogue mutation denial test.',
      'active',
      'public',
      false,
      timestamptz '2026-07-04 12:00:00+00',
      timestamptz '2026-08-03 12:00:00+00'
    )$$,
  '42501',
  null,
  'Authenticated insert should be denied'
);

-- 35. Authenticated update is denied
select throws_ok(
  $$update public.ai_video_sources
      set title = 'Auth Updated Source'
    where provider_id = 'runway'$$,
  '42501',
  null,
  'Authenticated update should be denied'
);

-- 36. Authenticated delete is denied
select throws_ok(
  $$delete from public.ai_video_capability_facts
    where offering_id = 'a3000001-0001-4001-8001-000000000001'$$,
  '42501',
  null,
  'Authenticated delete should be denied'
);

reset role;

-- 37. OpenAI Sora lifecycle matches researched official state
select results_eq(
  $$select lifecycle_status, api_access_status
     from public.ai_video_providers
     where id = 'openai_sora'$$,
  $$values ('sunsetting'::text, 'sunsetting'::text)$$,
  'OpenAI Sora lifecycle should be sunsetting'
);

-- 38. OpenAI Sora recommendation eligibility is safe
select results_eq(
  $$select recommendation_eligible
     from public.ai_video_providers
     where id = 'openai_sora'$$,
  $$values (false)$$,
  'OpenAI Sora should not be recommendation eligible'
);

-- 39. OpenAI Sora sunset date matches official source
select results_eq(
  $$select sunset_at
     from public.ai_video_providers
     where id = 'openai_sora'$$,
  $$values (timestamptz '2026-09-24 00:00:00+00')$$,
  'OpenAI Sora sunset date should match official source'
);

-- 40. Runway first-party offerings are marked first-party
select is_empty(
  $$select id
     from public.ai_video_offerings
     where provider_id = 'runway'
       and ownership_type <> 'first_party'$$,
  'Runway seeded offerings should be first-party'
);

-- 41. No seeded Runway offering falsely attributes another provider model
select is_empty(
  $$select id
     from public.ai_video_offerings
     where provider_id = 'runway'
       and (
         lower(display_name) like '%google veo%'
         or lower(offering_key) like '%google_veo%'
         or lower(coalesce(official_identifier, '')) like '%veo%'
       )$$,
  'Runway offerings should not falsely attribute other provider models'
);

-- 42. Adobe service offerings may have null official identifiers
select ok(
  (
    select count(*) >= 1
    from public.ai_video_offerings
    where provider_id = 'adobe_firefly'
      and official_identifier is null
  ),
  'Adobe service offerings should allow null official identifiers'
);

-- 43. Every catalogue record contains verification and review dates where required
select ok(
  (
    select
      (select count(*) from public.ai_video_providers
        where verified_at is null or review_due_at is null) = 0
      and (select count(*) from public.ai_video_offerings
        where verified_at is null or review_due_at is null) = 0
      and (select count(*) from public.ai_video_sources
        where verified_at is null) = 0
      and (select count(*) from public.ai_video_capability_facts
        where verified_at is null or review_due_at is null) = 0
  ),
  'Catalogue records should contain required verification and review dates'
);

-- 44. Existing profile SQL tests remain effective
select has_table('public', 'profiles', 'profiles table should remain available for regression');

-- 45. Existing project SQL tests remain effective
select has_table('public', 'projects', 'projects table should remain available for regression');

-- 46. Existing brief SQL tests remain effective
select has_table('public', 'video_briefs', 'video_briefs table should remain available for regression');

-- 47. Existing requirement-parity SQL tests remain effective
select has_function(
  'public',
  'prompt_pilot_video_brief_is_complete',
  array[
    'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text',
    'integer', 'text', 'text', 'text', 'text'
  ],
  'video brief completion helper should remain available for regression'
);

-- 48. Existing completion-RPC tests remain effective
select has_function(
  'public',
  'prompt_pilot_complete_video_brief',
  array['uuid'],
  'video brief completion RPC should remain available for regression'
);

select finish();

rollback;
