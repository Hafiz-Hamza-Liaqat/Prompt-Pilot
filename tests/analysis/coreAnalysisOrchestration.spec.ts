import { describe, expect, it, vi } from 'vitest';
import type { EntityId } from '../../src/domain/canonical/primitives.js';
import type { LinkMetadata } from '../../src/domain/link/index.js';
import { createDefaultJobLifecycleService } from '../../src/server/job/index.js';
import { createDefaultJobOrchestrator } from '../../src/server/orchestration/index.js';
import { createCacheCoordinator } from '../../src/server/cache/cache-coordinator.js';
import { executeCacheLookupStage } from '../../src/server/cache/cache-lookup-stage-runner.js';
import { createCoreAnalysisCoordinator } from '../../src/server/analysis/core-analysis-coordinator.js';
import { executeCoreAnalysisStage } from '../../src/server/analysis/core-analysis-stage-runner.js';
import { createMockAnalysisProvider } from '../../src/server/analysis/mock-analysis-provider.js';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';
import {
  InMemoryAnalysisRepository,
  InMemoryCacheRepository,
  TEST_ANALYSIS_ID,
  TEST_CACHE_KEY,
  TEST_EXPIRES,
  TEST_FINGERPRINT,
  TEST_SCOPE,
  TEST_TIMESTAMP,
} from '../cache/test-doubles.js';

const JOB = 'job-001';
const REFERENCE = 'reference-001';

function sampleLinkMetadata(): LinkMetadata {
  return {
    linkMetadataId: 'link-meta-001' as EntityId,
    referenceId: REFERENCE as EntityId,
    projectId: TEST_SCOPE.projectId,
    ownerId: TEST_SCOPE.ownerId,
    referenceKind: 'youtube_url',
    platform: 'youtube',
    platformContentId: 'dQw4w9WgXcQ',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Sample video',
    durationSeconds: 120,
    accessStatus: 'public',
    providerId: 'mock',
    extractionMethod: 'mock',
    extractedAt: TEST_TIMESTAMP,
    linkMetadataVersion: '1.0.0',
  };
}

async function advanceToCacheLookupStage(
  orchestrator: ReturnType<typeof createDefaultJobOrchestrator>,
) {
  const started = orchestrator.start({
    jobId: JOB,
    projectId: TEST_SCOPE.projectId,
    ownerId: TEST_SCOPE.ownerId,
    referenceId: REFERENCE,
    referenceKind: 'youtube_url',
    occurredAt: TEST_TIMESTAMP,
  });
  expect(started.ok).toBe(true);
  if (!started.ok) {
    throw new Error('start failed');
  }

  let context = started.data.context;
  for (const stageId of ['validation', 'ownership', 'link_intelligence', 'fingerprint'] as const) {
    const step = orchestrator.completeStage(context, {
      stageId,
      jobId: JOB,
      completedAt: TEST_TIMESTAMP,
      outcome: 'success',
    });
    expect(step.ok).toBe(true);
    if (step.ok) {
      context = step.data.context;
    }
  }

  expect(context.currentStageId).toBe('cache_lookup');
  return context;
}

function seedCacheHit(
  cacheRepository: InMemoryCacheRepository,
  analysisRepository: InMemoryAnalysisRepository,
) {
  cacheRepository.setFingerprintVersion(
    TEST_FINGERPRINT.fingerprintId,
    TEST_FINGERPRINT.fingerprintAlgorithmVersion,
  );
  cacheRepository.seedEntry(TEST_SCOPE, {
    cacheKey: TEST_CACHE_KEY,
    fingerprintId: TEST_FINGERPRINT.fingerprintId,
    analysisId: TEST_ANALYSIS_ID,
    analysisVersion: 1,
    pipelineVersion: '1.0.0',
    scopeUserId: TEST_SCOPE.ownerId,
    expiresAt: TEST_EXPIRES,
  });
  analysisRepository.seed(TEST_SCOPE, {
    ...validReferenceVideoAnalysisFixture,
    analysisId: TEST_ANALYSIS_ID,
    projectId: TEST_SCOPE.projectId,
    referenceId: REFERENCE,
    fingerprintId: TEST_FINGERPRINT.fingerprintId,
  });
}

function createAnalysisStack(analysisId = 'analysis-orchestration-001' as EntityId) {
  const analysisRepository = new InMemoryAnalysisRepository();
  const cacheRepository = new InMemoryCacheRepository();
  const cacheCoordinator = createCacheCoordinator({ analysisRepository, cacheRepository });
  const coordinator = createCoreAnalysisCoordinator({
    provider: createMockAnalysisProvider(),
    analysisRepository,
    cacheCoordinator,
    idGenerator: () => analysisId,
  });

  return { coordinator, analysisRepository, cacheRepository, analysisId };
}

