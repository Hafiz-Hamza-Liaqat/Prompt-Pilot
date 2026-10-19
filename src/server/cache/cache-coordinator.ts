import type { EntityId, MonotonicVersion, SemanticVersion } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type {
  CacheEntryRecord,
  CreateCacheEntryInput,
  OwnerScope,
} from '@/server/persistence';
import type { AnalysisRepository } from '@/server/persistence/repositories/analysis-repository';
import type { CacheRepository } from '@/server/persistence/repositories/cache-repository';
import { buildCacheKey, type CacheKeyInput } from './cache-key.js';

export type CacheResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; retryable?: boolean };

export type CacheLookupInput = {
  scope: OwnerScope;
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
};

export type CacheLookupOutcome = {
  hit: boolean;
  analysisId?: EntityId;
  cacheKey?: string;
  /** True when entry existed but analysis validation failed (G-33), then invalidated. */
  corrupt?: boolean;
};

export type CacheWriteInput = {
  scope: OwnerScope;
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
  analysisId: EntityId;
  analysisVersion: MonotonicVersion;
  pipelineVersion: SemanticVersion;
  expiresAt: IsoDateTime;
};

export type CacheInvalidationReason = 'corrupt_analysis' | 'manual' | 'reference_deleted';

export type CacheCoordinatorDeps = {
  cacheRepository: CacheRepository;
  analysisRepository: AnalysisRepository;
};

function cacheOk<T>(data: T): CacheResult<T> {
  return { ok: true, data };
}

function cacheErr<T>(
  code: string,
  message: string,
  retryable = false,
): CacheResult<T> {
  return { ok: false, code, message, retryable };
}

function storageError<T>(message: string, retryable = true): CacheResult<T> {
  return cacheErr('storage_error', message, retryable);
}

/**
 * Analysis cache mechanics — lookup, validation, hit recording, invalidation.
 * Does not advance job workflow; JobOrchestrator owns progression.
 */
export class CacheCoordinator {
  constructor(private readonly deps: CacheCoordinatorDeps) {}

  buildCacheKey(input: CacheKeyInput): string {
    return buildCacheKey(input);
  }

  async lookupByFingerprint(
    input: CacheLookupInput,
  ): Promise<CacheResult<CacheLookupOutcome>> {
    const cacheKey = buildCacheKey({
      fingerprintId: input.fingerprintId,
      fingerprintAlgorithmVersion: input.fingerprintAlgorithmVersion,
      scopeUserId: input.scope.ownerId,
    });

    const lookup = await this.deps.cacheRepository.lookup(
      input.scope,
      input.fingerprintId,
      input.fingerprintAlgorithmVersion,
    );

    if (!lookup.ok) {
      return storageError(lookup.message ?? 'Cache lookup failed');
    }

    if (!lookup.data.hit || !lookup.data.analysisId) {
      return cacheOk({ hit: false });
    }

    const analysisId = lookup.data.analysisId;
    const entryKey = lookup.data.entry?.cacheKey ?? cacheKey;

    const analysis = await this.deps.analysisRepository.getById(input.scope, analysisId);
    if (!analysis.ok) {
      if (analysis.code === 'not_found') {
        return this.handleCorruptEntry(input.scope, entryKey);
      }
      return storageError(analysis.message ?? 'Analysis validation failed');
    }

    const recorded = await this.deps.cacheRepository.recordHit(input.scope, entryKey);
    if (!recorded.ok) {
      return storageError(recorded.message ?? 'Cache hit recording failed');
    }

    return cacheOk({
      hit: true,
      analysisId,
      cacheKey: entryKey,
    });
  }

  async recordHit(scope: OwnerScope, cacheKey: string): Promise<CacheResult<void>> {
    const result = await this.deps.cacheRepository.recordHit(scope, cacheKey);
    if (!result.ok) {
      return storageError(result.message ?? 'Cache hit recording failed');
    }
    return cacheOk(undefined);
  }

  async invalidate(
    scope: OwnerScope,
    cacheKey: string,
    _reason: CacheInvalidationReason,
  ): Promise<CacheResult<void>> {
    const result = await this.deps.cacheRepository.invalidate(scope, cacheKey);
    if (!result.ok) {
      return cacheErr('cache_corrupt', result.message ?? 'Cache invalidation failed', true);
    }
    return cacheOk(undefined);
  }

  async writeEntry(input: CacheWriteInput): Promise<CacheResult<CacheEntryRecord>> {
    const cacheKey = buildCacheKey({
      fingerprintId: input.fingerprintId,
      fingerprintAlgorithmVersion: input.fingerprintAlgorithmVersion,
      scopeUserId: input.scope.ownerId,
    });

    const putInput: CreateCacheEntryInput = {
      cacheKey,
      fingerprintId: input.fingerprintId,
      analysisId: input.analysisId,
      analysisVersion: input.analysisVersion,
      pipelineVersion: input.pipelineVersion,
      scopeUserId: input.scope.ownerId,
      expiresAt: input.expiresAt,
    };

    const result = await this.deps.cacheRepository.put(input.scope, putInput);
    if (!result.ok) {
      return storageError(result.message ?? 'Cache write failed');
    }

    return cacheOk(result.data);
  }

  private async handleCorruptEntry(
    scope: OwnerScope,
    cacheKey: string,
  ): Promise<CacheResult<CacheLookupOutcome>> {
    const invalidated = await this.invalidate(scope, cacheKey, 'corrupt_analysis');
    if (!invalidated.ok) {
      return cacheErr(
        invalidated.code,
        invalidated.message,
        invalidated.retryable,
      );
    }

    return cacheOk({
      hit: false,
      corrupt: true,
      cacheKey,
    });
  }
}

export function createCacheCoordinator(deps: CacheCoordinatorDeps): CacheCoordinator {
  return new CacheCoordinator(deps);
}
