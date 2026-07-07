import { describe, expect, it, vi } from 'vitest';
import type { EntityId } from '../../src/domain/canonical/primitives.js';
import type { LinkMetadata } from '../../src/domain/link/index.js';
import { createDefaultJobLifecycleService } from '../../src/server/job/index.js';
import { createDefaultJobOrchestrator } from '../../src/server/orchestration/index.js';
import { createCoreAnalysisCoordinator } from '../../src/server/analysis/core-analysis-coordinator.js';
import { executeCoreAnalysisStage } from '../../src/server/analysis/core-analysis-stage-runner.js';
import type { CoreAnalysisCoordinator } from '../../src/server/analysis/core-analysis-coordinator.js';
import { createMockAnalysisProvider } from '../../src/server/analysis/mock-analysis-provider.js';

const TIMESTAMP = '2026-07-07T12:00:00.000Z';
const OWNER = 'owner-001' as EntityId;
const PROJECT = 'project-001' as EntityId;
const REFERENCE = 'reference-001' as EntityId;
const JOB = 'job-001' as EntityId;
const FINGERPRINT_ID = 'fingerprint-001' as EntityId;

function sampleLinkMetadata(): LinkMetadata {
  return {
    linkMetadataId: 'link-meta-001' as EntityId,
    referenceId: REFERENCE,
    projectId: PROJECT,
    ownerId: OWNER,
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
    extractedAt: TIMESTAMP,
    linkMetadataVersion: '1.0.0',
  };
}

async function advanceToCoreAnalysisStage(
  orchestrator: ReturnType<typeof createDefaultJobOrchestrator>,
) {
  const started = orchestrator.start({
    jobId: JOB,
    projectId: PROJECT,
    ownerId: OWNER,
    referenceId: REFERENCE,
    referenceKind: 'youtube_url',
    occurredAt: TIMESTAMP,
  });
  expect(started.ok).toBe(true);
  if (!started.ok) {
    throw new Error('start failed');
  }

  let context = started.data.context;
  for (const stageId of ['validation', 'ownership', 'link_intelligence', 'fingerprint', 'cache_lookup'] as const) {
    const step = orchestrator.completeStage(context, {
      stageId,
      jobId: JOB,
      completedAt: TIMESTAMP,
      outcome: 'success',
      ...(stageId === 'cache_lookup' ? { cacheHit: false } : {}),
    });
    expect(step.ok).toBe(true);
    if (step.ok) {
      context = step.data.context;
    }
  }

  expect(context.currentStageId).toBe('core_analysis');
  return context;
}

function createTestCoordinator(analysisId = 'analysis-stage-001' as EntityId) {
  return createCoreAnalysisCoordinator({
    provider: createMockAnalysisProvider(),
    analysisRepository: {
      insert: vi.fn(async (_scope, analysis) => ({ ok: true as const, data: analysis })),
      getById: vi.fn(),
      listByReference: vi.fn(),
      getLatestByReference: vi.fn(async () => ({ ok: true as const, data: null })),
      setLatestVersion: vi.fn(async () => ({ ok: true as const, data: undefined })),
    },
    cacheCoordinator: {
      writeEntry: vi.fn(async () => ({
        ok: true as const,
        data: {
          cacheKey: 'cache-key',
          fingerprintId: FINGERPRINT_ID,
          analysisId,
          analysisVersion: 1,
          pipelineVersion: '1.0.0',
          scopeUserId: OWNER,
          expiresAt: '2099-01-01T00:00:00.000Z',
          createdAt: TIMESTAMP,
          hitCount: 0,
        },
      })),
    } as never,
    idGenerator: () => analysisId,
  });
}

