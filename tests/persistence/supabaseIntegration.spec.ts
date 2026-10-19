import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { validPromptPackageEnvelopeFixture } from '../fixtures/validPackageEnvelope.js';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';
import {
  buildCacheLookupKey,
  buildIdentityDescriptor,
  createSupabasePivotRepositoryRegistry,
} from '../../src/server/persistence/index.js';
import type { OwnerScope } from '../../src/server/persistence/contracts/index.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasLocalSupabase = Boolean(url && publishableKey);

function randomSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function uuid() {
  return crypto.randomUUID();
}

describe.skipIf(!hasLocalSupabase)('supabase pivot repository integration', () => {
  let clientA: SupabaseClient;
  let clientB: SupabaseClient;
  let userAId: string;
  let userBId: string;
  let projectAId: string;
  let scopeA: OwnerScope;
  let referenceId: string;
  let fingerprintId: string;
  let analysisId: string;
  let jobId: string;
  let packageId: string;

  beforeAll(async () => {
    const emailA = `pivot-repo-a-${randomSuffix()}@test.local`;
    const emailB = `pivot-repo-b-${randomSuffix()}@test.local`;
    const password = `Pw-${randomSuffix()}!`;

    clientA = createClient(url!, publishableKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    clientB = createClient(url!, publishableKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const signupA = await clientA.auth.signUp({
      email: emailA,
      password,
      options: { data: { display_name: 'Pivot Repo A' } },
    });
    const signupB = await clientB.auth.signUp({
      email: emailB,
      password,
      options: { data: { display_name: 'Pivot Repo B' } },
    });

    if (!signupA.data.session || !signupB.data.session) {
      throw new Error('Failed to sign up integration test users');
    }

    userAId = signupA.data.user!.id;
    userBId = signupB.data.user!.id;

    const { data: projectA } = await clientA
      .from('projects')
      .insert({ owner_id: userAId, title: 'Pivot Integration Project' })
      .select('id')
      .single();

    if (!projectA) {
      throw new Error('Failed to create project');
    }

    projectAId = projectA.id;
    scopeA = { ownerId: userAId, projectId: projectAId };
    referenceId = uuid();
    fingerprintId = uuid();
    analysisId = uuid();
    jobId = uuid();
    packageId = uuid();
  });

  afterAll(async () => {
    await clientA.auth.signOut();
    await clientB.auth.signOut();
  });

  it('persists reference, fingerprint, analysis, job, package, cache, and export', async () => {
    const repos = createSupabasePivotRepositoryRegistry(clientA);

    const referenceResult = await repos.referenceRepository.insert(
      scopeA,
      {
        referenceKind: 'youtube_url',
        platform: 'youtube',
        canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        platformContentId: 'dQw4w9WgXcQ',
        title: 'Integration reference',
        accessStatus: 'public',
      },
      referenceId,
    );
    expect(referenceResult.ok).toBe(true);

    const fingerprintInputs = [
      { factor: 'platform_content_id', descriptor: 'dQw4w9WgXcQ' },
      { factor: 'reference_kind', descriptor: 'youtube_url' },
    ];
    const fingerprintResult = await repos.fingerprintRepository.insertCandidate(scopeA, {
      fingerprintId,
      referenceKind: 'youtube_url',
      fingerprintAlgorithmVersion: 1,
      fingerprintInputs,
      state: 'candidate',
      createdAt: new Date().toISOString(),
    });
    expect(fingerprintResult.ok).toBe(true);

    const promoteResult = await repos.fingerprintRepository.promoteToActive(scopeA, {
      fingerprintId,
      fromState: 'candidate',
      toState: 'active',
    });
    expect(promoteResult.ok).toBe(true);

    const lookupResult = await repos.fingerprintRepository.lookupByIdentity(scopeA, {
      referenceKind: 'youtube_url',
      fingerprintAlgorithmVersion: 1,
      identityDescriptor: buildIdentityDescriptor(fingerprintInputs),
      scopeUserId: userAId,
    });
    expect(lookupResult.ok).toBe(true);
    if (lookupResult.ok) {
      expect(lookupResult.data?.fingerprintId).toBe(fingerprintId);
    }

    const analysisPayload = {
      ...validReferenceVideoAnalysisFixture,
      analysisId,
      projectId: projectAId,
      referenceId,
      fingerprintId,
    };

    const analysisResult = await repos.analysisRepository.insert(scopeA, analysisPayload);
    expect(analysisResult.ok).toBe(true);

    const jobResult = await repos.jobRepository.create(
      scopeA,
      { referenceId },
      jobId,
    );
    expect(jobResult.ok).toBe(true);

    const transitionResult = await repos.jobRepository.transitionState(scopeA, {
      jobId,
      expectedState: 'created',
      nextState: 'queued',
      progressPercent: 5,
    });
    expect(transitionResult.ok).toBe(true);

    const packagePayload = {
      ...validPromptPackageEnvelopeFixture,
      packageId,
      projectId: projectAId,
      referenceId,
      analysisId,
      createdByJobId: jobId,
    };
    const packageResult = await repos.packageRepository.insert(scopeA, packagePayload);
    expect(packageResult.ok).toBe(true);

    const cacheKey = buildCacheLookupKey(fingerprintId, 1, userAId);
    const cachePutResult = await repos.cacheRepository.put(scopeA, {
      cacheKey,
      fingerprintId,
      analysisId,
      analysisVersion: 1,
      pipelineVersion: '1.0.0',
      scopeUserId: userAId,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(cachePutResult.ok).toBe(true);

    const cacheLookupResult = await repos.cacheRepository.lookup(scopeA, fingerprintId, 1);
    expect(cacheLookupResult.ok).toBe(true);
    if (cacheLookupResult.ok) {
      expect(cacheLookupResult.data.hit).toBe(true);
    }

    const exportResult = await repos.exportRepository.insert(
      scopeA,
      {
        referenceId,
        packageIds: [packageId],
        format: 'json',
        title: 'Integration export',
        createdByUserId: userAId,
        transformationNotice: 'Transformative export notice',
      },
      uuid(),
    );
    expect(exportResult.ok).toBe(true);

    const bundleResult = await repos.workspaceRepository.getIntelligenceBundle(scopeA, {
      referenceId,
      includePackages: true,
    });
    expect(bundleResult.ok).toBe(true);
    if (bundleResult.ok) {
      expect(bundleResult.data.reference?.referenceId).toBe(referenceId);
      expect(bundleResult.data.analysis?.analysisId).toBe(analysisId);
      expect(bundleResult.data.packages).toHaveLength(1);
      expect(bundleResult.data.activeJob?.jobId).toBe(jobId);
    }
  });

  it('enforces owner scope isolation for references', async () => {
    const reposB = createSupabasePivotRepositoryRegistry(clientB);
    const foreignScope: OwnerScope = { ownerId: userBId, projectId: projectAId };

    const foreignRead = await reposB.referenceRepository.getById(foreignScope, referenceId);
    expect(foreignRead.ok).toBe(false);
    if (!foreignRead.ok) {
      expect(foreignRead.code).toBe('not_found');
    }
  });

  it('detects optimistic job transition conflicts', async () => {
    const repos = createSupabasePivotRepositoryRegistry(clientA);
    const conflictResult = await repos.jobRepository.transitionState(scopeA, {
      jobId,
      expectedState: 'created',
      nextState: 'validated',
      progressPercent: 10,
    });
    expect(conflictResult.ok).toBe(false);
    if (!conflictResult.ok) {
      expect(conflictResult.code).toBe('conflict');
    }
  });
});
