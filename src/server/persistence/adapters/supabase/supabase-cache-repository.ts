import type { SupabaseClient } from '@supabase/supabase-js';
import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type {
  CacheEntryRecord,
  CacheLookupResult,
  CreateCacheEntryInput,
  OwnerScope,
  PersistenceResult,
} from '../../contracts';
import type { CacheRepository } from '../../repositories/cache-repository';
import { type CacheEntryRow } from './mappers';
import {
  persistenceErr,
  persistenceFailure,
  persistenceNotFound,
  persistenceOk,
} from './shared';

function mapCacheEntryRow(row: CacheEntryRow): CacheEntryRecord {
  return {
    cacheKey: row.cache_key,
    fingerprintId: row.fingerprint_id,
    analysisId: row.analysis_id,
    analysisVersion: row.analysis_version,
    pipelineVersion: row.pipeline_version,
    scopeUserId: row.scope_user_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    lastHitAt: row.last_hit_at ?? undefined,
    hitCount: row.hit_count,
    invalidatedAt: row.invalidated_at ?? undefined,
  };
}

const CACHE_COLUMNS =
  'cache_key, fingerprint_id, analysis_id, scope_user_id, analysis_version, pipeline_version, hit_count, created_at, last_hit_at, expires_at, invalidated_at';

export class SupabaseCacheRepository implements CacheRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async lookup(
    scope: OwnerScope,
    fingerprintId: EntityId,
    fingerprintAlgorithmVersion: MonotonicVersion,
  ): Promise<PersistenceResult<CacheLookupResult>> {
    const { data: fingerprint, error: fingerprintError } = await this.supabase
      .from('content_fingerprints')
      .select('fingerprint_algorithm_version')
      .eq('id', fingerprintId)
      .eq('scope_user_id', scope.ownerId)
      .maybeSingle();

    if (fingerprintError) {
      return persistenceFailure(fingerprintError);
    }
    if (
      !fingerprint ||
      fingerprint.fingerprint_algorithm_version !== fingerprintAlgorithmVersion
    ) {
      return persistenceOk({ hit: false });
    }

    const now = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('cache_entries')
      .select(CACHE_COLUMNS)
      .eq('fingerprint_id', fingerprintId)
      .eq('scope_user_id', scope.ownerId)
      .is('invalidated_at', null)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceOk({ hit: false });
    }

    const entry = mapCacheEntryRow(data as CacheEntryRow);
    return persistenceOk({
      hit: true,
      entry,
      analysisId: entry.analysisId,
    });
  }

  async put(
    scope: OwnerScope,
    input: CreateCacheEntryInput,
  ): Promise<PersistenceResult<CacheEntryRecord>> {
    if (input.scopeUserId !== scope.ownerId) {
      return persistenceErr('scope_violation', 'cache scope user mismatch');
    }

    const { data, error } = await this.supabase
      .from('cache_entries')
      .insert({
        cache_key: input.cacheKey,
        fingerprint_id: input.fingerprintId,
        analysis_id: input.analysisId,
        scope_user_id: scope.ownerId,
        analysis_version: input.analysisVersion,
        pipeline_version: input.pipelineVersion,
        expires_at: input.expiresAt,
      })
      .select(CACHE_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapCacheEntryRow(data as CacheEntryRow));
  }

  async recordHit(scope: OwnerScope, cacheKey: string): Promise<PersistenceResult<CacheEntryRecord>> {
    const now = new Date().toISOString();

    const { data: existing, error: readError } = await this.supabase
      .from('cache_entries')
      .select(CACHE_COLUMNS)
      .eq('cache_key', cacheKey)
      .eq('scope_user_id', scope.ownerId)
      .is('invalidated_at', null)
      .maybeSingle();

    if (readError) {
      return persistenceFailure(readError);
    }
    if (!existing) {
      return persistenceNotFound();
    }

    const { data, error } = await this.supabase
      .from('cache_entries')
      .update({
        hit_count: existing.hit_count + 1,
        last_hit_at: now,
      })
      .eq('cache_key', cacheKey)
      .eq('scope_user_id', scope.ownerId)
      .select(CACHE_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapCacheEntryRow(data as CacheEntryRow));
  }

  async invalidate(scope: OwnerScope, cacheKey: string): Promise<PersistenceResult<void>> {
    const invalidatedAt = new Date().toISOString();
    const { error } = await this.supabase
      .from('cache_entries')
      .update({ invalidated_at: invalidatedAt })
      .eq('cache_key', cacheKey)
      .eq('scope_user_id', scope.ownerId)
      .is('invalidated_at', null);

    if (error) {
      return persistenceFailure(error);
    }

    return persistenceOk(undefined);
  }
}