describe('executeCoreAnalysisStage', () => {
  it('completes core analysis and binds analysisId on success', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const analysisId = 'analysis-stage-success-001' as EntityId;
    const coordinator = createTestCoordinator(analysisId);
    const context = await advanceToCoreAnalysisStage(orchestrator);

    const executed = await executeCoreAnalysisStage(orchestrator, coordinator, context, {
      occurredAt: TIMESTAMP,
      fingerprintId: FINGERPRINT_ID,
      fingerprintAlgorithmVersion: 1,
      intakeOverride: { linkMetadata: sampleLinkMetadata() },
    });

    expect(executed.ok).toBe(true);
    if (!executed.ok) {
      return;
    }

    expect(executed.data.context.analysisId).toBe(analysisId);
    expect(executed.data.context.job.state).toBe('analyzing');
    expect(executed.data.context.currentStageId).toBe('package_generation');
    expect(executed.data.events).toContain('stage_completed');
  });

  it('propagates failure when fingerprint context is missing', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const coordinator = createTestCoordinator();
    const context = await advanceToCoreAnalysisStage(orchestrator);

    const executed = await executeCoreAnalysisStage(orchestrator, coordinator, context, {
      occurredAt: TIMESTAMP,
      intakeOverride: { linkMetadata: sampleLinkMetadata() },
    });

    expect(executed.ok).toBe(true);
    if (!executed.ok) {
      return;
    }

    expect(executed.data.context.job.failure?.code).toBe('analysis_failed');
    expect(executed.data.context.job.state).toBe('failed');
  });

  it('propagates coordinator failures with canonical job failure codes', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const coordinator = {
      analyzeReference: vi.fn(async () => ({
        ok: false as const,
        code: 'policy_blocked',
        message: 'Scope blocked',
        retryable: false,
      })),
    } satisfies Pick<CoreAnalysisCoordinator, 'analyzeReference'>;
    const context = await advanceToCoreAnalysisStage(orchestrator);

    const executed = await executeCoreAnalysisStage(
      orchestrator,
      coordinator as unknown as CoreAnalysisCoordinator,
      context,
      {
        occurredAt: TIMESTAMP,
        fingerprintId: FINGERPRINT_ID,
        fingerprintAlgorithmVersion: 1,
        intakeOverride: { linkMetadata: sampleLinkMetadata() },
      },
    );

    expect(executed.ok).toBe(true);
    if (!executed.ok) {
      return;
    }

    expect(executed.data.context.job.failure?.code).toBe('policy_blocked');
    expect(executed.data.context.job.failure?.category).toBe('rights');
  });

  it('rejects execution when analysisId is already bound', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const coordinator = createTestCoordinator();
    const context = {
      ...(await advanceToCoreAnalysisStage(orchestrator)),
      analysisId: 'existing-analysis-001' as EntityId,
    };

    const analyzeSpy = vi.spyOn(coordinator, 'analyzeReference');

    const executed = await executeCoreAnalysisStage(orchestrator, coordinator, context, {
      occurredAt: TIMESTAMP,
      fingerprintId: FINGERPRINT_ID,
      fingerprintAlgorithmVersion: 1,
      intakeOverride: { linkMetadata: sampleLinkMetadata() },
    });

    expect(analyzeSpy).not.toHaveBeenCalled();
    expect(executed.ok).toBe(true);
    if (!executed.ok) {
      return;
    }

    expect(executed.data.context.job.failure?.code).toBe('analysis_failed');
  });

  it('invokes coordinator with assembled request and intakeOverride', async () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });
    const coordinator = createTestCoordinator();
    const analyzeSpy = vi.spyOn(coordinator, 'analyzeReference');
    const context = await advanceToCoreAnalysisStage(orchestrator);
    const linkMetadata = sampleLinkMetadata();

    await executeCoreAnalysisStage(orchestrator, coordinator, context, {
      occurredAt: TIMESTAMP,
      fingerprintId: FINGERPRINT_ID,
      fingerprintAlgorithmVersion: 1,
      intakeOverride: { linkMetadata },
    });

    expect(analyzeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: JOB,
        referenceId: REFERENCE,
        projectId: PROJECT,
        ownerId: OWNER,
        referenceKind: 'youtube_url',
        fingerprintId: FINGERPRINT_ID,
        fingerprintAlgorithmVersion: 1,
        intake: {},
        intakeOverride: { linkMetadata },
      }),
    );
  });
});