describe('executeCoreAnalysisStage orchestration integration', () => {
  it('advances cache miss path through core_analysis to package_generation', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const cacheRepository = new InMemoryCacheRepository();
    cacheRepository.setFingerprintVersion(
      TEST_FINGERPRINT.fingerprintId,
      TEST_FINGERPRINT.fingerprintAlgorithmVersion,
    );
    const cacheCoordinator = createCacheCoordinator({
      cacheRepository,
      analysisRepository: new InMemoryAnalysisRepository(),
    });
    const { coordinator, analysisId } = createAnalysisStack();

    let context = await advanceToCacheLookupStage(orchestrator);

    const cacheLookup = await executeCacheLookupStage(orchestrator, cacheCoordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      ...TEST_FINGERPRINT,
    });
    expect(cacheLookup.ok).toBe(true);
    if (!cacheLookup.ok) {
      return;
    }

    context = cacheLookup.data.context;
    expect(orchestrator.getNextStage(context)).toBe('core_analysis');

    const coreAnalysis = await executeCoreAnalysisStage(orchestrator, coordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      intakeOverride: { linkMetadata: sampleLinkMetadata() },
    });

    expect(coreAnalysis.ok).toBe(true);
    if (!coreAnalysis.ok) {
      return;
    }

    expect(coreAnalysis.data.context.analysisId).toBe(analysisId);
    expect(coreAnalysis.data.context.job.state).toBe('analyzing');
    expect(orchestrator.getNextStage(coreAnalysis.data.context)).toBe('package_generation');
    expect(coreAnalysis.data.context.plan.skippedStageIds).not.toContain('core_analysis');
  });

  it('does not invoke core analysis when cache hit already skipped the stage', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const cacheRepository = new InMemoryCacheRepository();
    const analysisRepository = new InMemoryAnalysisRepository();
    seedCacheHit(cacheRepository, analysisRepository);
    const cacheCoordinator = createCacheCoordinator({ cacheRepository, analysisRepository });
    const { coordinator } = createAnalysisStack('analysis-should-not-run' as EntityId);
    const analyzeSpy = vi.spyOn(coordinator, 'analyzeReference');

    const context = await advanceToCacheLookupStage(orchestrator);

    const cacheLookup = await executeCacheLookupStage(orchestrator, cacheCoordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      ...TEST_FINGERPRINT,
    });

    expect(cacheLookup.ok).toBe(true);
    if (!cacheLookup.ok) {
      return;
    }

    const nextContext = cacheLookup.data.context;
    expect(nextContext.plan.skippedStageIds).toContain('core_analysis');
    expect(nextContext.analysisId).toBe(TEST_ANALYSIS_ID);
    expect(orchestrator.getNextStage(nextContext)).toBe('package_generation');
    expect(analyzeSpy).not.toHaveBeenCalled();
  });

  it('propagates storage_error when coordinator cache write fails after insert', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const cacheRepository = new InMemoryCacheRepository();
    cacheRepository.setFingerprintVersion(
      TEST_FINGERPRINT.fingerprintId,
      TEST_FINGERPRINT.fingerprintAlgorithmVersion,
    );
    const lookupCacheCoordinator = createCacheCoordinator({
      cacheRepository,
      analysisRepository: new InMemoryAnalysisRepository(),
    });
    const analysisId = 'analysis-storage-fail-001' as EntityId;
    const analysisRepository = new InMemoryAnalysisRepository();
    const writeCacheCoordinator = createCacheCoordinator({ analysisRepository, cacheRepository });
    cacheRepository.setPutShouldFail(true);
    const coordinator = createCoreAnalysisCoordinator({
      provider: createMockAnalysisProvider(),
      analysisRepository,
      cacheCoordinator: writeCacheCoordinator,
      idGenerator: () => analysisId,
    });

    let context = await advanceToCacheLookupStage(orchestrator);
    const cacheLookup = await executeCacheLookupStage(orchestrator, lookupCacheCoordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      ...TEST_FINGERPRINT,
    });
    expect(cacheLookup.ok).toBe(true);
    if (!cacheLookup.ok) {
      return;
    }

    const executed = await executeCoreAnalysisStage(
      orchestrator,
      coordinator,
      cacheLookup.data.context,
      {
        occurredAt: TEST_TIMESTAMP,
        intakeOverride: { linkMetadata: sampleLinkMetadata() },
      },
    );

    expect(executed.ok).toBe(true);
    if (!executed.ok) {
      return;
    }

    expect(executed.data.context.job.failure?.code).toBe('storage_error');
    expect(executed.data.context.job.state).toBe('retry_pending');
    expect(analysisRepository.getStored(TEST_SCOPE, analysisId)).toBeDefined();
  });
});
