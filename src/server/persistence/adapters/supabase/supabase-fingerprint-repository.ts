import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentFingerprint } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  FingerprintLookupKey,
  OwnerScope,
  PersistenceResult,
  PromoteFingerprintInput,
} from '../../contracts';
import type { FingerprintRepository } from '../../repositories/fingerprint-repository';
import { buildIdentityDescriptor } from './fingerprint-identity';
import { mapContentFingerprintRow, type ContentFingerprintRow } from './mappers';
import {
  persistenceErr,
  persistenceFailure,
  persistenceNotFound,
  persistenceOk,
} from './shared';

const FINGERPRINT_COLUMNS =
  'id, reference_kind, fingerprint_algorithm_version, fingerprint_inputs, state, created_at, invalidated_at, expired_at';

export class SupabaseFingerprintRepository implements FingerprintRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insertCandidate(
    scope: OwnerScope,
    fingerprint: ContentFingerprint,
  ): Promise<PersistenceResult<ContentFingerprint>> {
    const { data, error } = await this.supabase
      .from('content_fingerprints')
      .insert({
        id: fingerprint.fingerprintId,
        scope_user_id: scope.ownerId,
        reference_kind: fingerprint.referenceKind,
        fingerprint_algorithm_version: fingerprint.fingerprintAlgorithmVersion,
        identity_descriptor: buildIdentityDescriptor(fingerprint.fingerprintInputs),
        fingerprint_inputs: fingerprint.fingerprintInputs,
        state: fingerprint.state,
        created_at: fingerprint.createdAt,
        invalidated_at: fingerprint.invalidatedAt ?? null,
        expired_at: fingerprint.expiredAt ?? null,
      })
      .select(FINGERPRINT_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapContentFingerprintRow(data as ContentFingerprintRow));
  }

  async getById(
    scope: OwnerScope,
    fingerprintId: EntityId,
  ): Promise<PersistenceResult<ContentFingerprint>> {
    const { data, error } = await this.supabase
      .from('content_fingerprints')
      .select(FINGERPRINT_COLUMNS)
      .eq('id', fingerprintId)
      .eq('scope_user_id', scope.ownerId)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapContentFingerprintRow(data as ContentFingerprintRow));
  }

  async lookupByIdentity(
    scope: OwnerScope,
    key: FingerprintLookupKey,
  ): Promise<PersistenceResult<ContentFingerprint | null>> {
    if (key.scopeUserId !== scope.ownerId) {
      return persistenceErr('scope_violation', 'fingerprint scope user mismatch');
    }

    const { data, error } = await this.supabase
      .from('content_fingerprints')
      .select(FINGERPRINT_COLUMNS)
      .eq('scope_user_id', scope.ownerId)
      .eq('reference_kind', key.referenceKind)
      .eq('fingerprint_algorithm_version', key.fingerprintAlgorithmVersion)
      .eq('identity_descriptor', key.identityDescriptor)
      .eq('state', 'active')
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceOk(null);
    }

    return persistenceOk(mapContentFingerprintRow(data as ContentFingerprintRow));
  }

  async promoteToActive(
    scope: OwnerScope,
    input: PromoteFingerprintInput,
  ): Promise<PersistenceResult<ContentFingerprint>> {
    const { data, error } = await this.supabase
      .from('content_fingerprints')
      .update({ state: input.toState })
      .eq('id', input.fingerprintId)
      .eq('scope_user_id', scope.ownerId)
      .eq('state', input.fromState)
      .select(FINGERPRINT_COLUMNS)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceErr('conflict', 'Fingerprint promotion conflict');
    }

    return persistenceOk(mapContentFingerprintRow(data as ContentFingerprintRow));
  }

  async invalidate(
    scope: OwnerScope,
    fingerprintId: EntityId,
  ): Promise<PersistenceResult<ContentFingerprint>> {
    const invalidatedAt = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('content_fingerprints')
      .update({ state: 'invalidated', invalidated_at: invalidatedAt })
      .eq('id', fingerprintId)
      .eq('scope_user_id', scope.ownerId)
      .neq('state', 'invalidated')
      .select(FINGERPRINT_COLUMNS)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapContentFingerprintRow(data as ContentFingerprintRow));
  }
}
