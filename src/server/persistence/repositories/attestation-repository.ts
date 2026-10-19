import type {
  CreateAttestationInput,
  OwnerScope,
  PersistenceResult,
  RightsAttestationRecord,
} from '../contracts';
import type { EntityId } from '@/domain/canonical/primitives';

/**
 * Rights attestation persistence — PP-11 Slice 4A.
 * Insert-only; maps to rights_attestations.
 */
export interface AttestationRepository {
  insert(
    scope: OwnerScope,
    input: CreateAttestationInput,
    attestationId: EntityId,
  ): Promise<PersistenceResult<RightsAttestationRecord>>;
}
