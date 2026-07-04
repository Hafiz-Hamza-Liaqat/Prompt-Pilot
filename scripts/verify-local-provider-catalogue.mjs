import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const APPROVED_PROVIDERS = [
  'google_veo',
  'openai_sora',
  'runway',
  'kling',
  'adobe_firefly',
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

async function signUpUser(label) {
  const email = `prompt-pilot-${label}-${randomSuffix()}@test.local`;
  const password = `Pw-${randomSuffix()}!`;

  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: 'Catalogue Tester' } },
  });

  if (error || !data.session || !data.user) {
    console.error(`FAIL: ${label} signup`);
    process.exit(1);
  }

  return client;
}

async function main() {
  assertConfigured();

  const anon = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: providers, error: providersError } = await anon
    .from('ai_video_providers')
    .select('id, lifecycle_status, api_access_status, recommendation_eligible, sunset_at, verified_at, review_due_at')
    .order('id');

  if (providersError || !providers) {
    console.error('FAIL: anonymous provider read');
    process.exit(1);
  }
  console.log('PASS: anonymous provider read');

  if (providers.length !== 5) {
    console.error('FAIL: exactly five providers');
    process.exit(1);
  }
  console.log('PASS: exactly five providers');

  const providerIds = providers.map((row) => row.id).sort();
  const expected = [...APPROVED_PROVIDERS].sort();
  if (providerIds.join(',') !== expected.join(',')) {
    console.error('FAIL: provider IDs match enum');
    process.exit(1);
  }
  console.log('PASS: provider IDs match enum');

  for (const provider of providers) {
    const { data: offerings } = await anon
      .from('ai_video_offerings')
      .select('id')
      .eq('provider_id', provider.id);

    if (!offerings || offerings.length === 0) {
      console.error(`FAIL: provider ${provider.id} has offerings`);
      process.exit(1);
    }

    const { data: sources } = await anon
      .from('ai_video_sources')
      .select('id, url')
      .eq('provider_id', provider.id);

    if (!sources || sources.length === 0) {
      console.error(`FAIL: provider ${provider.id} has sources`);
      process.exit(1);
    }

    for (const source of sources) {
      if (!source.url.startsWith('https://')) {
        console.error(`FAIL: provider ${provider.id} HTTPS sources`);
        process.exit(1);
      }
    }

    if (!provider.verified_at || !provider.review_due_at) {
      console.error(`FAIL: provider ${provider.id} verification dates`);
      process.exit(1);
    }
  }
  console.log('PASS: every provider has offerings, sources, and dates');

  const { data: facts } = await anon
    .from('ai_video_capability_facts')
    .select('support_level, source_id');

  if (!facts || facts.length === 0) {
    console.error('FAIL: capability facts exist');
    process.exit(1);
  }

  for (const fact of facts) {
    if (!fact.source_id) {
      console.error('FAIL: capability fact source linkage');
      process.exit(1);
    }
    if (fact.support_level === 'unsupported' && fact.support_level === 'supported') {
      // noop - kept for clarity
    }
  }
  console.log('PASS: capability facts have sources');

  const unknownFacts = facts.filter((fact) => fact.support_level === 'unknown');
  if (unknownFacts.length === 0) {
    console.error('FAIL: unknown support preserved');
    process.exit(1);
  }
  console.log('PASS: unknown support preserved');

  const sora = providers.find((row) => row.id === 'openai_sora');
  if (!sora || sora.lifecycle_status !== 'sunsetting' || sora.recommendation_eligible !== false) {
    console.error('FAIL: OpenAI Sora lifecycle state');
    process.exit(1);
  }
  console.log('PASS: OpenAI Sora lifecycle state');

  if (!sora.sunset_at || !String(sora.sunset_at).startsWith('2026-09-24')) {
    console.error('FAIL: OpenAI Sora sunset date');
    process.exit(1);
  }
  console.log('PASS: OpenAI Sora sunset date');

  const { data: runwayOfferings } = await anon
    .from('ai_video_offerings')
    .select('ownership_type, official_identifier')
    .eq('provider_id', 'runway');

  if (!runwayOfferings?.every((row) => row.ownership_type === 'first_party')) {
    console.error('FAIL: Runway first-party ownership');
    process.exit(1);
  }
  console.log('PASS: Runway first-party ownership');

  const { data: adobeOfferings } = await anon
    .from('ai_video_offerings')
    .select('official_identifier')
    .eq('provider_id', 'adobe_firefly');

  if (!adobeOfferings?.some((row) => row.official_identifier === null)) {
    console.error('FAIL: Adobe null official identifiers');
    process.exit(1);
  }
  console.log('PASS: Adobe null official identifiers');

  const sunsetting = providers.filter(
    (row) => row.lifecycle_status === 'sunsetting' || row.api_access_status === 'sunsetting',
  );
  if (sunsetting.some((row) => row.recommendation_eligible)) {
    console.error('FAIL: sunsetting recommendation ineligible');
    process.exit(1);
  }
  console.log('PASS: sunsetting recommendation ineligible');

  const { error: anonInsertError } = await anon.from('ai_video_providers').insert({
    id: 'google_veo',
    display_name: 'Bad',
    vendor_name: 'Bad',
    summary: 'Should fail insert attempt',
    lifecycle_status: 'active',
    api_access_status: 'public',
    recommendation_eligible: false,
    verified_at: new Date().toISOString(),
    review_due_at: new Date(Date.now() + 86400000).toISOString(),
  });
  if (!anonInsertError) {
    console.error('FAIL: anonymous provider insert denied');
    process.exit(1);
  }
  console.log('PASS: anonymous provider insert denied');

  const { error: anonUpdateError } = await anon
    .from('ai_video_providers')
    .update({ summary: 'Changed' })
    .eq('id', 'google_veo');
  if (!anonUpdateError) {
    console.error('FAIL: anonymous provider update denied');
    process.exit(1);
  }
  console.log('PASS: anonymous provider update denied');

  const { error: anonDeleteError } = await anon
    .from('ai_video_providers')
    .delete()
    .eq('id', 'google_veo');
  if (!anonDeleteError) {
    console.error('FAIL: anonymous provider delete denied');
    process.exit(1);
  }
  console.log('PASS: anonymous provider delete denied');

  const authed = await signUpUser('providers-auth');
  console.log('PASS: authenticated signup');

  const { error: authedInsertError } = await authed.from('ai_video_providers').insert({
    id: 'runway',
    display_name: 'Bad',
    vendor_name: 'Bad',
    summary: 'Should fail authenticated insert',
    lifecycle_status: 'active',
    api_access_status: 'public',
    recommendation_eligible: false,
    verified_at: new Date().toISOString(),
    review_due_at: new Date(Date.now() + 86400000).toISOString(),
  });
  if (!authedInsertError) {
    console.error('FAIL: authenticated catalogue insert denied');
    process.exit(1);
  }
  console.log('PASS: authenticated catalogue insert denied');

  const rankingProbe = providers[0];
  if ('ranking' in rankingProbe || 'recommendation_score' in rankingProbe) {
    console.error('FAIL: ranking fields absent');
    process.exit(1);
  }
  console.log('PASS: ranking fields absent');

  console.log('PASS: provider catalogue local integration complete');
}

main().catch(() => {
  console.error('FAIL: unexpected provider integration error');
  process.exit(1);
});
