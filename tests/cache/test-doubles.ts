import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';
import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type {
  CacheEntryRecord,
  CacheLookupResult,
  CreateCacheEntryInput,
  OwnerScope,
  PersistenceResult,
} from '@/server/persistence';
import type { AnalysisRepository } from '@/server/persistence/repositories/analysis-repository';
import type { CacheRepository } from '@/server/persistence/repositories/cache-repository';
import { persistenceErr, persistenceOk } from '@/server/persistence';

type StoredEntry = CacheEntryRecord;

export class InMemoryCacheRepository implements CacheRepository {
  private readonly entries = new Map<string, StoredEntry>();
  private fingerprintVersions = new Map<EntityId, MonotonicVersion>();
  private invalidateShouldFail = false;
  private lookupShouldFail = false;
  private putShouldFail = false;
  private recordHitShouldFail = false;

  setFingerprintVersion(fingerprintId: EntityId, version: MonotonicVersion): void {
    this.fingerprintVersions.set(fingerprintId, version);
  }

  seedEntry(scope: OwnerScope, input: CreateCacheEntryInput): void {
    const entry: StoredEntry = {
      ...input,
      createdAt: new Date().toISOString(),
      hitCount: 0,
    };
    this.entries.set(this.scopeKey(scope, input.cacheKey), entry);
  }

  setInvalidateShouldFail(value: boolean): void {
    this.invalidateShouldFail = value;
  }

  setLookupShouldFail(value: boolean): void {
    this.lookupShouldFail = value;
  }

  setRecordHitShouldFail(value: boolean): void {
    this.recordHitShouldFail = value;
  }

  setPutShouldFail(value: boolean): void {
    this.putShouldFail = value;
  }

  getEntry(scope: OwnerScope, cacheKey: string): StoredEntry | undefined {
    return this.entries.get(this.scopeKey(scope, cacheKey));
  }

  async lookup(
    scope: OwnerScope,
    fingerprintId: EntityId,
    fingerprintAlgorithmVersion: MonotonicVersion,
  ): Promise<PersistenceResult<CacheLookupResult>> {
    if (this.lookupShouldFail) {
      return persistenceErr('persistence_error', 'lookup failed');
    }

    const version = this.fingerprintVersions.get(fingerprintId);
    if (version === undefined || version !== fingerprintAlgorithmVersion) {
      return persistenceOk({ hit: false });
    }

    const now = new Date().toISOString();
    const match = [...this.entries.values()].find(
      (entry) =>
        entry.fingerprintId === fingerprintId &&
        entry.scopeUserId === scope.ownerId &&
        !entry.invalidatedAt &&
        entry.expiresAt > now,
    );

    if (!match) {
      return persistenceOk({ hit: false });
    }

    return persistenceOk({
      hit: true,
      entry: match,
      analysisId: match.analysisId,
    });
  }

  async put(
    scope: OwnerScope,
    input: CreateCacheEntryInput,
  ): Promise<PersistenceResult<CacheEntryRecord>> {
    if (this.putShouldFail) {
      return persistenceErr('persistence_error', 'put failed');
    }

    if (input.scopeUserId !== scope.ownerId) {
      return persistenceErr('scope_violation', 'scope mismatch');
    }

    const entry: StoredEntry = {
      ...input,
      createdAt: new Date().toISOString(),
      hitCount: 0,
    };
    this.entries.set(this.scopeKey(scope, input.cacheKey), entry);
    return persistenceOk(entry);
  }

  async recordHit(scope: OwnerScope, cacheKey: string): Promise<PersistenceResult<CacheEntryRecord>> {
    if (this.recordHitShouldFail) {
      return persistenceErr('persistence_error', 'recordHit failed');
    }

    const key = this.scopeKey(scope, cacheKey);
    const existing = this.entries.get(key);
    if (!existing || existing.invalidatedAt) {
      return persistenceErr('not_found', 'cache entry missing');
    }

    const updated: StoredEntry = {
      ...existing,
      hitCount: existing.hitCount + 1,
      lastHitAt: new Date().toISOString(),
    };
    this.entries.set(key, updated);
    return persistenceOk(updated);
  }

  async invalidate(scope: OwnerScope, cacheKey: string): Promise<PersistenceResult<void>> {
    if (this.invalidateShouldFail) {
      return persistenceErr('persistence_error', 'invalidate failed');
    }

    const key = this.scopeKey(scope, cacheKey);
    const existing = this.entries.get(key);
    if (!existing) {
      return persistenceOk(undefined);
    }

    this.entries.set(key, {
      ...existing,
      invalidatedAt: new Date().toISOString(),
    });
    return persistenceOk(undefined);
  }

