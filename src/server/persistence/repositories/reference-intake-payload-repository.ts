import type {
  CreateReferenceIntakePayloadInput,
  OwnerScope,
  PersistenceResult,
  ReferenceIntakePayloadRecord,
} from '../contracts';
import type { EntityId } from '@/domain/canonical/primitives';

/**
 * Durable transcript/script body for reference intake — PP-11 Slice 4A.
 * 4B trigger reads via getByReferenceId; URL kinds omit payload rows.
 */
export interface ReferenceIntakePayloadRepository {
  insert(
    scope: OwnerScope,
    input: CreateReferenceIntakePayloadInput,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord>>;

  getByReferenceId(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<ReferenceIntakePayloadRecord | null>>;
}
