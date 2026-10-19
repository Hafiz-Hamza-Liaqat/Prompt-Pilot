import type { UploadSession } from '@/domain/media';
import type { EntityId } from '@/domain/canonical/primitives';
import type { OwnerScope } from '../contracts/ownership';
import type { PersistenceResult } from '../contracts/result';

/**
 * Upload session persistence port — PP-07B interface.
 * Supabase adapter deferred to PP-05C; Upload Engine uses in-memory implementation.
 */
export type UploadSessionRepository = {
  save(scope: OwnerScope, session: UploadSession): Promise<PersistenceResult<void>>;
  findById(scope: OwnerScope, sessionId: EntityId): Promise<PersistenceResult<UploadSession>>;
  update(scope: OwnerScope, session: UploadSession): Promise<PersistenceResult<void>>;
  delete(scope: OwnerScope, sessionId: EntityId): Promise<PersistenceResult<void>>;
};
