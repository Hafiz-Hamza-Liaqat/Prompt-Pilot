-- Prompt Pilot Phase 6: video briefs wizard foundation

create or replace function public.prompt_pilot_video_brief_is_complete(
  p_source_type text,
  p_source_text text,
  p_source_url text,
  p_working_title text,
  p_objective text,
  p_target_audience text,
  p_publishing_destination text,
  p_aspect_ratio text,
  p_video_category text,
  p_duration_seconds integer,
  p_visual_style text,
  p_tone text,
  p_budget_priority text,
  p_quality_priority text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_source_type in ('idea', 'script', 'product_url', 'article_url')
    and (
      (
        p_source_type in ('idea', 'script')
        and p_source_text is not null
        and p_source_url is null
      )
      or (
        p_source_type in ('product_url', 'article_url')
        and p_source_url is not null
        and p_source_text is null
      )
    )
    and (
      p_source_type <> 'idea'
      or (
        char_length(btrim(p_source_text)) >= 10
        and char_length(p_source_text) <= 5000
      )
    )
    and (
      p_source_type <> 'script'
      or (
        char_length(btrim(p_source_text)) >= 10
        and char_length(p_source_text) <= 20000
      )
    )
    and (
      p_source_url is null
      or (
        char_length(p_source_url) <= 2048
        and p_source_url ~* '^https?://'
        and p_source_url !~ '^//'
        and p_source_url !~ '://[^/]*@'
        and p_source_url !~ '[[:cntrl:]]'
      )
    )
    and p_working_title is not null
    and char_length(btrim(p_working_title)) >= 1
    and char_length(p_working_title) <= 120
    and p_working_title !~ '[[:cntrl:]]'
    and p_objective is not null
    and char_length(btrim(p_objective)) >= 10
    and char_length(p_objective) <= 1000
    and p_objective !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
    and p_target_audience is not null
    and char_length(btrim(p_target_audience)) >= 2
    and char_length(p_target_audience) <= 500
    and p_target_audience !~ '[[:cntrl:]]'
    and p_publishing_destination is not null
    and p_publishing_destination in (
      'youtube',
      'youtube_shorts',
      'instagram_reels',
      'instagram_feed',
      'facebook_reels',
      'facebook_feed',
      'tiktok',
      'website',
      'custom'
    )
    and p_aspect_ratio is not null
    and p_aspect_ratio in ('16:9', '9:16', '1:1', '4:5', 'custom')
    and p_video_category is not null
    and p_video_category in (
      'product_advertisement',
      'ugc_advertisement',
      'cinematic_short',
      'faceless_educational',
      'explainer',
      'product_demonstration',
      'story_narrative',
      'realistic_social_scene',
      'youtube_intro_trailer',
      'real_estate_showcase',
      'news_informational_recap',
      'app_software_promotion'
    )
    and p_duration_seconds is not null
    and p_duration_seconds >= 5
    and p_duration_seconds <= 180
    and p_visual_style is not null
    and char_length(btrim(p_visual_style)) >= 2
    and char_length(p_visual_style) <= 120
    and p_visual_style !~ '[[:cntrl:]]'
    and p_tone is not null
    and char_length(btrim(p_tone)) >= 2
    and char_length(p_tone) <= 120
    and p_tone !~ '[[:cntrl:]]'
    and p_budget_priority is not null
    and p_budget_priority in (
      'free_only',
      'low_cost',
      'balanced',
      'highest_quality',
      'fastest'
    )
    and p_quality_priority is not null
    and p_quality_priority in (
      'fastest',
      'balanced',
      'highest_quality'
    );
$$;

create table public.video_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  source_type text not null,
  source_text text,
  source_url text,
  working_title text,
  objective text,
  target_audience text,
  publishing_destination text,
  aspect_ratio text,
  video_category text,
  duration_seconds integer,
  visual_style text,
  tone text,
  requires_character_consistency boolean not null default false,
  requires_product_consistency boolean not null default false,
  requires_logo_accuracy boolean not null default false,
  requires_exact_text_visibility boolean not null default false,
  requires_native_audio boolean not null default false,
  requires_dialogue boolean not null default false,
  requires_voiceover boolean not null default false,
  requires_lip_sync boolean not null default false,
  requires_multiple_locations boolean not null default false,
  requires_camera_control boolean not null default false,
  requires_first_last_frame_control boolean not null default false,
  requires_video_extension boolean not null default false,
  requires_reference_images boolean not null default false,
  requires_commercial_use boolean not null default false,
  budget_priority text,
  quality_priority text,
  user_constraints text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_briefs_source_type check (
    source_type in ('idea', 'script', 'product_url', 'article_url')
  ),
  constraint video_briefs_source_consistency check (
    (
      source_type in ('idea', 'script')
      and source_text is not null
      and source_url is null
    )
    or (
      source_type in ('product_url', 'article_url')
      and source_url is not null
      and source_text is null
    )
  ),
  constraint video_briefs_idea_source_text_length check (
    source_type <> 'idea'
    or (
      char_length(btrim(source_text)) >= 10
      and char_length(source_text) <= 5000
    )
  ),
  constraint video_briefs_script_source_text_length check (
    source_type <> 'script'
    or (
      char_length(btrim(source_text)) >= 10
      and char_length(source_text) <= 20000
    )
  ),
  constraint video_briefs_source_url_format check (
    source_url is null
    or (
      char_length(source_url) <= 2048
      and source_url ~* '^https?://'
      and source_url !~ '^//'
      and source_url !~ '://[^/]*@'
      and source_url !~ '[[:cntrl:]]'
    )
  ),
  constraint video_briefs_working_title_length check (
    working_title is null
    or (
      char_length(btrim(working_title)) >= 1
      and char_length(working_title) <= 120
    )
  ),
  constraint video_briefs_objective_length check (
    objective is null
    or (
      char_length(btrim(objective)) >= 10
      and char_length(objective) <= 1000
    )
  ),
  constraint video_briefs_target_audience_length check (
    target_audience is null
    or (
      char_length(btrim(target_audience)) >= 2
      and char_length(target_audience) <= 500
    )
  ),
  constraint video_briefs_publishing_destination check (
    publishing_destination is null
    or publishing_destination in (
      'youtube',
      'youtube_shorts',
      'instagram_reels',
      'instagram_feed',
      'facebook_reels',
      'facebook_feed',
      'tiktok',
      'website',
      'custom'
    )
  ),
  constraint video_briefs_aspect_ratio check (
    aspect_ratio is null
    or aspect_ratio in ('16:9', '9:16', '1:1', '4:5', 'custom')
  ),
  constraint video_briefs_video_category check (
    video_category is null
    or video_category in (
      'product_advertisement',
      'ugc_advertisement',
      'cinematic_short',
      'faceless_educational',
      'explainer',
      'product_demonstration',
      'story_narrative',
      'realistic_social_scene',
      'youtube_intro_trailer',
      'real_estate_showcase',
      'news_informational_recap',
      'app_software_promotion'
    )
  ),
  constraint video_briefs_duration_seconds check (
    duration_seconds is null
    or (
      duration_seconds >= 5
      and duration_seconds <= 180
    )
  ),
  constraint video_briefs_visual_style_length check (
    visual_style is null
    or (
      char_length(btrim(visual_style)) >= 2
      and char_length(visual_style) <= 120
    )
  ),
  constraint video_briefs_tone_length check (
    tone is null
    or (
      char_length(btrim(tone)) >= 2
      and char_length(tone) <= 120
    )
  ),
  constraint video_briefs_budget_priority check (
    budget_priority is null
    or budget_priority in (
      'free_only',
      'low_cost',
      'balanced',
      'highest_quality',
      'fastest'
    )
  ),
  constraint video_briefs_quality_priority check (
    quality_priority is null
    or quality_priority in (
      'fastest',
      'balanced',
      'highest_quality'
    )
  ),
  constraint video_briefs_user_constraints_length check (
    user_constraints is null
    or char_length(user_constraints) <= 2000
  ),
  constraint video_briefs_source_text_no_control_chars check (
    source_text is null
    or source_text !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
  ),
  constraint video_briefs_objective_no_control_chars check (
    objective is null
    or objective !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
  ),
  constraint video_briefs_user_constraints_no_control_chars check (
    user_constraints is null
    or user_constraints !~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'
  ),
  constraint video_briefs_working_title_no_control_chars check (
    working_title is null
    or working_title !~ '[[:cntrl:]]'
  ),
  constraint video_briefs_target_audience_no_control_chars check (
    target_audience is null
    or target_audience !~ '[[:cntrl:]]'
  ),
  constraint video_briefs_visual_style_no_control_chars check (
    visual_style is null
    or visual_style !~ '[[:cntrl:]]'
  ),
  constraint video_briefs_tone_no_control_chars check (
    tone is null
    or tone !~ '[[:cntrl:]]'
  ),
  constraint video_briefs_completion_requires_valid_draft check (
    completed_at is null
    or public.prompt_pilot_video_brief_is_complete(
      source_type,
      source_text,
      source_url,
      working_title,
      objective,
      target_audience,
      publishing_destination,
      aspect_ratio,
      video_category,
      duration_seconds,
      visual_style,
      tone,
      budget_priority,
      quality_priority
    )
  )
);

