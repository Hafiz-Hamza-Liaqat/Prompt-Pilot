import type { ExportRecord } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  CreateExportInput,
  CursorPage,
  CursorPageRequest,
  OwnerScope,
  PersistenceResult,
} from '../contracts';

/**
 * Export delivery event persistence — PP-05A ExportRepository.
 */
export interface ExportRepository {
  insert(
    scope: OwnerScope,
    input: CreateExportInput,
    exportId: EntityId,
  ): Promise<PersistenceResult<ExportRecord>>;

  getById(scope: OwnerScope, exportId: EntityId): Promise<PersistenceResult<ExportRecord>>;

  listByProject(
    scope: OwnerScope,
    request: CursorPageRequest,
  ): Promise<PersistenceResult<CursorPage<ExportRecord>>>;
}
