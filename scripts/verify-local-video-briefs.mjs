import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const VALID_IDEA_TEXT =
  'A compelling summer product launch concept for urban professionals.';

const BRIEF_COLUMNS =
  'id, project_id, source_type, source_text, source_url, working_title, objective, target_audience, publishing_destination, aspect_ratio, video_category, duration_seconds, visual_style, tone, requires_character_consistency, requires_product_consistency, requires_logo_accuracy, requires_exact_text_visibility, requires_native_audio, requires_dialogue, requires_voiceover, requires_lip_sync, requires_multiple_locations, requires_camera_control, requires_first_last_frame_control, requires_video_extension, requires_reference_images, requires_commercial_use, budget_priority, quality_priority, user_constraints, completed_at';

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
      .select(BRIEF_COLUMNS)
      .single();
  }

  return client
    .from('video_briefs')
    .insert({ project_id: projectId, ...fields })
    .select(BRIEF_COLUMNS)
    .single();
}

async function saveRemainingWizardSteps(client, projectId) {
  const steps = [
    {
      working_title: 'Summer Launch',
      objective: 'Showcase the new product line to young professionals seeking quality.',
      target_audience: 'Urban professionals aged 25-35',
    },
    {
      publishing_destination: 'youtube',
      aspect_ratio: '16:9',
    },
    {
      video_category: 'product_advertisement',
    },
    {
      duration_seconds: 30,
    },
    {
      visual_style: 'Cinematic',
      tone: 'Upbeat',
    },
    {
      requires_character_consistency: false,
      requires_product_consistency: false,
      requires_logo_accuracy: false,
      requires_exact_text_visibility: false,
      requires_native_audio: false,
      requires_dialogue: false,
      requires_voiceover: true,
      requires_lip_sync: false,
      requires_multiple_locations: false,
      requires_camera_control: false,
      requires_first_last_frame_control: false,
      requires_video_extension: false,
      requires_reference_images: false,
      requires_commercial_use: true,
    },
    {
      budget_priority: 'balanced',
      quality_priority: 'highest_quality',
      user_constraints: null,
    },
  ];

  for (const fields of steps) {
    const { error } = await saveBriefStep(client, projectId, fields, true);

    if (error) {
      fail('user-a saves every remaining step');
    }
  }
}