comment on table public.video_briefs is
  'Persistent wizard draft for one video brief per project; ownership inherited from public.projects.';

create index video_briefs_completed_at_idx
on public.video_briefs (completed_at)
where completed_at is not null;

create or replace function public.prompt_pilot_protect_video_brief_immutable_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.created_at is distinct from old.created_at then
    raise exception 'immutable video brief columns cannot be changed' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.prompt_pilot_reopen_video_brief_on_edit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.completed_at is null then
    return new;
  end if;

  if pg_catalog.current_setting('prompt_pilot.completing_brief', true) = 'true' then
    return new;
  end if;

  if new.source_type is distinct from old.source_type
    or new.source_text is distinct from old.source_text
    or new.source_url is distinct from old.source_url
    or new.working_title is distinct from old.working_title
    or new.objective is distinct from old.objective
    or new.target_audience is distinct from old.target_audience
    or new.publishing_destination is distinct from old.publishing_destination
    or new.aspect_ratio is distinct from old.aspect_ratio
    or new.video_category is distinct from old.video_category
    or new.duration_seconds is distinct from old.duration_seconds
    or new.visual_style is distinct from old.visual_style
    or new.tone is distinct from old.tone
    or new.requires_character_consistency is distinct from old.requires_character_consistency
    or new.requires_product_consistency is distinct from old.requires_product_consistency
    or new.requires_logo_accuracy is distinct from old.requires_logo_accuracy
    or new.requires_exact_text_visibility is distinct from old.requires_exact_text_visibility
    or new.requires_native_audio is distinct from old.requires_native_audio
    or new.requires_dialogue is distinct from old.requires_dialogue
    or new.requires_voiceover is distinct from old.requires_voiceover
    or new.requires_lip_sync is distinct from old.requires_lip_sync
    or new.requires_multiple_locations is distinct from old.requires_multiple_locations
    or new.requires_camera_control is distinct from old.requires_camera_control
    or new.requires_first_last_frame_control is distinct from old.requires_first_last_frame_control
    or new.requires_video_extension is distinct from old.requires_video_extension
    or new.requires_reference_images is distinct from old.requires_reference_images
    or new.requires_commercial_use is distinct from old.requires_commercial_use
    or new.budget_priority is distinct from old.budget_priority
    or new.quality_priority is distinct from old.quality_priority
    or new.user_constraints is distinct from old.user_constraints then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger video_briefs_reopen_on_edit
