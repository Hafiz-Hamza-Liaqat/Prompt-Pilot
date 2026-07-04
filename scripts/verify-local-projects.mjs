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
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error || !data.session || !data.user) {
    console.error(`FAIL: ${label} signup`);
    process.exit(1);
  }

  return { client, userId: data.user.id };
}

async function main() {
  assertConfigured();

  const userA = await signUpUser('projects-a', 'User Alpha');
  console.log('PASS: user-a signup');

  const userB = await signUpUser('projects-b', 'User Beta');
  console.log('PASS: user-b signup');

  const { data: profileA } = await userA.client.from('profiles').select('id').eq('id', userA.userId).maybeSingle();
  const { data: profileB } = await userB.client.from('profiles').select('id').eq('id', userB.userId).maybeSingle();

  if (!profileA || !profileB) {
    console.error('FAIL: profiles exist');
    process.exit(1);
  }
  console.log('PASS: profiles exist');

  const { data: projectA, error: createAError } = await userA.client
    .from('projects')
    .insert({ owner_id: userA.userId, title: 'Project Alpha', description: 'Alpha notes' })
    .select('id, title, archived_at, deleted_at')
    .single();

  if (createAError || !projectA) {
    console.error('FAIL: user-a creates project');
    process.exit(1);
  }
  console.log('PASS: user-a creates project');

  const { data: projectB, error: createBError } = await userB.client
    .from('projects')
    .insert({ owner_id: userB.userId, title: 'Project Beta', description: null })
    .select('id')
    .single();

  if (createBError || !projectB) {
    console.error('FAIL: user-b creates project');
    process.exit(1);
  }
  console.log('PASS: user-b creates project');

  const { data: listA } = await userA.client.from('projects').select('id, title');
  if (!listA?.some((row) => row.id === projectA.id) || listA.some((row) => row.id === projectB.id)) {
    console.error('FAIL: user-a list isolation');
    process.exit(1);
  }
  console.log('PASS: user-a sees own project only');

  const { data: foreignB } = await userA.client
    .from('projects')
    .select('id')
    .eq('id', projectB.id)
    .maybeSingle();

  if (foreignB) {
    console.error('FAIL: user-a cannot read user-b project');
    process.exit(1);
  }
  console.log('PASS: user-a cannot read user-b project');

  const { data: listB } = await userB.client.from('projects').select('id');
  if (listB?.some((row) => row.id === projectA.id)) {
    console.error('FAIL: user-b cannot read user-a project');
    process.exit(1);
  }
  console.log('PASS: user-b cannot read user-a project');

  const { data: updatedA, error: updateAError } = await userA.client
    .from('projects')
    .update({ title: 'Project Alpha Updated' })
    .eq('id', projectA.id)
    .select('title')
    .single();

  if (updateAError || updatedA?.title !== 'Project Alpha Updated') {
    console.error('FAIL: user-a updates own project');
    process.exit(1);
  }
  console.log('PASS: user-a updates own project');

  const { data: foreignUpdate } = await userA.client
    .from('projects')
    .update({ title: 'Hacked' })
    .eq('id', projectB.id)
    .select('id');

  if (foreignUpdate && foreignUpdate.length > 0) {
    console.error('FAIL: user-a cannot update user-b project');
    process.exit(1);
  }
  console.log('PASS: user-a cannot update user-b project');

  const { error: reassignError } = await userA.client
    .from('projects')
    .update({ owner_id: userB.userId })
    .eq('id', projectA.id);

  if (!reassignError) {
    console.error('FAIL: owner reassignment rejected');
    process.exit(1);
  }
  console.log('PASS: owner reassignment rejected');

  const archivedAt = new Date().toISOString();
  const { data: archivedProject, error: archiveError } = await userA.client
    .from('projects')
    .update({ archived_at: archivedAt })
    .eq('id', projectA.id)
    .select('archived_at')
    .single();

  if (archiveError || !archivedProject?.archived_at) {
    console.error('FAIL: user-a archives project');
    process.exit(1);
  }
  console.log('PASS: user-a archives project');

  const { data: archivedRead } = await userA.client
    .from('projects')
    .select('id')
    .eq('id', projectA.id)
    .maybeSingle();

  if (!archivedRead) {
    console.error('FAIL: archived project readable');
    process.exit(1);
  }
  console.log('PASS: archived project readable');

  const { data: restoredProject, error: restoreError } = await userA.client
    .from('projects')
    .update({ archived_at: null })
    .eq('id', projectA.id)
    .select('archived_at')
    .single();

  if (restoreError || restoredProject?.archived_at !== null) {
    console.error('FAIL: user-a restores project');
    process.exit(1);
  }
  console.log('PASS: user-a restores project');

  const { data: duplicateProject, error: duplicateError } = await userA.client
    .from('projects')
    .insert({
      owner_id: userA.userId,
      title: 'Project Alpha Updated (Copy)',
      description: 'Alpha notes',
    })
    .select('id, title, archived_at')
    .single();

  if (duplicateError || !duplicateProject || duplicateProject.archived_at) {
    console.error('FAIL: duplicate created');
    process.exit(1);
  }
  console.log('PASS: duplicate created active');

  const { error: softDeleteError } = await userA.client.rpc('prompt_pilot_soft_delete_project', {
    project_id: projectA.id,
  });

  if (softDeleteError) {
    console.error('FAIL: user-a soft deletes project');
    process.exit(1);
  }
  console.log('PASS: user-a soft deletes project');

  const { data: deletedRead } = await userA.client
    .from('projects')
    .select('id')
    .eq('id', projectA.id)
    .maybeSingle();

  if (deletedRead) {
    console.error('FAIL: soft-deleted project hidden');
    process.exit(1);
  }
  console.log('PASS: soft-deleted project hidden');

  const { data: deletedUpdate } = await userA.client
    .from('projects')
    .update({ title: 'Should fail' })
    .eq('id', projectA.id)
    .select('id');

  if (deletedUpdate && deletedUpdate.length > 0) {
    console.error('FAIL: soft-deleted project not updatable');
    process.exit(1);
  }
  console.log('PASS: soft-deleted project not updatable');

  const { error: hardDeleteError } = await userA.client
    .from('projects')
    .delete()
    .eq('id', duplicateProject.id);

  if (!hardDeleteError) {
    console.error('FAIL: hard delete rejected');
    process.exit(1);
  }
  console.log('PASS: hard delete rejected');

  await userA.client.auth.signOut();
  await userB.client.auth.signOut();
  console.log('PASS: signout succeeds');

  console.log('PASS: local projects integration complete');
}

main().catch(() => {
  console.error('FAIL: local projects integration');
  process.exit(1);
});
