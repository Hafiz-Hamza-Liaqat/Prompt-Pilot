import type { SupabaseClient } from '@supabase/supabase-js';
import type { PackageEnvelope } from '@/domain/canonical';
import type { PackageType } from '@/domain/canonical/constants';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  OwnerScope,
  PackageQueryFilter,
  PersistenceResult,
} from '../../contracts';
import type { PackageRepository } from '../../repositories/package-repository';
import { mapContentPackageRow, type ContentPackageRow } from './mappers';
import {
  persistenceErr,
  persistenceFailure,
  persistenceNotFound,
  persistenceOk,
} from './shared';

const PACKAGE_COLUMNS = 'payload';

export class SupabasePackageRepository implements PackageRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async insert(
    scope: OwnerScope,
    packageEnvelope: PackageEnvelope,
  ): Promise<PersistenceResult<PackageEnvelope>> {
    if (packageEnvelope.projectId !== scope.projectId) {
      return persistenceErr('scope_violation', 'package projectId mismatch');
    }

    const { data, error } = await this.supabase
      .from('content_packages')
      .insert({
        id: packageEnvelope.packageId,
        project_id: scope.projectId,
        owner_id: scope.ownerId,
        reference_id: packageEnvelope.referenceId,
        analysis_id: packageEnvelope.analysisId,
        analysis_version: packageEnvelope.analysisVersion,
        package_type: packageEnvelope.packageType,
        package_version: packageEnvelope.packageVersion,
        created_by_job_id: packageEnvelope.createdByJobId ?? null,
        payload: packageEnvelope,
      })
      .select(PACKAGE_COLUMNS)
      .single();

    if (error || !data) {
      return persistenceFailure(error);
    }

    return persistenceOk(mapContentPackageRow(data as ContentPackageRow));
  }

  async getById(
    scope: OwnerScope,
    packageId: EntityId,
  ): Promise<PersistenceResult<PackageEnvelope>> {
    const { data, error } = await this.supabase
      .from('content_packages')
      .select(PACKAGE_COLUMNS)
      .eq('id', packageId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceNotFound();
    }

    return persistenceOk(mapContentPackageRow(data as ContentPackageRow));
  }

  async listByAnalysis(
    scope: OwnerScope,
    filter: PackageQueryFilter,
  ): Promise<PersistenceResult<PackageEnvelope[]>> {
    let query = this.supabase
      .from('content_packages')
      .select(PACKAGE_COLUMNS)
      .eq('analysis_id', filter.analysisId)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .order('package_version', { ascending: false });

    if (filter.packageType) {
      query = query.eq('package_type', filter.packageType);
    }

    const { data, error } = await query;

    if (error) {
      return persistenceFailure(error);
    }

    return persistenceOk((data ?? []).map((row) => mapContentPackageRow(row as ContentPackageRow)));
  }

  async getLatestByAnalysisAndType(
    scope: OwnerScope,
    analysisId: EntityId,
    packageType: PackageType,
  ): Promise<PersistenceResult<PackageEnvelope | null>> {
    const { data, error } = await this.supabase
      .from('content_packages')
      .select(PACKAGE_COLUMNS)
      .eq('analysis_id', analysisId)
      .eq('package_type', packageType)
      .eq('project_id', scope.projectId)
      .eq('owner_id', scope.ownerId)
      .order('package_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return persistenceFailure(error);
    }
    if (!data) {
      return persistenceOk(null);
    }

    return persistenceOk(mapContentPackageRow(data as ContentPackageRow));
  }
}
