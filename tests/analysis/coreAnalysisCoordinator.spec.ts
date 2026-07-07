import { describe, expect, it, vi } from 'vitest';
import type { EntityId } from '../../src/domain/canonical/primitives.js';
import type { ReferenceVideoAnalysis } from '../../src/domain/canonical/referenceVideoAnalysis.js';
import type { LinkMetadata } from '../../src/domain/link/index.js';
import { buildCacheKey } from '../../src/server/cache/cache-key.js';
import { createCacheCoordinator } from '../../src/server/cache/cache-coordinator.js';
import { createCoreAnalysisCoordinator } from '../../src/server/analysis/core-analysis-coordinator.js';
import type { ReferenceAnalysisProvider } from '../../src/server/analysis/analysis-provider.js';
import { createMockAnalysisProvider } from '../../src/server/analysis/mock-analysis-provider.js';
import type { CoreAnalysisCoordinatorRequest, ReferenceVideoAnalysisDraft } from '../../src/server/analysis/types.js';
import { validReferenceVideoAnalysisFixture } from '../fixtures/validReferenceVideoAnalysis.js';
import {
  InMemoryAnalysisRepository,
  InMemoryCacheRepository,
  TEST_FINGERPRINT,
  TEST_SCOPE,
  TEST_TIMESTAMP,
} from '../cache/test-doubles.js';

const JOB = 'job-001' as EntityId;
const REFERENCE = 'reference-001' as EntityId;

function sampleLinkMetadata(overrides: Partial<LinkMetadata> = {}): LinkMetadata {
  return {
    linkMetadataId: 'link-meta-001' as EntityId,
    referenceId: REFERENCE,
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
    ...overrides,
  };
}

function baseRequest(
  overrides: Partial<CoreAnalysisCoordinatorRequest> = {},
): CoreAnalysisCoordinatorRequest {
  return {
    jobId: JOB,
    referenceId: REFERENCE,
    projectId: TEST_SCOPE.projectId,
    ownerId: TEST_SCOPE.ownerId,
    referenceKind: 'youtube_url',
    fingerprintId: TEST_FINGERPRINT.fingerprintId,
    fingerprintAlgorithmVersion: TEST_FINGERPRINT.fingerprintAlgorithmVersion,
    occurredAt: TEST_TIMESTAMP,
    intake: { linkMetadata: sampleLinkMetadata() },
    ...overrides,
  };
}

function createCoordinator(options?: {
  analysisRepository?: InMemoryAnalysisRepository;
  cacheRepository?: InMemoryCacheRepository;
  provider?: ReferenceAnalysisProvider;
  idGenerator?: () => EntityId;
}) {
  const analysisRepository = options?.analysisRepository ?? new InMemoryAnalysisRepository();
  const cacheRepository = options?.cacheRepository ?? new InMemoryCacheRepository();
  const cacheCoordinator = createCacheCoordinator({ analysisRepository, cacheRepository });

  return {
    coordinator: createCoreAnalysisCoordinator({
      provider: options?.provider ?? createMockAnalysisProvider(),
      analysisRepository,
      cacheCoordinator,
      idGenerator: options?.idGenerator,
    }),
    analysisRepository,
    cacheRepository,
    cacheCoordinator,
  };
}

function seedPriorAnalysis(
  analysisRepository: InMemoryAnalysisRepository,
  analysisId: EntityId,
  analysisVersion: number,
): void {
  const prior: ReferenceVideoAnalysis = {
    ...validReferenceVideoAnalysisFixture,
    analysisId,
    projectId: TEST_SCOPE.projectId,
    referenceId: REFERENCE,
    fingerprintId: TEST_FINGERPRINT.fingerprintId,
    createdAt: TEST_TIMESTAMP,
    version: {
      analysisVersion,
      isLatest: true,
      changeReason: analysisVersion === 1 ? 'initial' : 'reanalysis',
    },
  };
  analysisRepository.seed(TEST_SCOPE, prior);
}

