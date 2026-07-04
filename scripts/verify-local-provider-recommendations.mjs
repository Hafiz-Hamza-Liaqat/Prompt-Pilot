import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const VALID_IDEA_TEXT =
  'A compelling summer product launch concept for urban professionals.';

const FORBIDDEN_TABLES = [
  'provider_recommendations',
  'recommendation_results',
  'planning_recommendations',
  'selected_providers',
  'video_plans',
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
    options: { data: { display_name: 'Recommendation Tester' } },
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

async function completeBrief(client, projectId) {
  await saveBriefStep(client, projectId, {
    source_type: 'idea',
    source_text: VALID_IDEA_TEXT,
    source_url: null,
    working_title: 'Recommendation Brief',
    objective: 'Demonstrate recommendation persistence boundaries.',
    target_audience: 'Product marketers',
    publishing_destination: 'youtube',
    aspect_ratio: '16:9',
    video_category: 'product_advertisement',
    duration_seconds: 30,
    visual_style: 'Clean and modern',
    tone: 'Confident',
    budget_priority: 'balanced',
    quality_priority: 'balanced',
    requires_character_consistency: true,
    requires_lip_sync: true,
    requires_dialogue: false,
    requires_product_consistency: false,
    requires_logo_accuracy: false,
    requires_exact_text_visibility: false,
    requires_native_audio: false,
    requires_voiceover: false,
    requires_multiple_locations: false,
    requires_camera_control: false,
    requires_first_last_frame_control: false,
    requires_video_extension: false,
    requires_reference_images: false,
    requires_commercial_use: false,
  });

  const { error } = await client.rpc('prompt_pilot_complete_video_brief', {
    project_uuid: projectId,
  });

  if (error) {
    fail('complete brief');
  }
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

async function columnExists(client, tableName, columnName) {
  const { error } = await client.from(tableName).select(columnName, { head: true, count: 'exact' });
  return !error;
}

async function rpcExists(client, rpcName) {
  const { error } = await client.rpc(rpcName, {});
  if (!error) {
    return true;
  }
  return !error.message.includes('Could not find the function');
}

async function main() {
  assertConfigured();

  const userA = await signUpUser('recommendations-a');
  console.log('PASS: user signup');

  const userB = await signUpUser('recommendations-b');
  console.log('PASS: second user signup');

  const { data: projectA, error: projectAError } = await userA.client
    .from('projects')
    .insert({ owner_id: userA.userId, title: 'Recommendation Alpha', description: null })
    .select('id')
    .single();

  if (projectAError || !projectA) {
    fail('project creation');
  }
  console.log('PASS: project creation');

  await completeBrief(userA.client, projectA.id);
  console.log('PASS: completed brief with requirements');

  const { data: briefRow } = await userA.client
    .from('video_briefs')
    .select('requires_lip_sync, duration_seconds')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (!briefRow || briefRow.requires_lip_sync !== true || briefRow.duration_seconds !== 30) {
    fail('saved production requirements readable');
  }
  console.log('PASS: saved production requirements readable');

  const anon = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: providers } = await anon.from('ai_video_providers').select('id, lifecycle_status, recommendation_eligible');

  if (!providers || providers.length !== 5) {
    fail('exactly five provider records');
  }
  console.log('PASS: exactly five provider records');

  const sora = providers.find((entry) => entry.id === 'openai_sora');
  if (!sora || sora.lifecycle_status !== 'sunsetting' || sora.recommendation_eligible !== false) {
    fail('Sora sunsetting and ineligible');
  }
  console.log('PASS: Sora sunsetting and ineligible');

  const { data: facts } = await anon.from('ai_video_capability_facts').select('id, source_id');

  if (!facts || facts.length === 0) {
    fail('capability facts exist');
  }

  for (const fact of facts) {
    if (!fact.source_id) {
      fail('every capability fact has official source');
    }
  }
  console.log('PASS: every capability fact has official source');

  for (const table of FORBIDDEN_TABLES) {
    const absent = await forbiddenTableAbsent(table);
    if (!absent) {
      fail(`forbidden table absent: ${table}`);
    }
  }
  console.log('PASS: no recommendation tables exist');

  if (await columnExists(userA.client, 'video_briefs', 'recommended_provider_id')) {
    fail('no selected-provider column on video_briefs');
  }
  console.log('PASS: no selected-provider column on video_briefs');

  if (await columnExists(userA.client, 'projects', 'recommended_provider_id')) {
    fail('no selected-provider column on projects');
  }
  console.log('PASS: no selected-provider column on projects');

  const recommendationRpcExists = await rpcExists(userA.client, 'prompt_pilot_recommend_provider');
  if (recommendationRpcExists) {
    fail('no recommendation RPC exists');
  }
  console.log('PASS: no recommendation RPC exists');

  const { error: recommendationInsertError } = await userA.client.from('provider_recommendations').insert({
    project_id: projectA.id,
    provider_id: 'runway',
  });
  if (!recommendationInsertError) {
    fail('no recommendation row persisted');
  }
  console.log('PASS: no recommendation row persisted');

  const { error: catalogueInsertError } = await userA.client.from('ai_video_providers').insert({
    id: 'runway',
    display_name: 'Injected',
    vendor_name: 'Injected',
    summary: 'Attempted catalogue mutation during recommendation boundary test.',
    lifecycle_status: 'active',
    api_access_status: 'public',
    recommendation_eligible: true,
    verified_at: new Date().toISOString(),
    review_due_at: new Date(Date.now() + 86400000).toISOString(),
  });
  if (!catalogueInsertError) {
    fail('catalogue mutation blocked');
  }
  console.log('PASS: catalogue mutation blocked');

  const { data: projectB } = await userB.client
    .from('projects')
    .insert({ owner_id: userB.userId, title: 'Recommendation Beta', description: null })
    .select('id')
    .single();

  if (!projectB) {
    fail('second project creation');
  }

  await completeBrief(userB.client, projectB.id);

  const { data: foreignBrief } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectB.id)
    .maybeSingle();

  if (foreignBrief) {
    fail('cross-user brief access blocked');
  }
  console.log('PASS: cross-user brief access blocked');

  await userA.client
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', projectA.id);

  const { data: archivedBrief } = await userA.client
    .from('video_briefs')
    .select('duration_seconds')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (!archivedBrief) {
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

  console.log('PASS: provider recommendation local integration complete');
}

main().catch(() => {
  console.error('FAIL: unexpected recommendation integration error');
  process.exit(1);
});
