import { describe, expect, it } from 'vitest';
import { createCachePort } from '../../src/server/cache/cache-port-adapter.js';
import type { CacheCoordinator } from '../../src/server/cache/cache-coordinator.js';

function createStubCoordinator(
  lookupByFingerprint: CacheCoordinator['lookupByFingerprint'],
): CacheCoordinator {
  return {
    lookupByFingerprint,
    recordHit: async () => ({ ok: true, data: undefined }),
    invalidate: async () => ({ ok: true, data: undefined }),
    buildCacheKey: () => 'cache-key',
    writeEntry: async () => ({ ok: false, code: 'storage_error', message: 'not used' }),
  } as unknown as CacheCoordinator;
}

describe('createCachePort', () => {
  it('preserves cache_corrupt job failure code', async () => {
    const port = createCachePort(
      createStubCoordinator(async () => ({
        ok: false,
        code: 'cache_corrupt',
        message: 'invalidation failed',
        retryable: true,
      })),
    );

    const result = await port.lookup({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      fingerprintId: 'fingerprint-001',
      fingerprintAlgorithmVersion: 1,
      requestedAt: '2026-07-07T12:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.jobFailureCode).toBe('cache_corrupt');
      expect(result.error.stageId).toBe('cache_lookup');
    }
  });

  it('maps storage_error from coordinator failures', async () => {
    const port = createCachePort(
      createStubCoordinator(async () => ({
        ok: false,
        code: 'storage_error',
        message: 'lookup failed',
        retryable: true,
      })),
    );

    const result = await port.lookup({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      fingerprintId: 'fingerprint-001',
      fingerprintAlgorithmVersion: 1,
      requestedAt: '2026-07-07T12:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.jobFailureCode).toBe('storage_error');
    }
  });

  it('returns hit outcome from coordinator success', async () => {
    const port = createCachePort(
      createStubCoordinator(async () => ({
        ok: true,
        data: {
          hit: true,
          analysisId: 'analysis-001',
          cacheKey: 'owner:fingerprint:v1',
        },
      })),
    );

    const result = await port.lookup({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      fingerprintId: 'fingerprint-001',
      fingerprintAlgorithmVersion: 1,
      requestedAt: '2026-07-07T12:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hit).toBe(true);
      expect(result.data.analysisId).toBe('analysis-001');
    }
  });
});
