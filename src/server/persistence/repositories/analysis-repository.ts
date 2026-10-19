import type { ReferenceVideoAnalysis } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  AnalysisVersionQuery,
  CursorPage,
  CursorPageRequest,
  OwnerScope,
  PersistenceResult,
} from '../contracts';

/**
 * Immutable ReferenceVideoAnalysis snapshot persistence — PP-05A AnalysisRepository.
 */
export interface AnalysisRepository {
  insert(
    scope: OwnerScope,
    analysis: ReferenceVideoAnalysis,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis>>;

  getById(
    scope: OwnerScope,
    analysisId: EntityId,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis>>;

  listByReference(
    scope: OwnerScope,
    referenceId: EntityId,
    request: CursorPageRequest,
  ): Promise<PersistenceResult<CursorPage<ReferenceVideoAnalysis>>>;

  getLatestByReference(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis | null>>;

  /**
   * Marks the given analysis as latest and clears isLatest on sibling versions.
   * Must run in a single transaction (implementation phase).
   */
  setLatestVersion(
    scope: OwnerScope,
    query: AnalysisVersionQuery & { analysisId: EntityId },
  ): Promise<PersistenceResult<void>>;
}
