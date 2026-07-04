-- Prompt Pilot Phase 4: profiles auth foundation

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    char_length(display_name) >= 2
    and char_length(display_name) <= 80
  )
);

comment on table public.profiles is 'Private user profile metadata for Prompt Pilot authentication.';

create or replace function public.prompt_pilot_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.prompt_pilot_set_updated_at();

create or replace function public.prompt_pilot_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_display_name text;
  normalized_display_name text;
begin
  raw_display_name := coalesce(new.raw_user_meta_data ->> 'display_name', '');
  normalized_display_name := pg_catalog.btrim(raw_display_name);

  if char_length(normalized_display_name) < 2
    or char_length(normalized_display_name) > 80 then
    normalized_display_name := 'Creator';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, normalized_display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.prompt_pilot_handle_new_user();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

revoke all on table public.profiles from anon;
grant select, update on table public.profiles to authenticated;
