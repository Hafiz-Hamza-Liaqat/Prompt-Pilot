-- Prompt Pilot Phase 5: projects foundation

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_title_length check (
    char_length(btrim(title)) >= 1
    and char_length(title) <= 120
  ),
  constraint projects_description_length check (
    description is null
    or char_length(description) <= 500
  ),
  constraint projects_title_no_control_chars check (
    title !~ '[[:cntrl:]]'
  ),
  constraint projects_description_no_control_chars check (
    description is null
    or description !~ '[[:cntrl:]]'
  )
);

comment on table public.projects is 'User-owned project containers for Prompt Pilot planning workflows.';

create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.prompt_pilot_set_updated_at();

create index projects_owner_updated_visible_idx
on public.projects (owner_id, updated_at desc)
where deleted_at is null;

create index projects_owner_created_visible_idx
on public.projects (owner_id, created_at desc)
where deleted_at is null;

create index projects_owner_archived_visible_idx
on public.projects (owner_id, archived_at)
where deleted_at is null;

alter table public.projects enable row level security;
alter table public.projects force row level security;

revoke all on table public.projects from anon;
revoke delete on table public.projects from authenticated;
grant select, insert, update on table public.projects to authenticated;

create policy projects_select_own
on public.projects
for select
to authenticated
using (
  owner_id = auth.uid()
  and deleted_at is null
);

create policy projects_insert_own
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid());

create policy projects_update_own
on public.projects
for update
to authenticated
using (
  owner_id = auth.uid()
  and deleted_at is null
)
with check (
  owner_id = auth.uid()
);

create or replace function public.prompt_pilot_protect_project_immutable_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
    or new.owner_id is distinct from old.owner_id
    or new.created_at is distinct from old.created_at then
    raise exception 'immutable project columns cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger projects_protect_immutable_columns
before update on public.projects
for each row
execute function public.prompt_pilot_protect_project_immutable_columns();

create policy projects_soft_delete_own
on public.projects
for update
to authenticated
using (
  owner_id = auth.uid()
  and deleted_at is null
)
with check (
  owner_id = auth.uid()
  and deleted_at is not null
);

create or replace function public.prompt_pilot_soft_delete_project(project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.projects
  set deleted_at = pg_catalog.now()
  where id = project_id
    and owner_id = auth.uid()
    and deleted_at is null;

  if not found then
    raise exception 'project not found or inaccessible' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.prompt_pilot_soft_delete_project(uuid) from public;
grant execute on function public.prompt_pilot_soft_delete_project(uuid) to authenticated;
