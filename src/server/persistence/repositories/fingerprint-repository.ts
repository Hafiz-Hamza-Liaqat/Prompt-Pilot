import type { ContentFingerprint } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  FingerprintLookupKey,
  OwnerScope,
  PersistenceResult,
  PromoteFingerprintInput,
} from '../contracts';

/**
 * Content fingerprint persistence — PP-05A FingerprintRepository.
 */
export interface FingerprintRepository {
  insertCandidate(
    scope: OwnerScope,
    fingerprint: ContentFingerprint,
  ): Promise<PersistenceResult<ContentFingerprint>>;

  getById(
    scope: OwnerScope,
    fingerprintId: EntityId,
  ): Promise<PersistenceResult<ContentFingerprint>>;

  lookupByIdentity(
    scope: OwnerScope,
    key: FingerprintLookupKey,
  ): Promise<PersistenceResult<ContentFingerprint | null>>;

  promoteToActive(
    scope: OwnerScope,
    input: PromoteFingerprintInput,
  ): Promise<PersistenceResult<ContentFingerprint>>;

  invalidate(
    scope: OwnerScope,
    fingerprintId: EntityId,
  ): Promise<PersistenceResult<ContentFingerprint>>;
}
