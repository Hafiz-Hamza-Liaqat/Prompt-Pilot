import type { SupabaseClient } from '@supabase/supabase-js';
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
} from '../../contracts';
import type { JobRepository } from '../../repositories/job-repository';
import { mapAnalysisJobRow, type AnalysisJobRow } from './mappers';
import {
  decodeCursor,
  encodeCursor,
  persistenceErr,
  persistenceFailure,
  persistenceNotFound,
  persistenceOk,
  TERMINAL_JOB_STATES,
} from './shared';

const JOB_COLUMNS =
  'id, project_id, reference_id, state, progress_percent, retry_of_job_id, cache_hit, failure, created_at, updated_at, completed_at';

export class SupabaseJobRepository implements JobRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async create(
    scope: OwnerScope,
    input: CreateJobInput,
    jobId: EntityId,
  ): Promise<PersistenceResult<JobRecord>> {
    const { data, error } = await this.supabase
      .from('analysis_jobs')
      .insert({
        id: jobId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        reference_id: input.referenceId,
        state: 'created',
        progress_percent: 0,
        retry_of_job_id: input.retryOfJobId ?? null,
      })
      .select(JOB_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapAnalysisJobRow(data as AnalysisJobRow));
  }

  async getById(scope: OwnerScope, jobId: EntityId): Promise<PersistenceResult<JobRecord>> {
    const { data, error } = await this.supabase
      .from('analysis_jobs')
      .select(JOB_COLUMNS)
      .eq('id', jobId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapAnalysisJobRow(data as AnalysisJobRow));
  }

  async transitionState(
    scope: OwnerScope,
    input: JobStateTransitionInput,
  ): Promise<PersistenceResult<JobRecord>> {
    const patch: Record<string, unknown> = {
      state: input.nextState,
      progress_percent: input.progressPercent,
    };

    if (input.failure !== undefined) {
      patch.failure = input.failure;
    }
    if (input.completedAt !== undefined) {
      patch.completed_at = input.completedAt;
    }
    if (input.cacheHit !== undefined) {
      patch.cache_hit = input.cacheHit;
    }

    const { data, error } = await this.supabase
      .from('analysis_jobs')
      .update(patch)
      .eq('id', input.jobId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .eq('state', input.expectedState)
      .select(JOB_COLUMNS)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceErr('conflict', 'Job state transition conflict');
    }

    return persistenceOk(mapAnalysisJobRow(data as AnalysisJobRow));
  }

  async appendEvent(
    scope: OwnerScope,
    jobId: EntityId,
    event: AppendJobEventInput,
    eventId: EntityId,
  ): Promise<PersistenceResult<JobEventRecord>> {
    const { data, error } = await this.supabase
      .from('job_events')
      .insert({
        id: eventId,
        job_id: jobId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        stage: event.stage,
        event_type: event.eventType,
        message: event.message ?? null,
        occurred_at: event.occurredAt,
      })
      .select('id, job_id, stage, event_type, message, occurred_at')
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk({
      eventId: data.id,
      jobId: data.job_id,
      stage: data.stage,
      eventType: data.event_type,
      message: data.message ?? undefined,
      occurredAt: data.occurred_at,
    });
  }

  async listByReference(
    scope: OwnerScope,
    referenceId: EntityId,
    request: CursorPageRequest,
  ): Promise<PersistenceResult<CursorPage<JobRecord>>> {
    let query = this.supabase
      .from('analysis_jobs')
      .select(JOB_COLUMNS)
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

    const rows = (data ?? []) as Array<AnalysisJobRow & { created_at: string }>;
    const hasMore = rows.length > request.limit;
    const pageRows = hasMore ? rows.slice(0, request.limit) : rows;
    const last = pageRows.at(-1);

    return persistenceOk({
      items: pageRows.map((row) => mapAnalysisJobRow(row)),
      nextCursor: hasMore && last ? encodeCursor(last.created_at, last.id) : null,
      hasMore,
    });
  }

  async getActiveByProject(scope: OwnerScope): Promise<PersistenceResult<JobRecord | null>> {
    const { data, error } = await this.supabase
      .from('analysis_jobs')
      .select(JOB_COLUMNS)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .not(
        'state',
        'in',
        `(${TERMINAL_JOB_STATES.map((state) => `"${state}"`).join(',')})`,
      )
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceOk(null);
    }

    return persistenceOk(mapAnalysisJobRow(data as AnalysisJobRow));
  }
}