  private scopeKey(scope: OwnerScope, cacheKey: string): string {
    return `${scope.ownerId}:${cacheKey}`;
  }
}

export class InMemoryAnalysisRepository implements AnalysisRepository {
  private readonly analyses = new Map<string, ReferenceVideoAnalysis>();
  private insertFailure: { code: 'persistence_error' | 'scope_violation'; message?: string } | null =
    null;
  private setLatestVersionShouldFail = false;

  seed(scope: OwnerScope, analysis: ReferenceVideoAnalysis): void {
    this.analyses.set(this.key(scope, analysis.analysisId), analysis);
  }

  remove(scope: OwnerScope, analysisId: EntityId): void {
    this.analyses.delete(this.key(scope, analysisId));
  }

  setInsertShouldFail(
    value: { code: 'persistence_error' | 'scope_violation'; message?: string } | null,
  ): void {
    this.insertFailure = value;
  }

  setSetLatestVersionShouldFail(value: boolean): void {
    this.setLatestVersionShouldFail = value;
  }

  getStored(scope: OwnerScope, analysisId: EntityId): ReferenceVideoAnalysis | undefined {
    return this.analyses.get(this.key(scope, analysisId));
  }

  async insert(
    scope: OwnerScope,
    analysis: ReferenceVideoAnalysis,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis>> {
    if (analysis.projectId !== scope.projectId) {
      return persistenceErr('scope_violation', 'project scope mismatch');
    }

    if (this.insertFailure) {
      return persistenceErr(this.insertFailure.code, this.insertFailure.message);
    }

    this.seed(scope, analysis);
    return persistenceOk(analysis);
  }

  async getById(
    scope: OwnerScope,
    analysisId: EntityId,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis>> {
    const found = this.analyses.get(this.key(scope, analysisId));
    if (!found) {
      return persistenceErr('not_found', 'analysis missing');
    }
    return persistenceOk(found);
  }

  async listByReference(): Promise<PersistenceResult<never>> {
    throw new Error('not implemented');
  }

  async getLatestByReference(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis | null>> {
    const matches = [...this.analyses.entries()]
      .filter(([key, analysis]) => key.startsWith(`${scope.ownerId}:`) && analysis.referenceId === referenceId)
      .map(([, analysis]) => analysis);

    if (matches.length === 0) {
      return persistenceOk(null);
    }

    const latestMarked = matches.find((analysis) => analysis.version.isLatest);
    if (latestMarked) {
      return persistenceOk(latestMarked);
    }

    const sorted = [...matches].sort(
      (left, right) => right.version.analysisVersion - left.version.analysisVersion,
    );
    return persistenceOk(sorted[0] ?? null);
  }

  async setLatestVersion(
    scope: OwnerScope,
    query: { referenceId: EntityId; analysisId: EntityId; analysisVersion?: MonotonicVersion },
  ): Promise<PersistenceResult<void>> {
    if (this.setLatestVersionShouldFail) {
      return persistenceErr('persistence_error', 'setLatestVersion failed');
    }

    for (const [key, analysis] of this.analyses.entries()) {
      if (!key.startsWith(`${scope.ownerId}:`) || analysis.referenceId !== query.referenceId) {
        continue;
      }

      this.analyses.set(key, {
        ...analysis,
        version: {
          ...analysis.version,
          isLatest: analysis.analysisId === query.analysisId,
        },
      });
    }

    return persistenceOk(undefined);
  }

  private key(scope: OwnerScope, analysisId: EntityId): string {
    return `${scope.ownerId}:${analysisId}`;
  }
}

export const TEST_SCOPE = {
  ownerId: 'owner-001' as EntityId,
  projectId: 'project-001' as EntityId,
};

export const TEST_FINGERPRINT = {
  fingerprintId: 'fingerprint-001' as EntityId,
  fingerprintAlgorithmVersion: 1 as MonotonicVersion,
};

export const TEST_ANALYSIS_ID = 'analysis-001' as EntityId;

export const TEST_CACHE_KEY = `${TEST_SCOPE.ownerId}:${TEST_FINGERPRINT.fingerprintId}:v1`;

export const TEST_TIMESTAMP = '2026-07-07T12:00:00.000Z';
export const TEST_EXPIRES = '2099-01-01T00:00:00.000Z';