before update on public.video_briefs
for each row
execute function public.prompt_pilot_reopen_video_brief_on_edit();

create trigger video_briefs_protect_immutable_columns
before update on public.video_briefs
for each row
execute function public.prompt_pilot_protect_video_brief_immutable_columns();

create trigger video_briefs_set_updated_at
before update on public.video_briefs
for each row
execute function public.prompt_pilot_set_updated_at();

create or replace function public.prompt_pilot_complete_video_brief(project_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  brief_id uuid;
  caller_id uuid;
begin
  caller_id := (select auth.uid());

  if caller_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.projects p
    where p.id = project_uuid
      and p.owner_id = caller_id
      and p.deleted_at is null
      and p.archived_at is null
  ) then
    raise exception 'project not found or inaccessible' using errcode = 'P0002';
  end if;

  select vb.id
  into brief_id
  from public.video_briefs vb
  where vb.project_id = project_uuid;

  if brief_id is null then
    raise exception 'video brief not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.video_briefs vb
    where vb.id = brief_id
      and vb.completed_at is not null
  ) then
    return brief_id;
  end if;

  if not exists (
    select 1
    from public.video_briefs vb
    where vb.id = brief_id
      and public.prompt_pilot_video_brief_is_complete(
        vb.source_type,
        vb.source_text,
        vb.source_url,
        vb.working_title,
        vb.objective,
        vb.target_audience,
        vb.publishing_destination,
        vb.aspect_ratio,
        vb.video_category,
        vb.duration_seconds,
        vb.visual_style,
        vb.tone,
        vb.budget_priority,
        vb.quality_priority
      )
  ) then
    raise exception 'video brief is incomplete or invalid' using errcode = '23514';
  end if;

  perform pg_catalog.set_config('prompt_pilot.completing_brief', 'true', true);

  update public.video_briefs vb
  set completed_at = pg_catalog.now()
  where vb.id = brief_id
    and vb.completed_at is null;

  perform pg_catalog.set_config('prompt_pilot.completing_brief', '', true);

  if not found then
    raise exception 'video brief is incomplete or invalid' using errcode = '23514';
  end if;

  return brief_id;
