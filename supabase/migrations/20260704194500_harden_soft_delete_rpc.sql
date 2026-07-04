-- Phase 6 prerequisite: harden Phase 5 soft-delete RPC for query-planner-safe auth checks

create or replace function public.prompt_pilot_soft_delete_project(project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.projects
  set deleted_at = pg_catalog.now()
  where id = project_id
    and owner_id = (select auth.uid())
    and deleted_at is null;

  if not found then
    raise exception 'project not found or inaccessible' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.prompt_pilot_soft_delete_project(uuid) from public;
revoke all on function public.prompt_pilot_soft_delete_project(uuid) from anon;
grant execute on function public.prompt_pilot_soft_delete_project(uuid) to authenticated;
