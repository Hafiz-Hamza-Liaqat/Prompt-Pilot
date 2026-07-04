begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

-- 1. profiles table exists
select has_table('public', 'profiles', 'public.profiles should exist');

-- 2. RLS enabled
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS should be enabled on public.profiles'
);

-- 3. Required columns exist
select has_column('public', 'profiles', 'id', 'profiles.id should exist');
select has_column('public', 'profiles', 'display_name', 'profiles.display_name should exist');
select has_column('public', 'profiles', 'created_at', 'profiles.created_at should exist');
select has_column('public', 'profiles', 'updated_at', 'profiles.updated_at should exist');

-- 4. Foreign key to auth.users
select fk_ok(
  'public',
  'profiles',
  array['id'],
  'auth',
  'users',
  array['id'],
  'profiles.id should reference auth.users.id'
);

-- Setup test users as postgres (bypasses RLS)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user-a@test.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"User Alpha"}',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user-b@test.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"User Beta"}',
    now(),
    now()
  );

-- 5. Delete cascade configured
select ok(
  (
    select confdeltype = 'c'
    from pg_constraint
    where conname = 'profiles_id_fkey'
  ),
  'profiles.id should cascade on auth.users delete'
);

-- 6. Anonymous role cannot select profiles
set local role anon;
select throws_ok(
  'select * from public.profiles',
  '42501',
  null,
  'anon should not read profiles'
);

-- 7. Authenticated user can select own profile
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select results_eq(
  'select id::text from public.profiles order by id',
  $$values ('11111111-1111-1111-1111-111111111111')$$,
  'authenticated user should read own profile'
);

-- 8. Authenticated user cannot select another profile
select is_empty(
  $$select * from public.profiles where id = '22222222-2222-2222-2222-222222222222'::uuid$$,
  'authenticated user should not read another profile'
);

-- 9. Authenticated user can update own display name
select lives_ok(
  $$update public.profiles set display_name = 'Alpha Updated' where id = '11111111-1111-1111-1111-111111111111'::uuid$$,
  'authenticated user should update own profile'
);

-- 10. Authenticated user cannot update another profile
select results_eq(
  $$with updated as (
      update public.profiles
      set display_name = 'Hacked'
      where id = '22222222-2222-2222-2222-222222222222'::uuid
      returning 1
    )
    select count(*)::int from updated$$,
  $$values (0)$$,
  'authenticated user should not update another profile'
);

-- 11. Authenticated user cannot insert profile directly
select throws_ok(
  $$insert into public.profiles (id, display_name)
    values ('33333333-3333-3333-3333-333333333333', 'Direct Insert')$$,
  '42501',
  null,
  'authenticated user should not insert profiles directly'
);

-- 12. Authenticated user cannot delete profile directly
select throws_ok(
  $$delete from public.profiles
    where id = '11111111-1111-1111-1111-111111111111'::uuid$$,
  '42501',
  null,
  'authenticated user should not delete profiles directly'
);

reset role;

-- 13. Invalid short display names fail
select throws_ok(
  $$update public.profiles
    set display_name = 'A'
    where id = '22222222-2222-2222-2222-222222222222'::uuid$$,
  '23514',
  null,
  'display names shorter than 2 characters should fail'
);

-- 14. Display names over 80 characters fail
select throws_ok(
  $$update public.profiles
    set display_name = repeat('x', 81)
    where id = '22222222-2222-2222-2222-222222222222'::uuid$$,
  '23514',
  null,
  'display names longer than 80 characters should fail'
);

-- 15. New-user Auth trigger creates a matching profile
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'trigger-user@test.local',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Trigger User"}',
  now(),
  now()
);

select results_eq(
  $$select display_name from public.profiles where id = '44444444-4444-4444-4444-444444444444'::uuid$$,
  $$values ('Trigger User'::text)$$,
  'auth trigger should create a matching profile'
);

-- 16. Deleting an Auth user deletes the profile
delete from auth.users where id = '44444444-4444-4444-4444-444444444444';

select is_empty(
  $$select * from public.profiles where id = '44444444-4444-4444-4444-444444444444'::uuid$$,
  'deleting auth user should delete profile'
);

select * from finish();

rollback;
