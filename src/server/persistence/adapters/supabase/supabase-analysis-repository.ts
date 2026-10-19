import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReferenceVideoAnalysis } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  AnalysisVersionQuery,
  CursorPage,
  CursorPageRequest,
  OwnerScope,
  PersistenceResult,
} from '../../contracts';
import type { AnalysisRepository } from '../../repositories/analysis-repository';
import {
  mapReferenceAnalysisRow,
  type ReferenceAnalysisRow,
} from './mappers';
import {
  decodeCursor,
  encodeCursor,
  persistenceFailure,
  persistenceNotFound,
  persistenceOk,
  persistenceErr,
} from './shared';

const ANALYSIS_COLUMNS = 'id, payload, created_at';

export class SupabaseAnalysisRepository implements AnalysisRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(
    scope: OwnerScope,
    analysis: ReferenceVideoAnalysis,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis>> {
    if (analysis.projectId !== scope.projectId) {
      return persistenceErr('scope_violation', 'analysis projectId mismatch');
    }

    const { data, error } = await this.supabase
      .from('reference_analyses')
      .insert({
        id: analysis.analysisId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        reference_id: analysis.referenceId,
        fingerprint_id: analysis.fingerprintId,
        pipeline_version: analysis.pipelineVersion,
        analysis_version: analysis.version.analysisVersion,
        is_latest: analysis.version.isLatest,
        supersedes_analysis_id: analysis.version.supersedesAnalysisId ?? null,
        change_reason: analysis.version.changeReason,
        payload: analysis,
      })
      .select(ANALYSIS_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapReferenceAnalysisRow(data as ReferenceAnalysisRow));
  }

  async getById(
    scope: OwnerScope,
    analysisId: EntityId,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis>> {
    const { data, error } = await this.supabase
      .from('reference_analyses')
      .select(ANALYSIS_COLUMNS)
      .eq('id', analysisId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapReferenceAnalysisRow(data as ReferenceAnalysisRow));
  }

  async listByReference(
    scope: OwnerScope,
    referenceId: EntityId,
    request: CursorPageRequest,
  ): Promise<PersistenceResult<CursorPage<ReferenceVideoAnalysis>>> {
    let query = this.supabase
      .from('reference_analyses')
      .select(`${ANALYSIS_COLUMNS}`)
      .eq('reference_id', referenceId)
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

    const rows = (data ?? []) as Array<ReferenceAnalysisRow & { created_at: string }>;
    const hasMore = rows.length > request.limit;
    const pageRows = hasMore ? rows.slice(0, request.limit) : rows;
    const last = pageRows.at(-1);

    return persistenceOk({
      items: pageRows.map((row) => mapReferenceAnalysisRow(row)),
      nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
      hasMore,
    });
  }

  async getLatestByReference(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<ReferenceVideoAnalysis | null>> {
    const { data, error } = await this.supabase
      .from('reference_analyses')
      .select(ANALYSIS_COLUMNS)
      .eq('reference_id', referenceId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .eq('is_latest', true)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceOk(null);
    }

    return persistenceOk(mapReferenceAnalysisRow(data as ReferenceAnalysisRow));
  }

  async setLatestVersion(
    scope: OwnerScope,
    query: AnalysisVersionQuery & { analysisId: EntityId },
  ): Promise<PersistenceResult<void>> {
    const { error } = await this.supabase.rpc('prompt_pilot_set_latest_analysis', {
      p_project_id: scope.projectId,
      p_reference_id: query.referenceId,
      p_analysis_id: query.analysisId,
    });

    if (error) {
      if (error.code === 'P0002') {
        return persistenceNotFound(error.message);
      }
      return persistenceFailure(error);
    }

    return persistenceOk(undefined);
  }
}
