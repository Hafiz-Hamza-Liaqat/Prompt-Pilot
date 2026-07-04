import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function assertConfigured() {
  if (!url || !publishableKey) {
    console.error('FAIL: missing local Supabase public configuration');
    process.exit(1);
  }
}

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function signUpUser(label, displayName) {
  const email = `prompt-pilot-${label}-${randomSuffix()}@test.local`;
  const password = `Pw-${randomSuffix()}!`;

  const client = createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error || !data.session || !data.user) {
    console.error(`FAIL: ${label} signup`);
    process.exit(1);
  }

  return {
    client,
    userId: data.user.id,
    session: data.session,
    displayName,
  };
}

async function main() {
  assertConfigured();

  const userA = await signUpUser('user-a', 'User Alpha');
  console.log('PASS: user-a signup');

  const { data: profileA, error: profileAError } = await userA.client
    .from('profiles')
    .select('id, display_name')
    .eq('id', userA.userId)
    .maybeSingle();

  if (profileAError || !profileA) {
    console.error('FAIL: user-a profile created');
    process.exit(1);
  }
  console.log('PASS: user-a profile created');

  const userB = await signUpUser('user-b', 'User Beta');
  console.log('PASS: user-b signup');

  const { data: profileB, error: profileBError } = await userB.client
    .from('profiles')
    .select('id')
    .eq('id', userB.userId)
    .maybeSingle();

  if (profileBError || !profileB) {
    console.error('FAIL: user-b profile created');
    process.exit(1);
  }
  console.log('PASS: user-b profile created');

  const { data: visibleProfiles, error: visibleError } = await userA.client
    .from('profiles')
    .select('id');

  if (visibleError || visibleProfiles?.length !== 1 || visibleProfiles[0]?.id !== userA.userId) {
    console.error('FAIL: user-a sees only own profile');
    process.exit(1);
  }
  console.log('PASS: user-a sees only own profile');

  const { data: foreignProfile, error: foreignReadError } = await userA.client
    .from('profiles')
    .select('id')
    .eq('id', userB.userId)
    .maybeSingle();

  if (foreignReadError || foreignProfile) {
    console.error('FAIL: user-a cannot read user-b profile');
    process.exit(1);
  }
  console.log('PASS: user-a cannot read user-b profile');

  const { data: foreignUpdate, error: foreignUpdateError } = await userA.client
    .from('profiles')
    .update({ display_name: 'Hacked Name' })
    .eq('id', userB.userId)
    .select('id');

  if (foreignUpdateError) {
    console.error('FAIL: user-a foreign update errored unexpectedly');
    process.exit(1);
  }

  if (foreignUpdate && foreignUpdate.length > 0) {
    console.error('FAIL: user-a updated user-b profile');
    process.exit(1);
  }
  console.log('PASS: user-a cannot update user-b profile');

  const updatedName = `Alpha Updated ${randomSuffix().slice(0, 8)}`;
  const { data: ownUpdate, error: ownUpdateError } = await userA.client
    .from('profiles')
    .update({ display_name: updatedName })
    .eq('id', userA.userId)
    .select('display_name')
    .single();

  if (ownUpdateError || ownUpdate?.display_name !== updatedName) {
    console.error('FAIL: user-a updates own profile');
    process.exit(1);
  }
  console.log('PASS: user-a updates own profile');

  await userA.client.auth.signOut();
  await userB.client.auth.signOut();
  console.log('PASS: sign out both clients');

  console.log('PASS: local auth integration complete');
}

main().catch(() => {
  console.error('FAIL: local auth integration');
  process.exit(1);
});
