import type { PackageEnvelope } from '@/domain/canonical';
import type { PackageType } from '@/domain/canonical/constants';
import type { EntityId } from '@/domain/canonical/primitives';
import type {
  OwnerScope,
  PackageQueryFilter,
  PersistenceResult,
} from '../contracts';

/**
 * Immutable Package envelope persistence — PP-05A PackageRepository.
 * PackageManifest fields are persisted with the envelope (embedded or normalized at implementation).
 */
export interface PackageRepository {
  insert(
    scope: OwnerScope,
    packageEnvelope: PackageEnvelope,
  ): Promise<PersistenceResult<PackageEnvelope>>;

  getById(
    scope: OwnerScope,
    packageId: EntityId,
  ): Promise<PersistenceResult<PackageEnvelope>>;

  listByAnalysis(
    scope: OwnerScope,
    filter: PackageQueryFilter,
  ): Promise<PersistenceResult<PackageEnvelope[]>>;

  getLatestByAnalysisAndType(
    scope: OwnerScope,
    analysisId: EntityId,
    packageType: PackageType,
  ): Promise<PersistenceResult<PackageEnvelope | null>>;
}
