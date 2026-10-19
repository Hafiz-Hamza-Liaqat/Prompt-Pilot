import { describe, expect, it } from 'vitest';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';
import { createCacheCoordinator } from '../../src/server/cache/cache-coordinator.js';
import {
  InMemoryAnalysisRepository,
  InMemoryCacheRepository,
  TEST_ANALYSIS_ID,
  TEST_CACHE_KEY,
  TEST_EXPIRES,
  TEST_FINGERPRINT,
  TEST_SCOPE,
} from './test-doubles.js';

function createCoordinator(options?: {
  cache?: InMemoryCacheRepository;
  analysis?: InMemoryAnalysisRepository;
}) {
  const cacheRepository = options?.cache ?? new InMemoryCacheRepository();
  const analysisRepository = options?.analysis ?? new InMemoryAnalysisRepository();

  return {
    coordinator: createCacheCoordinator({ cacheRepository, analysisRepository }),
    cacheRepository,
    analysisRepository,
  };
}

function seedHitFixtures(
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
    referenceId: 'reference-001',
    fingerprintId: TEST_FINGERPRINT.fingerprintId,
  });
}

describe('CacheCoordinator', () => {
  it('returns miss when no cache entry exists', async () => {
    const { coordinator, cacheRepository } = createCoordinator();
    cacheRepository.setFingerprintVersion(
      TEST_FINGERPRINT.fingerprintId,
      TEST_FINGERPRINT.fingerprintAlgorithmVersion,
    );

    const result = await coordinator.lookupByFingerprint({
      scope: TEST_SCOPE,
      ...TEST_FINGERPRINT,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hit).toBe(false);
    }
  });

  it('returns hit after validation and records hit count', async () => {
    const { coordinator, cacheRepository, analysisRepository } = createCoordinator();
    seedHitFixtures(cacheRepository, analysisRepository);

    const result = await coordinator.lookupByFingerprint({
      scope: TEST_SCOPE,
      ...TEST_FINGERPRINT,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hit).toBe(true);
      expect(result.data.analysisId).toBe(TEST_ANALYSIS_ID);
      expect(result.data.cacheKey).toBe(TEST_CACHE_KEY);
    }

    const entry = cacheRepository.getEntry(TEST_SCOPE, TEST_CACHE_KEY);
    expect(entry?.hitCount).toBe(1);
    expect(entry?.lastHitAt).toBeTruthy();
  });

  it('treats missing analysis as corrupt miss after invalidation (G-33)', async () => {
    const { coordinator, cacheRepository, analysisRepository } = createCoordinator();
    seedHitFixtures(cacheRepository, analysisRepository);
    analysisRepository.remove(TEST_SCOPE, TEST_ANALYSIS_ID);

    const result = await coordinator.lookupByFingerprint({
      scope: TEST_SCOPE,
      ...TEST_FINGERPRINT,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.hit).toBe(false);
      expect(result.data.corrupt).toBe(true);
    }

    const entry = cacheRepository.getEntry(TEST_SCOPE, TEST_CACHE_KEY);
    expect(entry?.invalidatedAt).toBeTruthy();
  });

  it('returns cache_corrupt when invalidation fails after corrupt detection', async () => {
    const { coordinator, cacheRepository, analysisRepository } = createCoordinator();
    seedHitFixtures(cacheRepository, analysisRepository);
    analysisRepository.remove(TEST_SCOPE, TEST_ANALYSIS_ID);
    cacheRepository.setInvalidateShouldFail(true);

    const result = await coordinator.lookupByFingerprint({
      scope: TEST_SCOPE,
      ...TEST_FINGERPRINT,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('cache_corrupt');
      expect(result.retryable).toBe(true);
    }
  });

  it('returns storage_error on repository lookup failure', async () => {
    const { coordinator, cacheRepository } = createCoordinator();
    cacheRepository.setLookupShouldFail(true);

    const result = await coordinator.lookupByFingerprint({
      scope: TEST_SCOPE,
      ...TEST_FINGERPRINT,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('storage_error');
    }
  });

  it('returns storage_error when recordHit fails on valid hit', async () => {
    const { coordinator, cacheRepository, analysisRepository } = createCoordinator();
    seedHitFixtures(cacheRepository, analysisRepository);
    cacheRepository.setRecordHitShouldFail(true);

    const result = await coordinator.lookupByFingerprint({
      scope: TEST_SCOPE,
      ...TEST_FINGERPRINT,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('storage_error');
    }
  });

  it('writes cache entries via writeEntry', async () => {
    const { coordinator, cacheRepository } = createCoordinator();
    cacheRepository.setFingerprintVersion(
      TEST_FINGERPRINT.fingerprintId,
      TEST_FINGERPRINT.fingerprintAlgorithmVersion,
    );

    const written = await coordinator.writeEntry({
      scope: TEST_SCOPE,
      ...TEST_FINGERPRINT,
      analysisId: TEST_ANALYSIS_ID,
      analysisVersion: 1,
      pipelineVersion: '1.0.0',
      expiresAt: TEST_EXPIRES,
    });

    expect(written.ok).toBe(true);
    if (written.ok) {
      expect(written.data.cacheKey).toBe(TEST_CACHE_KEY);
    }
  });
});
