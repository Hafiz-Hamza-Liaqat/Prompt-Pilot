import type { JobRecord } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  AppendJobEventInput,
  CreateJobInput,
  CursorPage,
  CursorPageRequest,
  JobEventRecord,
  JobStateTransitionInput,
  OwnerScope,
  PersistenceResult,
} from '../contracts';

/**
 * Job lifecycle persistence — PP-05A JobRepository.
 * State transitions are optimistic-lock guarded via expectedState.
 */
export interface JobRepository {
  create(
    scope: OwnerScope,
    input: CreateJobInput,
    jobId: EntityId,
  ): Promise<PersistenceResult<JobRecord>>;

  getById(scope: OwnerScope, jobId: EntityId): Promise<PersistenceResult<JobRecord>>;

  transitionState(
    scope: OwnerScope,
    input: JobStateTransitionInput,
  ): Promise<PersistenceResult<JobRecord>>;

  appendEvent(
    scope: OwnerScope,
    jobId: EntityId,
    event: AppendJobEventInput,
    eventId: EntityId,
  ): Promise<PersistenceResult<JobEventRecord>>;

  listByReference(
    scope: OwnerScope,
    referenceId: EntityId,
    request: CursorPageRequest,
  ): Promise<PersistenceResult<CursorPage<JobRecord>>>;

  getActiveByProject(scope: OwnerScope): Promise<PersistenceResult<JobRecord | null>>;
}
