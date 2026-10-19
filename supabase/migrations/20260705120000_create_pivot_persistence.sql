-- PP-05C: Pivot persistence foundation (references, analyses, packages, jobs, cache)

-- ---------------------------------------------------------------------------
-- rights_attestations
-- ---------------------------------------------------------------------------

create table public.rights_attestations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  attestation_version text not null default '1',
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint rights_attestations_version_length check (char_length(attestation_version) between 1 and 32)
);

create index rights_attestations_project_idx on public.rights_attestations (project_id);
create index rights_attestations_owner_idx on public.rights_attestations (owner_id);

alter table public.rights_attestations enable row level security;
alter table public.rights_attestations force row level security;

grant select, insert on table public.rights_attestations to authenticated;

create policy rights_attestations_select_own on public.rights_attestations
for select to authenticated using (owner_id = auth.uid());

create policy rights_attestations_insert_own on public.rights_attestations
for insert to authenticated with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- content_references (Reference entity — avoids SQL reserved word "references")
-- ---------------------------------------------------------------------------

create table public.content_references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reference_kind text not null,
  platform text,
  canonical_url text,
  platform_content_id text,
  title text,
  submitted_at timestamptz not null default now(),
  access_status text not null,
  rights_attestation_id uuid references public.rights_attestations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_references_kind_check check (
    reference_kind in ('youtube_url', 'video_upload', 'audio_upload', 'transcript', 'script')
  ),
  constraint content_references_access_status_check check (
    access_status in ('public', 'restricted', 'unavailable', 'blocked')
  ),
  constraint content_references_platform_check check (
    platform is null or platform in ('youtube')
  )
);

create index content_references_project_submitted_idx
on public.content_references (project_id, submitted_at desc);

create index content_references_owner_idx on public.content_references (owner_id);

create trigger content_references_set_updated_at
before update on public.content_references
for each row execute function public.prompt_pilot_set_updated_at();

alter table public.content_references enable row level security;
alter table public.content_references force row level security;

grant select, insert, update on table public.content_references to authenticated;

create policy content_references_select_own on public.content_references
for select to authenticated using (owner_id = auth.uid());

create policy content_references_insert_own on public.content_references
for insert to authenticated with check (owner_id = auth.uid());

create policy content_references_update_own on public.content_references
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- content_fingerprints
-- ---------------------------------------------------------------------------

create table public.content_fingerprints (
  id uuid primary key default gen_random_uuid(),
  scope_user_id uuid not null references auth.users (id) on delete cascade,
  reference_kind text not null,
  fingerprint_algorithm_version integer not null,
  identity_descriptor text not null,
  fingerprint_inputs jsonb not null,
  state text not null default 'candidate',
  created_at timestamptz not null default now(),
  invalidated_at timestamptz,
  expired_at timestamptz,
  constraint content_fingerprints_state_check check (
    state in ('candidate', 'active', 'invalidated', 'expired')
  ),
  constraint content_fingerprints_algorithm_version_positive check (fingerprint_algorithm_version > 0)
);

create unique index content_fingerprints_scope_identity_active_idx
on public.content_fingerprints (scope_user_id, reference_kind, fingerprint_algorithm_version, identity_descriptor)
where state = 'active';

create index content_fingerprints_scope_user_idx on public.content_fingerprints (scope_user_id);

alter table public.content_fingerprints enable row level security;
alter table public.content_fingerprints force row level security;

grant select, insert, update on table public.content_fingerprints to authenticated;

create policy content_fingerprints_select_own on public.content_fingerprints
for select to authenticated using (scope_user_id = auth.uid());

create policy content_fingerprints_insert_own on public.content_fingerprints
for insert to authenticated with check (scope_user_id = auth.uid());

create policy content_fingerprints_update_own on public.content_fingerprints
for update to authenticated using (scope_user_id = auth.uid()) with check (scope_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reference_analyses
-- ---------------------------------------------------------------------------

create table public.reference_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reference_id uuid not null references public.content_references (id) on delete cascade,
  fingerprint_id uuid not null references public.content_fingerprints (id) on delete restrict,
  pipeline_version text not null,
  analysis_version integer not null,
  is_latest boolean not null default true,
  supersedes_analysis_id uuid references public.reference_analyses (id) on delete set null,
  change_reason text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint reference_analyses_version_positive check (analysis_version > 0),
  constraint reference_analyses_change_reason_check check (
    change_reason in ('initial', 'reanalysis', 'correction')
  ),
  constraint reference_analyses_reference_version_unique unique (reference_id, analysis_version)
);

