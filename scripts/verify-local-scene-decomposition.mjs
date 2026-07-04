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
  'scenes',
  'video_plans',
  'scene_plans',
  'scene_decompositions',
  'provider_recommendations',
  'result_workspaces',
  'planning_results',
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
    options: { data: { display_name: 'Scene Tester' } },
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
    return client
      .from('video_briefs')
      .update(fields)
      .eq('project_id', projectId)
      .select('id')
      .single();
  }

  return client.from('video_briefs').insert({ project_id: projectId, ...fields }).select('id').single();
}

async function completeBriefWithDuration(client, projectId, durationSeconds) {
  await saveBriefStep(client, projectId, {
    source_type: 'idea',
    source_text: VALID_IDEA_TEXT,
    source_url: null,
    working_title: 'Scene Brief',
    objective: 'Demonstrate scene decomposition persistence boundaries.',
    target_audience: 'Product marketers',
    publishing_destination: 'youtube',
    aspect_ratio: '16:9',
    video_category: 'product_advertisement',
    duration_seconds: durationSeconds,
    visual_style: 'Clean and modern',
    tone: 'Confident',
    budget_priority: 'balanced',
    quality_priority: 'balanced',
  });

  const { error } = await client.rpc('prompt_pilot_complete_video_brief', {
    project_uuid: projectId,
  });

  if (error) {
    fail(`complete brief ${durationSeconds}s`);
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

  const userA = await signUpUser('scene-a');
  console.log('PASS: user signup');

  const userB = await signUpUser('scene-b');
  console.log('PASS: second user signup');

  const { data: projectA, error: projectAError } = await userA.client
    .from('projects')
    .insert({ owner_id: userA.userId, title: 'Scene Alpha', description: 'Alpha notes' })
    .select('id')
    .single();

  if (projectAError || !projectA) {
    fail('project creation');
  }
  console.log('PASS: project creation');

  const { data: projectB, error: projectBError } = await userB.client
    .from('projects')
    .insert({ owner_id: userB.userId, title: 'Scene Beta', description: null })
    .select('id')
    .single();

  if (projectBError || !projectB) {
    fail('second project creation');
  }

  const durations = [5, 60, 180];
  for (const duration of durations) {
    const { data: durationProject, error: durationProjectError } = await userA.client
      .from('projects')
      .insert({
        owner_id: userA.userId,
        title: `Duration ${duration}`,
        description: null,
      })
      .select('id')
      .single();

    if (durationProjectError || !durationProject) {
      fail(`duration project ${duration}s`);
    }

    await completeBriefWithDuration(userA.client, durationProject.id, duration);

    const { data: briefRow } = await userA.client
      .from('video_briefs')
      .select('duration_seconds, completed_at')
      .eq('project_id', durationProject.id)
      .maybeSingle();

    if (!briefRow?.completed_at || briefRow.duration_seconds !== duration) {
      fail(`saved duration ${duration}s`);
    }
    console.log(`PASS: completed brief ${duration}s`);
  }

  await completeBriefWithDuration(userA.client, projectA.id, 30);
  console.log('PASS: primary completed brief');

  const { data: briefA } = await userA.client
    .from('video_briefs')
    .select('id, completed_at, duration_seconds')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (!briefA?.completed_at) {
    fail('brief readable by owner');
  }
  console.log('PASS: brief readable by owner');

  const { data: foreignBrief } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectB.id)
    .maybeSingle();

  if (foreignBrief) {
    fail('cross-user brief access blocked');
  }
  console.log('PASS: cross-user brief access blocked');

  const { data: providersBefore, error: providersError } = await anon
    .from('ai_video_providers')
    .select('id, lifecycle_status')
    .order('id');

  if (providersError || !providersBefore || providersBefore.length !== 5) {
    fail('provider catalogue read');
  }
  console.log('PASS: provider catalogue unchanged');

  for (const table of APPLICATION_TABLES) {
    const client =
      table === 'profiles' || table === 'projects' || table === 'video_briefs'
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
  console.log('PASS: no scene or plan tables exist');

  const { error: sceneInsertError } = await userA.client.from('scenes').insert({
    project_id: projectA.id,
    order: 1,
  });
  if (!sceneInsertError) {
    fail('no scene rows persisted');
  }
  console.log('PASS: no scene rows persisted');

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

  await userA.client.auth.signOut();
  await userB.client.auth.signOut();
  console.log('PASS: users sign out');

  console.log('PASS: scene decomposition local integration complete');
}

main().catch(() => {
  console.error('FAIL: unexpected scene integration error');
  process.exit(1);
});
