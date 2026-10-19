import { describe, expect, it } from 'vitest';
import { createDefaultJobLifecycleService } from '../../src/server/job/index.js';
import { createDefaultJobOrchestrator } from '../../src/server/orchestration/index.js';
import { createCacheCoordinator } from '../../src/server/cache/cache-coordinator.js';
import { executeCacheLookupStage } from '../../src/server/cache/cache-lookup-stage-runner.js';
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
} from './test-doubles.js';

const JOB = 'job-001';
const REFERENCE = 'reference-001';

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

describe('executeCacheLookupStage orchestration integration', () => {
  it('completes cache miss and advances to core_analysis', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const cacheRepository = new InMemoryCacheRepository();
    cacheRepository.setFingerprintVersion(
      TEST_FINGERPRINT.fingerprintId,
      TEST_FINGERPRINT.fingerprintAlgorithmVersion,
    );
    const coordinator = createCacheCoordinator({
      cacheRepository,
      analysisRepository: new InMemoryAnalysisRepository(),
    });

    const context = await advanceToCacheLookupStage(orchestrator);

    const executed = await executeCacheLookupStage(orchestrator, coordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      ...TEST_FINGERPRINT,
    });

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.data.context.plan.skippedStageIds).not.toContain('core_analysis');
      expect(executed.data.context.job.state).toBe('fingerprinting');
      expect(orchestrator.getNextStage(executed.data.context)).toBe('core_analysis');
      expect(executed.data.events).toContain('stage_completed');
    }
  });

  it('short-circuits core_analysis on cache hit', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const cacheRepository = new InMemoryCacheRepository();
    const analysisRepository = new InMemoryAnalysisRepository();
    seedCacheHit(cacheRepository, analysisRepository);
    const coordinator = createCacheCoordinator({ cacheRepository, analysisRepository });

    const context = await advanceToCacheLookupStage(orchestrator);

    const executed = await executeCacheLookupStage(orchestrator, coordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      ...TEST_FINGERPRINT,
    });

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.data.context.plan.skippedStageIds).toContain('core_analysis');
      expect(executed.data.context.job.state).toBe('generating_packages');
      expect(executed.data.context.analysisId).toBe(TEST_ANALYSIS_ID);
      expect(orchestrator.getNextStage(executed.data.context)).toBe('package_generation');
    }
  });

  it('continues to core_analysis after corrupt entry invalidation (G-33)', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const cacheRepository = new InMemoryCacheRepository();
    const analysisRepository = new InMemoryAnalysisRepository();
    seedCacheHit(cacheRepository, analysisRepository);
    analysisRepository.remove(TEST_SCOPE, TEST_ANALYSIS_ID);
    const coordinator = createCacheCoordinator({ cacheRepository, analysisRepository });

    const context = await advanceToCacheLookupStage(orchestrator);

    const executed = await executeCacheLookupStage(orchestrator, coordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      ...TEST_FINGERPRINT,
    });

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.data.context.plan.skippedStageIds).not.toContain('core_analysis');
      expect(orchestrator.getNextStage(executed.data.context)).toBe('core_analysis');
    }
  });

  it('propagates cache_corrupt when invalidation fails', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const cacheRepository = new InMemoryCacheRepository();
    const analysisRepository = new InMemoryAnalysisRepository();
    seedCacheHit(cacheRepository, analysisRepository);
    analysisRepository.remove(TEST_SCOPE, TEST_ANALYSIS_ID);
    cacheRepository.setInvalidateShouldFail(true);
    const coordinator = createCacheCoordinator({ cacheRepository, analysisRepository });

    const context = await advanceToCacheLookupStage(orchestrator);

    const executed = await executeCacheLookupStage(orchestrator, coordinator, context, {
      occurredAt: TEST_TIMESTAMP,
      ...TEST_FINGERPRINT,
    });

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.data.context.job.state).toBe('retry_pending');
      expect(executed.data.context.job.failure?.code).toBe('cache_corrupt');
    }
  });

  it('fails when fingerprint context is missing', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const coordinator = createCacheCoordinator({
      cacheRepository: new InMemoryCacheRepository(),
      analysisRepository: new InMemoryAnalysisRepository(),
    });

    const context = await advanceToCacheLookupStage(orchestrator);

    const executed = await executeCacheLookupStage(orchestrator, coordinator, context, {
      occurredAt: TEST_TIMESTAMP,
    });

    expect(executed.ok).toBe(true);
    if (executed.ok) {
      expect(executed.data.context.job.state).toBe('failed');
      expect(executed.data.context.job.failure?.category).toBe('validation');
    }
  });
});