create index reference_analyses_reference_latest_idx
on public.reference_analyses (reference_id, is_latest)
where is_latest = true;

create index reference_analyses_project_idx on public.reference_analyses (project_id);
create index reference_analyses_owner_idx on public.reference_analyses (owner_id);

alter table public.reference_analyses enable row level security;
alter table public.reference_analyses force row level security;

grant select, insert on table public.reference_analyses to authenticated;

create policy reference_analyses_select_own on public.reference_analyses
for select to authenticated using (owner_id = auth.uid());

create policy reference_analyses_insert_own on public.reference_analyses
for insert to authenticated with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- jobs
-- ---------------------------------------------------------------------------

create table public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reference_id uuid not null references public.content_references (id) on delete cascade,
  state text not null default 'created',
  progress_percent integer not null default 0,
  retry_of_job_id uuid references public.analysis_jobs (id) on delete set null,
  cache_hit boolean,
  failure jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint analysis_jobs_state_check check (
    state in (
      'created', 'validated', 'queued', 'preparing', 'uploading', 'fingerprinting',
      'analyzing', 'generating_packages', 'saving', 'completed',
      'failed', 'cancelled', 'expired', 'retry_pending'
    )
  ),
  constraint analysis_jobs_progress_range check (progress_percent between 0 and 100)
);

create index analysis_jobs_reference_created_idx
on public.analysis_jobs (reference_id, created_at desc);

create index analysis_jobs_project_active_idx
on public.analysis_jobs (project_id, updated_at desc)
where state not in ('completed', 'failed', 'cancelled', 'expired');

create index analysis_jobs_owner_idx on public.analysis_jobs (owner_id);

create trigger analysis_jobs_set_updated_at
before update on public.analysis_jobs
for each row execute function public.prompt_pilot_set_updated_at();

alter table public.analysis_jobs enable row level security;
alter table public.analysis_jobs force row level security;

grant select, insert, update on table public.analysis_jobs to authenticated;

create policy analysis_jobs_select_own on public.analysis_jobs
for select to authenticated using (owner_id = auth.uid());

create policy analysis_jobs_insert_own on public.analysis_jobs
for insert to authenticated with check (owner_id = auth.uid());

create policy analysis_jobs_update_own on public.analysis_jobs
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- job_events
-- ---------------------------------------------------------------------------

create table public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.analysis_jobs (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  stage text not null,
  event_type text not null,
  message text,
  occurred_at timestamptz not null default now(),
  constraint job_events_type_check check (
    event_type in ('stage_entered', 'stage_completed', 'checkpoint', 'warning')
  )
);

create index job_events_job_occurred_idx on public.job_events (job_id, occurred_at asc);

alter table public.job_events enable row level security;
alter table public.job_events force row level security;

grant select, insert on table public.job_events to authenticated;

create policy job_events_select_own on public.job_events
for select to authenticated using (owner_id = auth.uid());

create policy job_events_insert_own on public.job_events
for insert to authenticated with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- packages
-- ---------------------------------------------------------------------------

create table public.content_packages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reference_id uuid not null references public.content_references (id) on delete cascade,
  analysis_id uuid not null references public.reference_analyses (id) on delete cascade,
  analysis_version integer not null,
  package_type text not null,
  package_version integer not null,
  created_by_job_id uuid references public.analysis_jobs (id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint content_packages_type_check check (
    package_type in ('blueprint', 'prompt', 'seo', 'marketing', 'repurposing')
  ),
  constraint content_packages_version_positive check (package_version > 0),
  constraint content_packages_analysis_type_version_unique unique (
    analysis_id, package_type, package_version
  )
);

create index content_packages_analysis_type_idx
on public.content_packages (analysis_id, package_type, package_version desc);

create index content_packages_project_idx on public.content_packages (project_id);

alter table public.content_packages enable row level security;
alter table public.content_packages force row level security;

grant select, insert on table public.content_packages to authenticated;

create policy content_packages_select_own on public.content_packages
for select to authenticated using (owner_id = auth.uid());

create policy content_packages_insert_own on public.content_packages
for insert to authenticated with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- exports
-- ---------------------------------------------------------------------------

create table public.content_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reference_id uuid not null references public.content_references (id) on delete cascade,
  package_ids uuid[] not null,
  format text not null,
  title text not null,
  created_by_user_id uuid not null references auth.users (id) on delete cascade,
  transformation_notice text not null,
  created_at timestamptz not null default now(),
  constraint content_exports_format_check check (format in ('json', 'markdown', 'clipboard_text'))
);