describe('CoreAnalysisCoordinator', () => {
  it('persists analysis, updates latest version, and writes cache on success', async () => {
    const analysisId = 'analysis-coordinator-001' as EntityId;
    const { coordinator, analysisRepository, cacheRepository, cacheCoordinator } = createCoordinator({
      idGenerator: () => analysisId,
    });

    const insertSpy = vi.spyOn(analysisRepository, 'insert');
    const setLatestSpy = vi.spyOn(analysisRepository, 'setLatestVersion');
    const writeEntrySpy = vi.spyOn(cacheCoordinator, 'writeEntry');

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.data).toEqual({
      analysisId,
      completedAt: TEST_TIMESTAMP,
    });

    expect(insertSpy.mock.invocationCallOrder[0]).toBeLessThan(setLatestSpy.mock.invocationCallOrder[0]);
    expect(setLatestSpy.mock.invocationCallOrder[0]).toBeLessThan(writeEntrySpy.mock.invocationCallOrder[0]);

    const stored = analysisRepository.getStored(TEST_SCOPE, analysisId);
    expect(stored?.version.analysisVersion).toBe(1);
    expect(stored?.version.isLatest).toBe(true);

    const cacheKey = buildCacheKey({
      fingerprintId: TEST_FINGERPRINT.fingerprintId,
      fingerprintAlgorithmVersion: TEST_FINGERPRINT.fingerprintAlgorithmVersion,
      scopeUserId: TEST_SCOPE.ownerId,
    });
    expect(cacheRepository.getEntry(TEST_SCOPE, cacheKey)?.analysisId).toBe(analysisId);
  });

  it('merges intakeOverride before invoking the provider', async () => {
    const provider = createMockAnalysisProvider();
    const analyzeSpy = vi.spyOn(provider, 'analyze');
    const { coordinator } = createCoordinator({ provider });

    await coordinator.analyzeReference(
      baseRequest({
        intake: {},
        intakeOverride: { linkMetadata: sampleLinkMetadata({ title: 'Override title' }) },
      }),
    );

    expect(analyzeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        intake: expect.objectContaining({
          linkMetadata: expect.objectContaining({ title: 'Override title' }),
        }),
      }),
    );
  });

  it('increments analysis version when a prior latest analysis exists', async () => {
    const priorId = 'analysis-prior-001' as EntityId;
    const nextId = 'analysis-next-001' as EntityId;
    const analysisRepository = new InMemoryAnalysisRepository();
    seedPriorAnalysis(analysisRepository, priorId, 1);

    const { coordinator } = createCoordinator({
      analysisRepository,
      idGenerator: () => nextId,
    });

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const stored = analysisRepository.getStored(TEST_SCOPE, nextId);
    expect(stored?.version.analysisVersion).toBe(2);
    expect(stored?.version.changeReason).toBe('reanalysis');
    expect(stored?.version.supersedesAnalysisId).toBe(priorId);

    const prior = analysisRepository.getStored(TEST_SCOPE, priorId);
    expect(prior?.version.isLatest).toBe(false);
  });

  it('returns provider failure without persistence or cache writes', async () => {
    const provider: ReferenceAnalysisProvider = {
      providerId: 'stub',
      analyze: async () => ({
        ok: false,
        code: 'analysis_failed',
        message: 'Provider rejected intake',
      }),
    };
    const analysisRepository = new InMemoryAnalysisRepository();
    const cacheRepository = new InMemoryCacheRepository();
    const { coordinator, cacheCoordinator } = createCoordinator({
      provider,
      analysisRepository,
      cacheRepository,
    });
    const insertSpy = vi.spyOn(analysisRepository, 'insert');
    const writeEntrySpy = vi.spyOn(cacheCoordinator, 'writeEntry');

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('analysis_failed');
    expect(insertSpy).not.toHaveBeenCalled();
    expect(writeEntrySpy).not.toHaveBeenCalled();
  });

  it('returns analysis_failed when schema validation fails', async () => {
    const provider: ReferenceAnalysisProvider = {
      providerId: 'stub',
      analyze: async () => {
        const { analysisId: _ignored, ...draft } = validReferenceVideoAnalysisFixture;
        const invalidDraft = {
          ...draft,
          metadata: {
            ...draft.metadata,
            accessStatus: 'not-a-valid-status',
          },
        } as unknown as ReferenceVideoAnalysisDraft;

        return { ok: true, data: invalidDraft };
      },
    };
    const analysisRepository = new InMemoryAnalysisRepository();
    const insertSpy = vi.spyOn(analysisRepository, 'insert');
    const { coordinator, cacheCoordinator } = createCoordinator({ provider, analysisRepository });
    const writeEntrySpy = vi.spyOn(cacheCoordinator, 'writeEntry');

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('analysis_failed');
    expect(insertSpy).not.toHaveBeenCalled();
    expect(writeEntrySpy).not.toHaveBeenCalled();
  });

  it('maps insert scope_violation to policy_blocked', async () => {
    const analysisRepository = new InMemoryAnalysisRepository();
    analysisRepository.setInsertShouldFail({ code: 'scope_violation', message: 'scope mismatch' });
    const cacheRepository = new InMemoryCacheRepository();
    const { coordinator, cacheCoordinator } = createCoordinator({ analysisRepository, cacheRepository });
    const writeEntrySpy = vi.spyOn(cacheCoordinator, 'writeEntry');

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('policy_blocked');
    expect(result.retryable).toBe(false);
    expect(writeEntrySpy).not.toHaveBeenCalled();
  });

  it('maps insert persistence_error to storage_error', async () => {
    const analysisRepository = new InMemoryAnalysisRepository();
    analysisRepository.setInsertShouldFail({ code: 'persistence_error', message: 'insert failed' });
    const { coordinator, cacheCoordinator } = createCoordinator({ analysisRepository });
    const writeEntrySpy = vi.spyOn(cacheCoordinator, 'writeEntry');

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('storage_error');
    expect(result.retryable).toBe(true);
    expect(writeEntrySpy).not.toHaveBeenCalled();
  });

  it('maps setLatestVersion failure to storage_error without cache write', async () => {
    const analysisRepository = new InMemoryAnalysisRepository();
    analysisRepository.setSetLatestVersionShouldFail(true);
    const { coordinator, cacheCoordinator } = createCoordinator({ analysisRepository });
    const writeEntrySpy = vi.spyOn(cacheCoordinator, 'writeEntry');

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('storage_error');
    expect(writeEntrySpy).not.toHaveBeenCalled();
  });

  it('maps cache write failure to storage_error after successful insert', async () => {
    const analysisId = 'analysis-cache-fail-001' as EntityId;
    const cacheRepository = new InMemoryCacheRepository();
    cacheRepository.setPutShouldFail(true);
    const analysisRepository = new InMemoryAnalysisRepository();
    const { coordinator } = createCoordinator({
      analysisRepository,
      cacheRepository,
      idGenerator: () => analysisId,
    });

    const result = await coordinator.analyzeReference(baseRequest());

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('storage_error');
    expect(result.retryable).toBe(true);
    expect(analysisRepository.getStored(TEST_SCOPE, analysisId)).toBeDefined();
  });
});
