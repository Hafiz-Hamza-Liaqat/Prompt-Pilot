-- Prompt Pilot Phase 7: provider catalogue schema

create or replace function public.prompt_pilot_catalogue_is_https_url(p_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_url is not null
    and char_length(p_url) <= 2048
    and p_url ~* '^https://'
    and p_url !~ '://[^/]*@'
    and p_url !~ '[[:cntrl:]]';
$$;

create or replace function public.prompt_pilot_catalogue_is_machine_safe_key(p_key text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_key ~ '^[a-z0-9]+(?:[-_][a-z0-9]+)*$';
$$;

create or replace function public.prompt_pilot_catalogue_is_provider_id(p_id text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_id in (
    'google_veo',
    'openai_sora',
    'runway',
    'kling',
    'adobe_firefly'
  );
$$;

create or replace function public.prompt_pilot_catalogue_is_lifecycle_status(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in (
    'active',
    'preview',
    'limited',
    'sunsetting',
    'deprecated',
    'unavailable',
    'unknown'
  );
$$;

create or replace function public.prompt_pilot_catalogue_is_api_access_status(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_status in (
    'public',
    'preview',
    'limited',
    'enterprise',
    'sunsetting',
    'unavailable',
    'unknown'
  );
$$;

create or replace function public.prompt_pilot_catalogue_is_offering_type(p_type text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_type in ('model', 'model_family', 'api_service', 'platform_service');
$$;

create or replace function public.prompt_pilot_catalogue_is_ownership_type(p_type text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_type in ('first_party', 'third_party_hosted');
$$;

create or replace function public.prompt_pilot_catalogue_is_support_level(p_level text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_level in ('supported', 'limited', 'unsupported', 'unknown');
$$;

create or replace function public.prompt_pilot_catalogue_is_source_kind(p_kind text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_kind in (
    'developer_docs',
    'api_reference',
    'help_center',
    'release_notes',
    'model_docs',
    'pricing'
  );
$$;

create or replace function public.prompt_pilot_catalogue_is_capability_key(p_key text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_key in (
    'text_to_video',
    'image_to_video',
    'video_to_video',
    'native_audio',
    'dialogue',
    'voiceover',
    'lip_sync',
    'character_consistency',
    'product_consistency',
    'logo_accuracy',
    'exact_text_visibility',
    'multiple_locations',
    'camera_control',
    'first_frame_control',
    'last_frame_control',
    'video_extension',
    'reference_images',
    'commercial_use',
    'max_duration_seconds',
    'supported_aspect_ratios',
    'supported_resolutions'
  );
$$;

create or replace function public.prompt_pilot_catalogue_recommendation_allowed(
  p_lifecycle text,
  p_recommendation_eligible boolean
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    not p_recommendation_eligible
    or p_lifecycle not in ('sunsetting', 'deprecated', 'unavailable');
$$;

create table public.ai_video_providers (
  id text primary key,
  display_name text not null,
  vendor_name text not null,
  summary text not null,
  lifecycle_status text not null,
  api_access_status text not null,
  recommendation_eligible boolean not null default false,
  sunset_at timestamptz,
  catalogue_notice text,
  verified_at timestamptz not null,
  review_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_video_providers_id_check check (public.prompt_pilot_catalogue_is_provider_id(id)),
  constraint ai_video_providers_display_name_length check (
    char_length(display_name) >= 2 and char_length(display_name) <= 80
  ),
  constraint ai_video_providers_vendor_name_length check (
    char_length(vendor_name) >= 2 and char_length(vendor_name) <= 80
  ),
  constraint ai_video_providers_summary_length check (
    char_length(summary) >= 10 and char_length(summary) <= 600
  ),
  constraint ai_video_providers_notice_length check (
    catalogue_notice is null or char_length(catalogue_notice) <= 1000
  ),
  constraint ai_video_providers_lifecycle_check check (
    public.prompt_pilot_catalogue_is_lifecycle_status(lifecycle_status)
  ),
  constraint ai_video_providers_api_access_check check (
    public.prompt_pilot_catalogue_is_api_access_status(api_access_status)
  ),
  constraint ai_video_providers_review_dates check (review_due_at > verified_at),
  constraint ai_video_providers_recommendation_check check (
    public.prompt_pilot_catalogue_recommendation_allowed(lifecycle_status, recommendation_eligible)
  ),
  constraint ai_video_providers_display_name_safe check (display_name !~ '[[:cntrl:]]'),
  constraint ai_video_providers_vendor_name_safe check (vendor_name !~ '[[:cntrl:]]'),
  constraint ai_video_providers_summary_safe check (summary !~ '[[:cntrl:]]'),
  constraint ai_video_providers_notice_safe check (
    catalogue_notice is null or catalogue_notice !~ '[[:cntrl:]]'
  )
);

comment on table public.ai_video_providers is
  'Read-only catalogue of approved Prompt Pilot AI video providers.';

create table public.ai_video_offerings (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.ai_video_providers (id) on delete cascade,
  offering_key text not null,
  display_name text not null,
  offering_type text not null,
  ownership_type text not null,
  official_identifier text,
  summary text not null,
  lifecycle_status text not null,
  api_access_status text not null,
  recommendation_eligible boolean not null default false,
  sunset_at timestamptz,
  verified_at timestamptz not null,
  review_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_video_offerings_provider_key_unique unique (provider_id, offering_key),
  constraint ai_video_offerings_key_machine_safe check (
    public.prompt_pilot_catalogue_is_machine_safe_key(offering_key)
  ),
  constraint ai_video_offerings_display_name_length check (
    char_length(display_name) >= 2 and char_length(display_name) <= 120
  ),
  constraint ai_video_offerings_summary_length check (
    char_length(summary) >= 10 and char_length(summary) <= 800
  ),
  constraint ai_video_offerings_type_check check (
    public.prompt_pilot_catalogue_is_offering_type(offering_type)
  ),
  constraint ai_video_offerings_ownership_check check (
    public.prompt_pilot_catalogue_is_ownership_type(ownership_type)
  ),
  constraint ai_video_offerings_lifecycle_check check (
    public.prompt_pilot_catalogue_is_lifecycle_status(lifecycle_status)
  ),
  constraint ai_video_offerings_api_access_check check (
    public.prompt_pilot_catalogue_is_api_access_status(api_access_status)
  ),
  constraint ai_video_offerings_review_dates check (review_due_at > verified_at),
  constraint ai_video_offerings_recommendation_check check (
    public.prompt_pilot_catalogue_recommendation_allowed(lifecycle_status, recommendation_eligible)
  ),
  constraint ai_video_offerings_display_name_safe check (display_name !~ '[[:cntrl:]]'),
  constraint ai_video_offerings_summary_safe check (summary !~ '[[:cntrl:]]'),
  constraint ai_video_offerings_official_identifier_safe check (
    official_identifier is null or official_identifier !~ '[[:cntrl:]]'
  )
);

comment on table public.ai_video_offerings is
  'Provider offerings including models, model families, and API services.';

create table public.ai_video_sources (
  id uuid primary key default gen_random_uuid(),
  provider_id text not null references public.ai_video_providers (id) on delete cascade,
  offering_id uuid references public.ai_video_offerings (id) on delete cascade,
  source_kind text not null,
  title text not null,
  url text not null,
  published_or_updated_at timestamptz,
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint ai_video_sources_provider_url_unique unique (provider_id, url),
  constraint ai_video_sources_kind_check check (public.prompt_pilot_catalogue_is_source_kind(source_kind)),
  constraint ai_video_sources_title_length check (char_length(title) >= 3 and char_length(title) <= 240),
  constraint ai_video_sources_url_https check (public.prompt_pilot_catalogue_is_https_url(url)),
  constraint ai_video_sources_title_safe check (title !~ '[[:cntrl:]]')
);

comment on table public.ai_video_sources is
  'Official documentation sources backing catalogue facts.';

create table public.ai_video_capability_facts (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.ai_video_offerings (id) on delete cascade,
  capability_key text not null,
  support_level text not null,
  numeric_value numeric,
  text_value text,
  structured_value jsonb,
  evidence_summary text not null,
  limitation_summary text,
  source_id uuid not null references public.ai_video_sources (id) on delete restrict,
  verified_at timestamptz not null,
  review_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_video_capability_facts_offering_key_unique unique (offering_id, capability_key),
  constraint ai_video_capability_facts_key_check check (
    public.prompt_pilot_catalogue_is_capability_key(capability_key)
  ),
  constraint ai_video_capability_facts_support_check check (
    public.prompt_pilot_catalogue_is_support_level(support_level)
  ),
  constraint ai_video_capability_facts_review_dates check (review_due_at > verified_at),
  constraint ai_video_capability_facts_evidence_length check (
    char_length(evidence_summary) >= 5 and char_length(evidence_summary) <= 600
  ),
  constraint ai_video_capability_facts_limitation_required check (
    support_level <> 'limited' or limitation_summary is not null
  ),
  constraint ai_video_capability_facts_evidence_safe check (evidence_summary !~ '[[:cntrl:]]'),
  constraint ai_video_capability_facts_limitation_safe check (
    limitation_summary is null or limitation_summary !~ '[[:cntrl:]]'
  ),
  constraint ai_video_capability_facts_value_shape check (
    (
      numeric_value is null
      and text_value is null
      and structured_value is null
    )
    or (
      numeric_value is not null
      and text_value is null
      and structured_value is null
    )
    or (
      numeric_value is null
      and text_value is null
      and structured_value is not null
    )
    or (
      numeric_value is null
      and text_value is not null
      and structured_value is null
    )
  )
);

comment on table public.ai_video_capability_facts is
  'Source-backed capability facts for catalogue offerings.';

create or replace function public.prompt_pilot_catalogue_source_offering_provider_match()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  offering_provider text;
begin
  if new.offering_id is null then
    return new;
  end if;

  select o.provider_id
  into offering_provider
  from public.ai_video_offerings as o
  where o.id = new.offering_id;

  if offering_provider is null then
    raise exception 'Offering not found for source linkage';
  end if;

  if offering_provider <> new.provider_id then
    raise exception 'Source provider must match offering provider';
  end if;

  return new;
end;
$$;

create trigger ai_video_sources_offering_provider_match
before insert or update on public.ai_video_sources
for each row
execute function public.prompt_pilot_catalogue_source_offering_provider_match();

create or replace function public.prompt_pilot_catalogue_fact_source_provider_match()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  offering_provider text;
  source_provider text;
begin
  select o.provider_id
  into offering_provider
  from public.ai_video_offerings as o
  where o.id = new.offering_id;

  if offering_provider is null then
    raise exception 'Offering not found for capability fact';
  end if;

  select s.provider_id
  into source_provider
  from public.ai_video_sources as s
  where s.id = new.source_id;

  if source_provider is null then
    raise exception 'Source not found for capability fact';
  end if;

  if offering_provider <> source_provider then
    raise exception 'Capability fact source must belong to the same provider as the offering';
  end if;

  return new;
end;
$$;

create trigger ai_video_capability_facts_source_provider_match
before insert or update on public.ai_video_capability_facts
for each row
execute function public.prompt_pilot_catalogue_fact_source_provider_match();

create trigger ai_video_providers_set_updated_at
before update on public.ai_video_providers
for each row
execute function public.prompt_pilot_set_updated_at();

create trigger ai_video_offerings_set_updated_at
before update on public.ai_video_offerings
for each row
execute function public.prompt_pilot_set_updated_at();

create trigger ai_video_capability_facts_set_updated_at
before update on public.ai_video_capability_facts
for each row
execute function public.prompt_pilot_set_updated_at();

create index ai_video_offerings_provider_lifecycle_idx
on public.ai_video_offerings (provider_id, lifecycle_status);

create index ai_video_offerings_provider_recommendation_idx
on public.ai_video_offerings (provider_id, recommendation_eligible);

create index ai_video_sources_provider_verified_idx
on public.ai_video_sources (provider_id, verified_at desc);

create index ai_video_sources_offering_idx
on public.ai_video_sources (offering_id);

create index ai_video_capability_facts_offering_key_idx
on public.ai_video_capability_facts (offering_id, capability_key);

create index ai_video_capability_facts_key_support_idx
on public.ai_video_capability_facts (capability_key, support_level);

create index ai_video_capability_facts_review_due_idx
on public.ai_video_capability_facts (review_due_at);

alter table public.ai_video_providers enable row level security;
alter table public.ai_video_providers force row level security;
alter table public.ai_video_offerings enable row level security;
alter table public.ai_video_offerings force row level security;
alter table public.ai_video_sources enable row level security;
alter table public.ai_video_sources force row level security;
alter table public.ai_video_capability_facts enable row level security;
alter table public.ai_video_capability_facts force row level security;

revoke all on table public.ai_video_providers from anon, authenticated;
revoke all on table public.ai_video_offerings from anon, authenticated;
revoke all on table public.ai_video_sources from anon, authenticated;
revoke all on table public.ai_video_capability_facts from anon, authenticated;

grant select on table public.ai_video_providers to anon, authenticated;
grant select on table public.ai_video_offerings to anon, authenticated;
grant select on table public.ai_video_sources to anon, authenticated;
grant select on table public.ai_video_capability_facts to anon, authenticated;

create policy ai_video_providers_select_anon
on public.ai_video_providers
for select
to anon
using (true);

create policy ai_video_providers_select_authenticated
on public.ai_video_providers
for select
to authenticated
using (true);

create policy ai_video_offerings_select_anon
on public.ai_video_offerings
for select
to anon
using (true);

create policy ai_video_offerings_select_authenticated
on public.ai_video_offerings
for select
to authenticated
using (true);

create policy ai_video_sources_select_anon
on public.ai_video_sources
for select
to anon
using (true);

create policy ai_video_sources_select_authenticated
on public.ai_video_sources
for select
to authenticated
using (true);

create policy ai_video_capability_facts_select_anon
on public.ai_video_capability_facts
for select
to anon
using (true);

create policy ai_video_capability_facts_select_authenticated
on public.ai_video_capability_facts
for select
to authenticated
using (true);