create index content_exports_project_created_idx
on public.content_exports (project_id, created_at desc);

alter table public.content_exports enable row level security;
alter table public.content_exports force row level security;

grant select, insert on table public.content_exports to authenticated;

create policy content_exports_select_own on public.content_exports
for select to authenticated using (owner_id = auth.uid());

create policy content_exports_insert_own on public.content_exports
for insert to authenticated with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- cache_entries
-- ---------------------------------------------------------------------------

create table public.cache_entries (
  cache_key text primary key,
  fingerprint_id uuid not null references public.content_fingerprints (id) on delete cascade,
  analysis_id uuid not null references public.reference_analyses (id) on delete cascade,
  scope_user_id uuid not null references auth.users (id) on delete cascade,
  analysis_version integer not null,
  pipeline_version text not null,
  hit_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_hit_at timestamptz,
  expires_at timestamptz not null,
  invalidated_at timestamptz,
  constraint cache_entries_hit_count_nonnegative check (hit_count >= 0)
);

create index cache_entries_fingerprint_scope_idx
on public.cache_entries (fingerprint_id, scope_user_id)
where invalidated_at is null;

create index cache_entries_expires_idx on public.cache_entries (expires_at)
where invalidated_at is null;

alter table public.cache_entries enable row level security;
alter table public.cache_entries force row level security;

grant select, insert, update on table public.cache_entries to authenticated;

create policy cache_entries_select_own on public.cache_entries
for select to authenticated using (scope_user_id = auth.uid());

create policy cache_entries_insert_own on public.cache_entries
for insert to authenticated with check (scope_user_id = auth.uid());

create policy cache_entries_update_own on public.cache_entries
for update to authenticated using (scope_user_id = auth.uid()) with check (scope_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- workspace_assets
-- ---------------------------------------------------------------------------

create table public.workspace_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reference_id uuid references public.content_references (id) on delete set null,
  storage_locator text not null,
  asset_kind text not null default 'upload',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint workspace_assets_locator_length check (char_length(storage_locator) between 1 and 512)
);

create index workspace_assets_project_expires_idx
on public.workspace_assets (project_id, expires_at);

alter table public.workspace_assets enable row level security;
alter table public.workspace_assets force row level security;

grant select, insert, update on table public.workspace_assets to authenticated;

create policy workspace_assets_select_own on public.workspace_assets
for select to authenticated using (owner_id = auth.uid());

create policy workspace_assets_insert_own on public.workspace_assets
for insert to authenticated with check (owner_id = auth.uid());

create policy workspace_assets_update_own on public.workspace_assets
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- provider_usage
-- ---------------------------------------------------------------------------

create table public.provider_usage (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id uuid references public.analysis_jobs (id) on delete set null,
  provider_id text not null,
  operation text not null,
  units jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index provider_usage_project_created_idx
on public.provider_usage (project_id, created_at desc);

alter table public.provider_usage enable row level security;
alter table public.provider_usage force row level security;

grant select, insert on table public.provider_usage to authenticated;

create policy provider_usage_select_own on public.provider_usage
for select to authenticated using (owner_id = auth.uid());

create policy provider_usage_insert_own on public.provider_usage
for insert to authenticated with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Atomic: set latest analysis version for a reference
-- ---------------------------------------------------------------------------

create or replace function public.prompt_pilot_set_latest_analysis(
  p_project_id uuid,
  p_reference_id uuid,
  p_analysis_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.reference_analyses ra
    where ra.id = p_analysis_id
      and ra.project_id = p_project_id
      and ra.reference_id = p_reference_id
      and ra.owner_id = auth.uid()
  ) then
    raise exception 'analysis not found or inaccessible' using errcode = 'P0002';
  end if;

  update public.reference_analyses
  set is_latest = false
  where reference_id = p_reference_id
    and owner_id = auth.uid()
    and id <> p_analysis_id;

  update public.reference_analyses
  set is_latest = true
  where id = p_analysis_id
    and owner_id = auth.uid();
end;
$$;

revoke all on function public.prompt_pilot_set_latest_analysis(uuid, uuid, uuid) from public;
grant execute on function public.prompt_pilot_set_latest_analysis(uuid, uuid, uuid) to authenticated;

comment on table public.content_references is 'Reference intake artifacts (PP-03 Reference entity).';
comment on table public.reference_analyses is 'Immutable ReferenceVideoAnalysis snapshots.';
comment on table public.content_packages is 'Immutable PackageEnvelope records.';
comment on table public.analysis_jobs is 'Async pipeline Job records.';
