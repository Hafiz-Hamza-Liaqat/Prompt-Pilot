import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const VALID_IDEA_TEXT =
  'A compelling summer product launch concept for urban professionals.';

const FORBIDDEN_TABLES = [
  'complexity_scores',
  'risk_scores',
  'assessments',
  'planning_assessments',
  'provider_recommendations',
  'scenes',
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
    options: { data: { display_name: 'Scoring Tester' } },
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

async function completeBrief(client, projectId, options = {}) {
  const {
    durationSeconds = 30,
    heavyRequirements = false,
  } = options;

  await saveBriefStep(client, projectId, {
    source_type: 'idea',
    source_text: VALID_IDEA_TEXT,
    source_url: null,
    working_title: 'Scoring Brief',
    objective: 'Demonstrate complexity and execution-risk persistence boundaries.',
    target_audience: 'Product marketers',
    publishing_destination: 'youtube',
    aspect_ratio: '16:9',
    video_category: 'product_advertisement',
    duration_seconds: durationSeconds,
    visual_style: 'Clean and modern',
    tone: 'Confident',
    budget_priority: 'balanced',
    quality_priority: 'balanced',
    requires_character_consistency: heavyRequirements,
    requires_product_consistency: heavyRequirements,
    requires_logo_accuracy: heavyRequirements,
    requires_exact_text_visibility: heavyRequirements,
    requires_native_audio: heavyRequirements,
    requires_dialogue: heavyRequirements,
    requires_voiceover: heavyRequirements,
    requires_lip_sync: heavyRequirements,
    requires_multiple_locations: heavyRequirements,
    requires_camera_control: heavyRequirements,
    requires_first_last_frame_control: heavyRequirements,
    requires_video_extension: heavyRequirements,
    requires_reference_images: heavyRequirements,
    requires_commercial_use: heavyRequirements,
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

async function main() {
  assertConfigured();

  const userA = await signUpUser('scoring-a');
  console.log('PASS: user signup');

  const userB = await signUpUser('scoring-b');
  console.log('PASS: second user signup');

  const { data: projectA, error: projectAError } = await userA.client
    .from('projects')
    .insert({ owner_id: userA.userId, title: 'Scoring Alpha', description: null })
    .select('id')
    .single();

  if (projectAError || !projectA) {
    fail('project creation');
  }
  console.log('PASS: project creation');

  const { data: projectB } = await userB.client
    .from('projects')
    .insert({ owner_id: userB.userId, title: 'Scoring Beta', description: null })
    .select('id')
    .single();

  if (!projectB) {
    fail('second project creation');
  }

  await completeBrief(userA.client, projectA.id, { durationSeconds: 30, heavyRequirements: false });
  console.log('PASS: minimal completed brief');

  await completeBrief(userB.client, projectB.id, { durationSeconds: 60, heavyRequirements: true });
  console.log('PASS: requirement-heavy completed brief');

  const { data: briefA } = await userA.client
    .from('video_briefs')
    .select('duration_seconds, requires_dialogue, requires_lip_sync')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (!briefA || briefA.duration_seconds !== 30) {
    fail('saved duration readable');
  }
  console.log('PASS: saved duration readable');

  if (briefA.requires_dialogue !== false || briefA.requires_lip_sync !== false) {
    fail('saved requirement booleans readable');
  }
  console.log('PASS: saved requirement booleans readable');

  const { data: foreignBrief } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectB.id)
    .maybeSingle();

  if (foreignBrief) {
    fail('cross-user brief access blocked');
  }
  console.log('PASS: cross-user brief access blocked');

  const anon = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: providersBefore } = await anon
    .from('ai_video_providers')
    .select('id')
    .order('id');

  if (!providersBefore || providersBefore.length !== 5) {
    fail('provider catalogue unchanged');
  }
  console.log('PASS: provider catalogue unchanged');

  for (const table of FORBIDDEN_TABLES) {
    const absent = await forbiddenTableAbsent(table);
    if (!absent) {
      fail(`forbidden table absent: ${table}`);
    }
  }
  console.log('PASS: no scoring tables exist');

  if (await columnExists(userA.client, 'video_briefs', 'complexity_score')) {
    fail('no complexity score column on video_briefs');
  }
  console.log('PASS: no complexity score column on video_briefs');

  if (await columnExists(userA.client, 'video_briefs', 'execution_risk_score')) {
    fail('no execution risk score column on video_briefs');
  }
  console.log('PASS: no execution risk score column on video_briefs');

  if (await columnExists(userA.client, 'projects', 'complexity_score')) {
    fail('no complexity score column on projects');
  }
  console.log('PASS: no complexity score column on projects');

  const { error: assessmentInsertError } = await userA.client.from('complexity_scores').insert({
    project_id: projectA.id,
    score: 50,
  });
  if (!assessmentInsertError) {
    fail('no assessment row persisted');
  }
  console.log('PASS: no assessment row persisted');

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

  console.log('PASS: complexity-risk local integration complete');
}

main().catch(() => {
  console.error('FAIL: unexpected complexity-risk integration error');
  process.exit(1);
});
