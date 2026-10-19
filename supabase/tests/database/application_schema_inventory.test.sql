begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

select is(
  (
    select count(*)::integer
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  ),
  19,
  'Exactly nineteen application-owned public tables exist'
);

select tables_are(
  'public',
  array[
    'ai_video_capability_facts',
    'ai_video_offerings',
    'ai_video_providers',
    'ai_video_sources',
    'analysis_jobs',
    'cache_entries',
    'content_exports',
    'content_fingerprints',
    'content_packages',
    'content_references',
    'job_events',
    'profiles',
    'projects',
    'provider_usage',
    'reference_analyses',
    'reference_intake_payloads',
    'rights_attestations',
    'video_briefs',
    'workspace_assets'
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

select has_table('public', 'content_references', 'PP-05C content_references table exists');
select has_table('public', 'reference_intake_payloads', 'PP-11 Slice 4A reference_intake_payloads table exists');
select has_table('public', 'reference_analyses', 'PP-05C reference_analyses table exists');
select has_table('public', 'content_packages', 'PP-05C content_packages table exists');
select has_table('public', 'analysis_jobs', 'PP-05C analysis_jobs table exists');
select has_table('public', 'cache_entries', 'PP-05C cache_entries table exists');

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

select has_function(
  'public',
  'prompt_pilot_set_latest_analysis',
  array['uuid', 'uuid', 'uuid'],
  'prompt_pilot_set_latest_analysis RPC exists for analysis versioning'
);

select * from finish();

rollback;
