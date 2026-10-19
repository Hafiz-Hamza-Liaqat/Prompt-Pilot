import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExportRecord } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  CreateExportInput,
  CursorPage,
  CursorPageRequest,
  OwnerScope,
  PersistenceResult,
} from '../../contracts';
import type { ExportRepository } from '../../repositories/export-repository';
import { mapContentExportRow, type ContentExportRow } from './mappers';
import {
  decodeCursor,
  encodeCursor,
  persistenceErr,
  persistenceFailure,
  persistenceNotFound,
  persistenceOk,
} from './shared';

const EXPORT_COLUMNS =
  'id, project_id, reference_id, package_ids, format, title, created_by_user_id, transformation_notice, created_at';

export class SupabaseExportRepository implements ExportRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(
    scope: OwnerScope,
    input: CreateExportInput,
    exportId: EntityId,
  ): Promise<PersistenceResult<ExportRecord>> {
    const { data, error } = await this.supabase
      .from('content_exports')
      .insert({
        id: exportId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        reference_id: input.referenceId,
        package_ids: input.packageIds,
        format: input.format,
        title: input.title,
        created_by_user_id: input.createdByUserId,
        transformation_notice: input.transformationNotice,
      })
      .select(EXPORT_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapContentExportRow(data as ContentExportRow));
  }

  async getById(scope: OwnerScope, exportId: EntityId): Promise<PersistenceResult<ExportRecord>> {
    const { data, error } = await this.supabase
      .from('content_exports')
      .select(EXPORT_COLUMNS)
      .eq('id', exportId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapContentExportRow(data as ContentExportRow));
  }

  async listByProject(
    scope: OwnerScope,
    request: CursorPageRequest,
  ): Promise<PersistenceResult<CursorPage<ExportRecord>>> {
    let query = this.supabase
      .from('content_exports')
      .select(EXPORT_COLUMNS)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(request.limit + 1);

    if (request.cursor) {
      const decoded = decodeCursor(request.cursor);
      if (!decoded) {
        return persistenceErr('validation_error', 'Invalid cursor');
      }
      query = query.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`,
      );
    }

    const { data, error } = await query;

    if (error) {
      return persistenceFailure(error);
    }

    const rows = (data ?? []) as Array<ContentExportRow & { created_at: string }>;
    const hasMore = rows.length > request.limit;
    const pageRows = hasMore ? rows.slice(0, request.limit) : rows;
    const last = pageRows.at(-1);

    return persistenceOk({
      items: pageRows.map((row) => mapContentExportRow(row)),
      nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
      hasMore,
    });
  }
}
