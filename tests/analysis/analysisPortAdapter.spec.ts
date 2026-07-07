import { describe, expect, it, vi } from 'vitest';
import { createAnalysisProviderPort } from '../../src/server/analysis/analysis-port-adapter.js';
import type { CoreAnalysisCoordinator } from '../../src/server/analysis/core-analysis-coordinator.js';
import type { EntityId } from '../../src/domain/canonical/primitives.js';

const TIMESTAMP = '2026-07-07T12:00:00.000Z';

function createStubCoordinator(
  analyzeReference: CoreAnalysisCoordinator['analyzeReference'],
): CoreAnalysisCoordinator {
  return { analyzeReference } as CoreAnalysisCoordinator;
}

const resolveInput = () => ({
  referenceKind: 'youtube_url' as const,
  fingerprintId: 'fingerprint-001' as EntityId,
  fingerprintAlgorithmVersion: 1 as const,
  intake: {},
  intakeOverride: {
    linkMetadata: {
      linkMetadataId: 'link-meta-001' as EntityId,
      referenceId: 'ref-001' as EntityId,
      projectId: 'project-001' as EntityId,
      ownerId: 'owner-001' as EntityId,
      referenceKind: 'youtube_url' as const,
      platform: 'youtube' as const,
      platformContentId: 'abc123',
      canonicalUrl: 'https://www.youtube.com/watch?v=abc123',
      originalUrl: 'https://www.youtube.com/watch?v=abc123',
      accessStatus: 'public' as const,
      providerId: 'mock' as const,
      extractionMethod: 'mock' as const,
      extractedAt: TIMESTAMP,
      linkMetadataVersion: '1.0.0',
    },
  },
});

describe('createAnalysisProviderPort', () => {
  it('returns analysisId on coordinator success', async () => {
    const port = createAnalysisProviderPort(
      createStubCoordinator(async () => ({
        ok: true,
        data: {
          analysisId: 'analysis-port-001' as EntityId,
          completedAt: TIMESTAMP,
        },
      })),
      { providerId: 'mock', resolveInput },
    );

    const result = await port.analyze({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      requestedAt: TIMESTAMP,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.analysisId).toBe('analysis-port-001');
      expect(result.data.completedAt).toBe(TIMESTAMP);
    }
    expect(port.providerId).toBe('mock');
  });

  it('preserves canonical job failure codes on coordinator errors', async () => {
    const port = createAnalysisProviderPort(
      createStubCoordinator(async () => ({
        ok: false,
        code: 'policy_blocked',
        message: 'Scope blocked',
        retryable: false,
      })),
      { providerId: 'mock', resolveInput },
    );

    const result = await port.analyze({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      requestedAt: TIMESTAMP,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation_error');
      expect(result.error.jobFailureCode).toBe('policy_blocked');
      expect(result.error.stageId).toBe('core_analysis');
    }
  });

  it('maps unknown coordinator codes to analysis_failed', async () => {
    const port = createAnalysisProviderPort(
      createStubCoordinator(async () => ({
        ok: false,
        code: 'unknown_internal',
        message: 'Unexpected',
      })),
      { providerId: 'mock', resolveInput },
    );

    const result = await port.analyze({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      requestedAt: TIMESTAMP,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.jobFailureCode).toBe('analysis_failed');
    }
  });

  it('delegates resolved coordinator input from the injected resolver', async () => {
    const analyzeReference = vi.fn(async () => ({
      ok: true as const,
      data: {
        analysisId: 'analysis-port-002' as EntityId,
        completedAt: TIMESTAMP,
      },
    }));

    const port = createAnalysisProviderPort(
      createStubCoordinator(analyzeReference),
      { providerId: 'mock', resolveInput },
    );

    await port.analyze({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      requestedAt: TIMESTAMP,
    });

    expect(analyzeReference).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-001',
        referenceId: 'ref-001',
        projectId: 'project-001',
        ownerId: 'owner-001',
        occurredAt: TIMESTAMP,
        referenceKind: 'youtube_url',
        fingerprintId: 'fingerprint-001',
        fingerprintAlgorithmVersion: 1,
        intake: {},
      }),
    );
  });
});
