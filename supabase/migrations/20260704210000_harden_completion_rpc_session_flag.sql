-- Phase 6-A: harden completion RPC session flag cleanup on failure

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

  begin
    perform pg_catalog.set_config('prompt_pilot.completing_brief', 'true', true);

    update public.video_briefs vb
    set completed_at = pg_catalog.now()
    where vb.id = brief_id
      and vb.completed_at is null;

    if not found then
      perform pg_catalog.set_config('prompt_pilot.completing_brief', '', true);
      raise exception 'video brief is incomplete or invalid' using errcode = '23514';
    end if;

    perform pg_catalog.set_config('prompt_pilot.completing_brief', '', true);
  exception
    when others then
      perform pg_catalog.set_config('prompt_pilot.completing_brief', '', true);
      raise;
  end;

  return brief_id;
end;
$$;

revoke all on function public.prompt_pilot_complete_video_brief(uuid) from public;
revoke all on function public.prompt_pilot_complete_video_brief(uuid) from anon;
grant execute on function public.prompt_pilot_complete_video_brief(uuid) to authenticated;
