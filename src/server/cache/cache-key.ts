import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import { buildCacheLookupKey } from '@/server/persistence';

export type CacheKeyInput = {
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
  scopeUserId: EntityId;
};

/** Deterministic cache key — matches PP-05C `cache_entries.cache_key` format. */
export function buildCacheKey(input: CacheKeyInput): string {
  return buildCacheLookupKey(
    input.fingerprintId,
    input.fingerprintAlgorithmVersion,
    input.scopeUserId,
  );
}
