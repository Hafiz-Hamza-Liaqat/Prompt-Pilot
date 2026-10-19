import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type {
  CacheLookupResult,
  CreateCacheEntryInput,
  OwnerScope,
  PersistenceResult,
  CacheEntryRecord,
} from '../contracts';

/**
 * Analysis cache entry persistence — PP-05A CacheRepository.
 */
export interface CacheRepository {
  lookup(
    scope: OwnerScope,
    fingerprintId: EntityId,
    fingerprintAlgorithmVersion: MonotonicVersion,
  ): Promise<PersistenceResult<CacheLookupResult>>;

  put(
    scope: OwnerScope,
    input: CreateCacheEntryInput,
  ): Promise<PersistenceResult<CacheEntryRecord>>;

  recordHit(scope: OwnerScope, cacheKey: string): Promise<PersistenceResult<CacheEntryRecord>>;

  invalidate(scope: OwnerScope, cacheKey: string): Promise<PersistenceResult<void>>;
}