end;
$$;

alter table public.video_briefs enable row level security;
alter table public.video_briefs force row level security;

revoke all on table public.video_briefs from anon;
revoke all on table public.video_briefs from public;

grant select, insert on table public.video_briefs to authenticated;

grant update (
  source_type,
  source_text,
  source_url,
  working_title,
  objective,
  target_audience,
  publishing_destination,
  aspect_ratio,
  video_category,
  duration_seconds,
  visual_style,
  tone,
  requires_character_consistency,
  requires_product_consistency,
  requires_logo_accuracy,
  requires_exact_text_visibility,
  requires_native_audio,
  requires_dialogue,
  requires_voiceover,
  requires_lip_sync,
  requires_multiple_locations,
  requires_camera_control,
  requires_first_last_frame_control,
  requires_video_extension,
  requires_reference_images,
  requires_commercial_use,
  budget_priority,
  quality_priority,
  user_constraints
) on table public.video_briefs to authenticated;

create policy video_briefs_select_own
on public.video_briefs
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = video_briefs.project_id
      and p.owner_id = (select auth.uid())
      and p.deleted_at is null
  )
);

create policy video_briefs_insert_own
on public.video_briefs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner_id = (select auth.uid())
      and p.deleted_at is null
      and p.archived_at is null
  )
);

create policy video_briefs_update_own
on public.video_briefs
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = video_briefs.project_id
      and p.owner_id = (select auth.uid())
      and p.deleted_at is null
      and p.archived_at is null
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.owner_id = (select auth.uid())
      and p.deleted_at is null
      and p.archived_at is null
  )
);

revoke all on function public.prompt_pilot_complete_video_brief(uuid) from public;
revoke all on function public.prompt_pilot_complete_video_brief(uuid) from anon;
grant execute on function public.prompt_pilot_complete_video_brief(uuid) to authenticated;
