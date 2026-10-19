import type { SupabaseClient } from '@supabase/supabase-js';
import type { Reference } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  CreateReferenceInput,
  OffsetPage,
  OffsetPageRequest,
  OwnerScope,
  PersistenceResult,
  UpdateReferenceInput,
} from '../../contracts';
import type { ReferenceRepository } from '../../repositories/reference-repository';
import {
  mapContentReferenceRow,
  type ContentReferenceRow,
} from './mappers';
import {
  persistenceFailure,
  persistenceNotFound,
  persistenceOk,
} from './shared';

const REFERENCE_COLUMNS =
  'id, project_id, owner_id, reference_kind, platform, canonical_url, platform_content_id, title, submitted_at, access_status, rights_attestation_id';

export class SupabaseReferenceRepository implements ReferenceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(
    scope: OwnerScope,
    input: CreateReferenceInput,
    referenceId: EntityId,
  ): Promise<PersistenceResult<Reference>> {
    const submittedAt = new Date().toISOString();
    const { data, error } = await this.supabase
      .from('content_references')
      .insert({
        id: referenceId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        reference_kind: input.referenceKind,
        platform: input.platform ?? null,
        canonical_url: input.canonicalUrl ?? null,
        platform_content_id: input.platformContentId ?? null,
        title: input.title ?? null,
        submitted_at: submittedAt,
        access_status: input.accessStatus,
        rights_attestation_id: input.rightsAttestationId ?? null,
      })
      .select(REFERENCE_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapContentReferenceRow(data as ContentReferenceRow));
  }

  async getById(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<PersistenceResult<Reference>> {
    const { data, error } = await this.supabase
      .from('content_references')
      .select(REFERENCE_COLUMNS)
      .eq('id', referenceId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapContentReferenceRow(data as ContentReferenceRow));
  }

  async listByProject(
    scope: OwnerScope,
    request: OffsetPageRequest,
  ): Promise<PersistenceResult<OffsetPage<Reference>>> {
    const { count, error: countError } = await this.supabase
      .from('content_references')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId);

    if (countError) {
      return persistenceFailure(countError);
    }

    const { data, error } = await this.supabase
      .from('content_references')
      .select(REFERENCE_COLUMNS)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .order('submitted_at', { ascending: false })
      .range(request.offset, request.offset + request.limit - 1);

    if (error) {
      return persistenceFailure(error);
    }

    return persistenceOk({
      items: (data ?? []).map((row) => mapContentReferenceRow(row as ContentReferenceRow)),
      total: count ?? 0,
    });
  }

  async getLatestByProject(
    scope: OwnerScope,
  ): Promise<PersistenceResult<Reference | null>> {
    const { data, error } = await this.supabase
      .from('content_references')
      .select(REFERENCE_COLUMNS)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceOk(null);
    }

    return persistenceOk(mapContentReferenceRow(data as ContentReferenceRow));
  }

  async updateMetadata(
    scope: OwnerScope,
    input: UpdateReferenceInput,
  ): Promise<PersistenceResult<Reference>> {
    const patch: Record<string, unknown> = {};
    if (input.accessStatus !== undefined) {
      patch.access_status = input.accessStatus;
    }
    if (input.title !== undefined) {
      patch.title = input.title;
    }
    if (input.platformContentId !== undefined) {
      patch.platform_content_id = input.platformContentId;
    }

    if (Object.keys(patch).length === 0) {
      return this.getById(scope, input.referenceId);
    }

    const { data, error } = await this.supabase
      .from('content_references')
      .update(patch)
      .eq('id', input.referenceId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .select(REFERENCE_COLUMNS)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapContentReferenceRow(data as ContentReferenceRow));
  }
}