async function main() {
  assertConfigured();

  const userA = await signUpUser('briefs-a', 'Brief User Alpha');
  console.log('PASS: user-a signup');

  const userB = await signUpUser('briefs-b', 'Brief User Beta');
  console.log('PASS: user-b signup');

  const { data: projectA, error: createAError } = await userA.client
    .from('projects')
    .insert({ owner_id: userA.userId, title: 'Brief Project Alpha', description: 'Alpha brief notes' })
    .select('id')
    .single();

  if (createAError || !projectA) {
    fail('user-a creates active project');
  }
  console.log('PASS: user-a creates active project');

  const { data: projectB, error: createBError } = await userB.client
    .from('projects')
    .insert({ owner_id: userB.userId, title: 'Brief Project Beta', description: null })
    .select('id')
    .single();

  if (createBError || !projectB) {
    fail('user-b creates active project');
  }
  console.log('PASS: user-b creates active project');

  const { error: sourceAError } = await saveBriefStep(userA.client, projectA.id, {
    source_type: 'idea',
    source_text: VALID_IDEA_TEXT,
    source_url: null,
  });

  if (sourceAError) {
    fail('user-a creates source step');
  }
  console.log('PASS: user-a creates source step');

  const { error: incompleteCompleteError } = await userA.client.rpc(
    'prompt_pilot_complete_video_brief',
    { project_uuid: projectA.id },
  );

  const { error: crossInsertError } = await userA.client.from('video_briefs').insert({
    project_id: projectB.id,
    source_type: 'idea',
    source_text: VALID_IDEA_TEXT,
    source_url: null,
  });

  if (!crossInsertError) {
    fail('user-a cannot create brief for user-b project');
  }
  console.log('PASS: user-a cannot create brief for user-b project');

  const { error: sourceBError } = await saveBriefStep(userB.client, projectB.id, {
    source_type: 'idea',
    source_text: VALID_IDEA_TEXT,
    source_url: null,
  });

  if (sourceBError) {
    fail('user-b source step for isolation test');
  }

  const { data: foreignRead } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectB.id)
    .maybeSingle();

  if (foreignRead) {
    fail('user-a cannot read user-b brief');
  }
  console.log('PASS: user-a cannot read user-b brief');

  await saveRemainingWizardSteps(userA.client, projectA.id);
  console.log('PASS: user-a saves every remaining step');

  const { data: invalidDurationUpdate, error: invalidDurationError } = await userA.client
    .from('video_briefs')
    .update({ duration_seconds: 3 })
    .eq('project_id', projectA.id)
    .select('id');

  if (!invalidDurationError && invalidDurationUpdate?.length) {
    fail('invalid duration rejected');
  }
  console.log('PASS: invalid duration rejected');

  if (!incompleteCompleteError) {
    fail('incomplete brief cannot be completed');
  }
  console.log('PASS: incomplete brief cannot be completed');

  const { error: completeError } = await userA.client.rpc('prompt_pilot_complete_video_brief', {
    project_uuid: projectA.id,
  });

  if (completeError) {
    fail('complete valid brief');
  }
  console.log('PASS: complete valid brief');

  const { data: completedBrief, error: completedReadError } = await userA.client
    .from('video_briefs')
    .select('completed_at')
    .eq('project_id', projectA.id)
    .single();

  if (completedReadError || !completedBrief?.completed_at) {
    fail('completed timestamp present');
  }
  console.log('PASS: completed timestamp present');

  const { error: recompleteError } = await userA.client.rpc('prompt_pilot_complete_video_brief', {
    project_uuid: projectA.id,
  });

  if (recompleteError) {
    fail('completing twice is safe');
  }
  console.log('PASS: completing twice is safe');

  const { data: reopenedBrief, error: editError } = await userA.client
    .from('video_briefs')
    .update({ working_title: 'Summer Launch Updated' })
    .eq('project_id', projectA.id)
    .select('completed_at, working_title')
    .single();

  if (editError || reopenedBrief?.completed_at !== null) {
    fail('editing completed brief clears completion');
  }
  console.log('PASS: editing completed brief clears completion');

  const { error: recompleteAfterEditError } = await userA.client.rpc(
    'prompt_pilot_complete_video_brief',
    { project_uuid: projectA.id },
  );

  if (recompleteAfterEditError) {
    fail('re-completing after valid edit');
  }
  console.log('PASS: re-completing after valid edit succeeds');

  const archivedAt = new Date().toISOString();
  const { error: archiveError } = await userA.client
    .from('projects')
    .update({ archived_at: archivedAt })
    .eq('id', projectA.id);

  if (archiveError) {
    fail('archive project for brief test');
  }

  const { data: archivedEdit } = await userA.client
    .from('video_briefs')
    .update({ tone: 'Should fail' })
    .eq('project_id', projectA.id)
    .select('id');

  if (archivedEdit && archivedEdit.length > 0) {
    fail('archiving project prevents brief edits');
  }
  console.log('PASS: archiving project prevents further brief edits');

  const { data: archivedRead, error: archivedReadError } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (archivedReadError || !archivedRead) {
    fail('archived brief readable');
  }
  console.log('PASS: archived brief remains readable by owner');

  const { error: restoreError } = await userA.client
    .from('projects')
    .update({ archived_at: null })
    .eq('id', projectA.id);

  if (restoreError) {
    fail('restore project for brief test');
  }

  const { data: restoredEdit, error: restoredEditError } = await userA.client
    .from('video_briefs')
    .update({ tone: 'Restored tone' })
    .eq('project_id', projectA.id)
    .select('tone')
    .single();

  if (restoredEditError || restoredEdit?.tone !== 'Restored tone') {
    fail('restoring project permits editing again');
  }
  console.log('PASS: restoring project permits editing again');

  const { error: softDeleteError } = await userA.client.rpc('prompt_pilot_soft_delete_project', {
    project_id: projectA.id,
  });

  if (softDeleteError) {
    fail('soft-delete project hides brief');
  }

  const { data: deletedRead } = await userA.client
    .from('video_briefs')
    .select('id')
    .eq('project_id', projectA.id)
    .maybeSingle();

  if (deletedRead) {
    fail('soft-deleted project hides brief');
  }
  console.log('PASS: soft-deleting project hides brief');

  const { data: deletedUpdate } = await userA.client
    .from('video_briefs')
    .update({ tone: 'Hidden update' })
    .eq('project_id', projectA.id)
    .select('id');

  if (deletedUpdate && deletedUpdate.length > 0) {
    fail('user-a cannot update hidden brief');
  }
  console.log('PASS: user-a cannot update hidden brief');

  const { error: hardDeleteError } = await userA.client
    .from('video_briefs')
    .delete()
    .eq('project_id', projectB.id);

  if (!hardDeleteError) {
    fail('direct brief deletion rejected');
  }
  console.log('PASS: direct brief deletion rejected');

  await userA.client.auth.signOut();
  console.log('PASS: user-a signs out');

  await userB.client.auth.signOut();
  console.log('PASS: user-b signs out');

  console.log('PASS: local video briefs integration complete');
}

main().catch(() => {
  console.error('FAIL: local video briefs integration');
  process.exit(1);
});
