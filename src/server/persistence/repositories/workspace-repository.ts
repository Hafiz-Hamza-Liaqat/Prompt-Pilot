import type {
  OwnerScope,
  PersistenceResult,
  WorkspaceIntelligenceQuery,
  WorkspaceIntelligenceSnapshot,
} from '../contracts';

/**
 * Read-only workspace intelligence aggregate — PP-05A WorkspaceRepository.
 * Composes reference, analysis, packages, and active job. No writes.
 */
export interface WorkspaceRepository {
  getIntelligenceBundle(
    scope: OwnerScope,
    query?: WorkspaceIntelligenceQuery,
  ): Promise<PersistenceResult<WorkspaceIntelligenceSnapshot>>;
}
