begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  ),
  7,
  'Exactly seven application-owned public tables exist'
);

select tables_are(
  'public',
  array[
    'ai_video_capability_facts',
    'ai_video_offerings',
    'ai_video_providers',
    'ai_video_sources',
    'profiles',
    'projects',
    'video_briefs'
  ],
  'Application-owned table names match the approved set'
);

select hasnt_table('public', 'scenes', 'No scenes table exists');
select hasnt_table('public', 'scene_plans', 'No scene_plans table exists');
select hasnt_table('public', 'video_plans', 'No video_plans table exists');
select hasnt_table('public', 'recommendations', 'No recommendations table exists');
select hasnt_table('public', 'provider_recommendations', 'No provider_recommendations table exists');
select hasnt_table('public', 'result_workspaces', 'No result_workspaces table exists');
select hasnt_table('public', 'prompt_outputs', 'No prompt_outputs table exists');

select has_table('public', 'profiles', 'Phase 4 profiles table remains present');
select has_table('public', 'projects', 'Phase 5 projects table remains present');
select has_table('public', 'video_briefs', 'Phase 6 video_briefs table remains present');
select has_table('public', 'ai_video_providers', 'Phase 7 ai_video_providers table remains present');

select ok(
  (
    select count(*) = 0
    from information_schema.tables
    where table_schema = 'public'
      and table_type in ('VIEW', 'MATERIALIZED VIEW')
  ),
  'Application functions and views are not counted as tables'
);

select has_function(
  'public',
  'prompt_pilot_soft_delete_project',
  array['uuid'],
  'prompt_pilot_soft_delete_project RPC remains present'
);

select has_function(
  'public',
  'prompt_pilot_complete_video_brief',
  array['uuid'],
  'prompt_pilot_complete_video_brief RPC remains present'
);

select * from finish();

rollback;
