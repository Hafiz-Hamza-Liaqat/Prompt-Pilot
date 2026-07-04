begin;

create extension if not exists pgtap with schema extensions;

select plan(35);

select has_table('public', 'projects', 'public.projects should exist');

select has_column('public', 'projects', 'owner_id', 'projects.owner_id should exist');
select has_column('public', 'projects', 'title', 'projects.title should exist');
select has_column('public', 'projects', 'description', 'projects.description should exist');
select has_column('public', 'projects', 'archived_at', 'projects.archived_at should exist');
select has_column('public', 'projects', 'deleted_at', 'projects.deleted_at should exist');

select fk_ok(
  'public',
  'projects',
  array['owner_id'],
  'auth',
  'users',
  array['id'],
  'projects.owner_id should reference auth.users.id'
);

select ok(
  (
    select confdeltype = 'c'
    from pg_constraint
    where conname = 'projects_owner_id_fkey'
  ),
  'owner delete should cascade to projects'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.projects'::regclass),
  'RLS should be enabled on projects'
);

select ok(
  (select relforcerowsecurity from pg_class where oid = 'public.projects'::regclass),
  'RLS should be forced on projects'
);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'project-a@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Project A"}', now(), now()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'project-b@test.local',
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{"display_name":"Project B"}', now(), now()
  );

set local role anon;
select throws_ok(
  'select * from public.projects',
  '42501',
  null,
  'anon should not select projects'
);

select throws_ok(
  $$insert into public.projects (owner_id, title)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Anon Project')$$,
  '42501',
  null,
  'anon should not insert projects'
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select lives_ok(
  $$insert into public.projects (owner_id, title, description)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alpha Project', 'Notes')$$,
  'user A can insert own project'
);

select throws_ok(
  $$insert into public.projects (owner_id, title)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Foreign Project')$$,
  '42501',
  null,
  'user A cannot insert for user B'
);

select results_eq(
  $$select count(*)::int from public.projects where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  $$values (1)$$,
  'user A sees own projects'
);

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select lives_ok(
  $$insert into public.projects (owner_id, title)
    values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Beta Project')$$,
  'user B can insert own project'
);

set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select is_empty(
  $$select * from public.projects where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid$$,
  'user A cannot see user B projects'
);

select lives_ok(
  $$update public.projects set title = 'Alpha Updated'
    where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  'user A can update own title'
);

select results_eq(
  $$with updated as (
      update public.projects set title = 'Hacked'
      where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
      returning 1
    ) select count(*)::int from updated$$,
  $$values (0)$$,
  'user A cannot update user B project'
);

select throws_ok(
  $$update public.projects set owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid
    where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  '42501',
  null,
  'user A cannot change owner_id'
);

select lives_ok(
  $$update public.projects set archived_at = now()
    where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  'user A can archive own project'
);

select isnt_empty(
  $$select * from public.projects
    where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
      and archived_at is not null$$,
  'archived project remains visible to owner'
);

select lives_ok(
  $$update public.projects set archived_at = null
    where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  'user A can restore archived project'
);

select lives_ok(
  $$select public.prompt_pilot_soft_delete_project(
      (select id from public.projects where title = 'Alpha Updated' limit 1)
    )$$,
  'user A can soft delete own project'
);

select is_empty(
  $$select * from public.projects
    where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
      and deleted_at is null$$,
  'soft-deleted project hidden from normal select'
);

select results_eq(
  $$with updated as (
      update public.projects set title = 'After Delete'
      where owner_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid
        and deleted_at is not null
      returning 1
    ) select count(*)::int from updated$$,
  $$values (0)$$,
  'soft-deleted project cannot be updated again'
);

select ok(
  not has_table_privilege('authenticated', 'public.projects', 'DELETE'),
  'authenticated role has no SQL DELETE privilege'
);

reset role;

select throws_ok(
  $$insert into public.projects (owner_id, title)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '')$$,
  '23514',
  null,
  'empty title fails'
);

select throws_ok(
  $$insert into public.projects (owner_id, title)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', repeat('x', 121))$$,
  '23514',
  null,
  'title over 120 fails'
);

select throws_ok(
  $$insert into public.projects (owner_id, title, description)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Valid', repeat('d', 501))$$,
  '23514',
  null,
  'description over 500 fails'
);

select throws_ok(
  $$insert into public.projects (owner_id, title)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bad' || chr(7) || 'Title')$$,
  '23514',
  null,
  'control characters in title fail'
);

insert into public.projects (owner_id, title)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Timestamp Project');

select isnt_empty(
  $$select 1 from public.projects
    where title = 'Timestamp Project'
      and updated_at >= created_at$$,
  'updated_at maintained on projects'
);

delete from auth.users where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

select is_empty(
  $$select * from public.projects where owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid$$,
  'deleting auth user cascades projects'
);

select results_eq(
  $$select count(*)::int from public.profiles
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid$$,
  $$values (1)$$,
  'profile trigger still creates profiles'
);

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

select results_eq(
  $$select count(*)::int from public.profiles where id = auth.uid()$$,
  $$values (1)$$,
  'profile RLS still limits profile reads to self'
);

select * from finish();

rollback;
