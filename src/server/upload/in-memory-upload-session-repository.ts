import type { UploadSession } from '@/domain/media';
import type { EntityId } from '@/domain/canonical/primitives';
import type { UploadSessionRepository } from '@/server/persistence/repositories/upload-session-repository';
import type { OwnerScope } from '@/server/persistence/contracts/ownership';
import type { PersistenceResult } from '@/server/persistence/contracts/result';
import { persistenceOk, persistenceErr } from '@/server/persistence/contracts/result';

function scopeKey(scope: OwnerScope): string {
  return `${scope.ownerId}:${scope.projectId}`;
}

export class InMemoryUploadSessionRepository implements UploadSessionRepository {
  private readonly sessions = new Map<string, Map<string, UploadSession>>();

  async save(scope: OwnerScope, session: UploadSession): Promise<PersistenceResult<void>> {
    const bucket = this.sessions.get(scopeKey(scope)) ?? new Map<string, UploadSession>();
    bucket.set(session.sessionId, session);
    this.sessions.set(scopeKey(scope), bucket);
    return persistenceOk(undefined);
  }

  async findById(scope: OwnerScope, sessionId: EntityId): Promise<PersistenceResult<UploadSession>> {
    const session = this.sessions.get(scopeKey(scope))?.get(sessionId);
    if (!session) {
      return persistenceErr('not_found', 'Upload session not found');
    }
    return persistenceOk(session);
  }

  async update(scope: OwnerScope, session: UploadSession): Promise<PersistenceResult<void>> {
    const bucket = this.sessions.get(scopeKey(scope));
    if (!bucket?.has(session.sessionId)) {
      return persistenceErr('not_found', 'Upload session not found');
    }
    bucket.set(session.sessionId, session);
    return persistenceOk(undefined);
  }

  async delete(scope: OwnerScope, sessionId: EntityId): Promise<PersistenceResult<void>> {
    const bucket = this.sessions.get(scopeKey(scope));
    if (!bucket?.has(sessionId)) {
      return persistenceErr('not_found', 'Upload session not found');
    }
    bucket.delete(sessionId);
    return persistenceOk(undefined);
  }
}
