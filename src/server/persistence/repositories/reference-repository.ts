import type { Reference } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  CreateReferenceInput,
  OffsetPage,
  OffsetPageRequest,
  OwnerScope,
  PersistenceResult,
  UpdateReferenceInput,
} from '../contracts';

/**
 * Reference intake persistence — PP-05A ReferenceRepository.
 * Behavior only; no storage implementation in PP-05B.
 */
export interface ReferenceRepository {
  insert(
    scope: OwnerScope,
    input: CreateReferenceInput,
    referenceId: EntityId,
  ): Promise<PersistenceResult<Reference>>;

  getById(scope: OwnerScope, referenceId: EntityId): Promise<PersistenceResult<Reference>>;

  listByProject(
    scope: OwnerScope,
    request: OffsetPageRequest,
  ): Promise<PersistenceResult<OffsetPage<Reference>>>;

  getLatestByProject(scope: OwnerScope): Promise<PersistenceResult<Reference | null>>;

  updateMetadata(
    scope: OwnerScope,
    input: UpdateReferenceInput,
  ): Promise<PersistenceResult<Reference>>;
}
