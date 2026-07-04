import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const VALID_IDEA_TEXT =
  'A compelling summer product launch concept for urban professionals.';

const APPLICATION_TABLES = [
  'profiles',
  'projects',
  'video_briefs',
  'ai_video_providers',
  'ai_video_offerings',
  'ai_video_sources',
  'ai_video_capability_facts',
];

const FORBIDDEN_TABLES = [
  'result_workspaces',
  'planning_results',
  'scene_plans',
  'provider_recommendations',
  'compiled_prompts',
];

function assertConfigured() {
  if (!url || !publishableKey) {
    console.error('FAIL: missing local Supabase public configuration');
    process.exit(1);
  }
}

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fail(label) {
  console.error(`FAIL: ${label}`);
  process.exit(1);
}

async function signUpUser(label) {
  const email = `prompt-pilot-${label}-${randomSuffix()}@test.local`;
  const password = `Pw-${randomSuffix()}!`;

  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: 'Workspace Tester' } },
  });

  if (error || !data.session || !data.user) {
    fail(`${label} signup`);
  }

  return { client, userId: data.user.id };
}

async function saveBriefStep(client, projectId, fields, hasBrief = undefined) {
  let rowExists = hasBrief;

  if (rowExists === undefined) {
    const { data: existing } = await client
      .from('video_briefs')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    rowExists = Boolean(existing);
  }

  if (rowExists) {
    return client.from('video_briefs').update(fields).eq('project_id', projectId).select('id').single();
  }

  return client.from('video_briefs').insert({ project_id: projectId, ...fields }).select('id').single();
}

async function completeBrief(client, projectId) {
  await saveBriefStep(client, projectId, {
    source_type: 'idea',
    source_text: VALID_IDEA_TEXT,
    source_url: null,
    working_title: 'Workspace Brief',
    objective: 'Demonstrate workspace preview prerequisites with a valid brief.',
    target_audience: 'Product marketers',
    publishing_destination: 'youtube',
    aspect_ratio: '16:9',
    video_category: 'product_advertisement',
    duration_seconds: 30,
    visual_style: 'Clean and modern',
    tone: 'Confident',
    budget_priority: 'balanced',
    quality_priority: 'balanced',
  });

  const { error } = await client.rpc('prompt_pilot_complete_video_brief', {
    project_uuid: projectId,
  });

  if (error) {
    fail('complete brief');
  }
}

async function tableExists(client, tableName) {
  const { error } = await client.from(tableName).select('id', { head: true, count: 'exact' });
  return !error;
}

async function forbiddenTableAbsent(tableName) {
  const response = await fetch(`${url}/rest/v1/${tableName}?select=id&limit=1`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
  });

  return response.status === 404 || response.status === 406;
}

async function main() {
  assertConfigured();

  const anon = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const userA = await signUpUser('workspace-a');
  console.log('PASS: user-a signup');

  const userB = await signUpUser('workspace-b');
  console.log('PASS: user-b signup');

  const { data: projectA, error: projectAError } = await userA.client
    .from('projects')
    .insert({ owner_id: userA.userId, title: 'Workspace Alpha', description: 'Alpha notes' })
    .select('id')
    .single();

  if (projectAError || !projectA) {
    fail('user-a creates project');
  }
  console.log('PASS: user-a creates project');

  const { data: projectB, error: projectBError } = await userB.client
    .from('projects')
    .insert({ owner_id: userB.userId, title: 'Workspace Beta', description: null })
    .select('id')
    .single();

  if (projectBError || !projectB) {
    fail('user-b creates project');
  }
  console.log('PASS: user-b creates project');

  await completeBrief(userA.client, projectA.id);
  console.log('PASS: user-a completes brief');

  await completeBrief(userB.client, projectB.id);
  console.log('PASS: user-b completes brief');

  const { data: briefA } = await userA.client
    .from('video_briefs')
    .select('id, completed_at')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (!briefA?.completed_at) {
    fail('user-a completed brief readable');
  }
  console.log('PASS: user-a reads completed brief');

  const { data: foreignProject } = await userA.client
    .from('projects')
    .select('id')
    .eq('id', projectB.id)
    .maybeSingle();

  if (foreignProject) {
    fail('user-a cannot read user-b project');
  }
  console.log('PASS: user-a cannot read user-b project');

  const { data: foreignBrief } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectB.id)
    .maybeSingle();

  if (foreignBrief) {
    fail('user-a cannot read user-b brief');
  }
  console.log('PASS: user-a cannot read user-b brief');

  const { data: providers, error: providersError } = await anon
    .from('ai_video_providers')
    .select('id, lifecycle_status')
    .order('id');

  if (providersError || !providers || providers.length !== 5) {
    fail('anonymous provider catalogue read');
  }
  console.log('PASS: anonymous provider catalogue read');

  const sora = providers.find((row) => row.id === 'openai_sora');
  if (!sora || sora.lifecycle_status !== 'sunsetting') {
    fail('Sora lifecycle remains sunsetting');
  }
  console.log('PASS: Sora lifecycle remains sunsetting');

  for (const table of APPLICATION_TABLES) {
    const client = table === 'profiles' || table === 'projects' || table === 'video_briefs'
      ? userA.client
      : anon;
    const exists = await tableExists(client, table);
    if (!exists) {
      fail(`application table exists: ${table}`);
    }
  }
  console.log('PASS: application tables exist');

  for (const table of FORBIDDEN_TABLES) {
    const absent = await forbiddenTableAbsent(table);
    if (!absent) {
      fail(`forbidden table absent: ${table}`);
    }
  }
  console.log('PASS: no result-workspace tables exist');

  const { error: insertWorkspaceError } = await anon.from('result_workspaces').insert({
    project_id: projectA.id,
  });
  if (!insertWorkspaceError) {
    fail('no workspace record persisted');
  }
  console.log('PASS: no workspace record persisted');

  await userA.client
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', projectA.id);

  const { data: archivedBrief } = await userA.client
    .from('video_briefs')
    .select('completed_at')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (!archivedBrief?.completed_at) {
    fail('archived completed brief readable');
  }
  console.log('PASS: archived completed brief readable');

  await userA.client.rpc('prompt_pilot_soft_delete_project', { project_id: projectA.id });

  const { data: hiddenBrief } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (hiddenBrief) {
    fail('soft-deleted project hides brief');
  }
  console.log('PASS: soft-deleted project hides brief');

  const { error: catalogueInsertError } = await anon.from('ai_video_providers').insert({
    id: 'google_veo',
    display_name: 'Blocked',
    vendor_name: 'Blocked',
    summary: 'Should fail insert attempt for catalogue mutation check.',
    lifecycle_status: 'active',
    api_access_status: 'public',
    recommendation_eligible: false,
    verified_at: new Date().toISOString(),
    review_due_at: new Date(Date.now() + 86400000).toISOString(),
  });

  if (!catalogueInsertError) {
    fail('catalogue mutation blocked');
  }
  console.log('PASS: catalogue mutation blocked');

  await userA.client.auth.signOut();
  await userB.client.auth.signOut();
  console.log('PASS: users sign out');

  console.log('PASS: mock workspace local integration complete');
}

main().catch(() => {
  console.error('FAIL: unexpected workspace integration error');
  process.exit(1);
});
