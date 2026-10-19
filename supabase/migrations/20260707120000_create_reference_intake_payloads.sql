-- PP-11 Slice 4A: durable transcript/script storage for reference intake (4B trigger reads)

create table public.reference_intake_payloads (
  reference_id uuid primary key references public.content_references (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  payload_kind text not null,
  body_text text not null,
  created_at timestamptz not null default now(),
  constraint reference_intake_payloads_kind_check check (
    payload_kind in ('transcript', 'script')
  ),
  constraint reference_intake_payloads_body_length check (
    char_length(body_text) between 1 and 50000
  )
);

create index reference_intake_payloads_project_idx
on public.reference_intake_payloads (project_id);

alter table public.reference_intake_payloads enable row level security;
alter table public.reference_intake_payloads force row level security;

grant select, insert on table public.reference_intake_payloads to authenticated;

create policy reference_intake_payloads_select_own on public.reference_intake_payloads
for select to authenticated using (owner_id = auth.uid());

create policy reference_intake_payloads_insert_own on public.reference_intake_payloads
for insert to authenticated with check (owner_id = auth.uid());

comment on table public.reference_intake_payloads is
  'Durable transcript/script body for reference intake; URL metadata lives on content_references.';
