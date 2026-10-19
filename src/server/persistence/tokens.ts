import type { AnalysisRepository } from './repositories/analysis-repository';
import type { AttestationRepository } from './repositories/attestation-repository';
import type { CacheRepository } from './repositories/cache-repository';
import type { ExportRepository } from './repositories/export-repository';
import type { FingerprintRepository } from './repositories/fingerprint-repository';
import type { JobRepository } from './repositories/job-repository';
import type { PackageRepository } from './repositories/package-repository';
import type { ReferenceIntakePayloadRepository } from './repositories/reference-intake-payload-repository';
import type { ReferenceRepository } from './repositories/reference-repository';
import type { WorkspaceRepository } from './repositories/workspace-repository';
import type { UnitOfWork } from './contracts/transaction';

/**
 * Dependency injection tokens for pivot persistence repositories.
 * Use with explicit constructor injection or a future composition root.
 */
export const PERSISTENCE_TOKENS = {
  referenceRepository: Symbol.for('prompt-pilot.persistence.ReferenceRepository'),
  attestationRepository: Symbol.for('prompt-pilot.persistence.AttestationRepository'),
  referenceIntakePayloadRepository: Symbol.for(
    'prompt-pilot.persistence.ReferenceIntakePayloadRepository',
  ),
  analysisRepository: Symbol.for('prompt-pilot.persistence.AnalysisRepository'),
  packageRepository: Symbol.for('prompt-pilot.persistence.PackageRepository'),
  jobRepository: Symbol.for('prompt-pilot.persistence.JobRepository'),
  exportRepository: Symbol.for('prompt-pilot.persistence.ExportRepository'),
  workspaceRepository: Symbol.for('prompt-pilot.persistence.WorkspaceRepository'),
  fingerprintRepository: Symbol.for('prompt-pilot.persistence.FingerprintRepository'),
  cacheRepository: Symbol.for('prompt-pilot.persistence.CacheRepository'),
  unitOfWork: Symbol.for('prompt-pilot.persistence.UnitOfWork'),
} as const;

export type PersistenceToken = (typeof PERSISTENCE_TOKENS)[keyof typeof PERSISTENCE_TOKENS];

export type PivotRepositoryMap = {
  referenceRepository: ReferenceRepository;
  attestationRepository: AttestationRepository;
  referenceIntakePayloadRepository: ReferenceIntakePayloadRepository;
  analysisRepository: AnalysisRepository;
  packageRepository: PackageRepository;
  jobRepository: JobRepository;
  exportRepository: ExportRepository;
  workspaceRepository: WorkspaceRepository;
  fingerprintRepository: FingerprintRepository;
  cacheRepository: CacheRepository;
};

export type PivotRepositoryKey = keyof PivotRepositoryMap;

/**
 * Registration contract for composition roots (PP-08 orchestrator wiring).
 * No runtime container is provided in PP-05B.
 */
export type PivotRepositoryRegistry = PivotRepositoryMap & {
  unitOfWork: UnitOfWork;
};

export type PivotRepositoryRegistration<K extends PivotRepositoryKey> = {
  token: (typeof PERSISTENCE_TOKENS)[K];
  repository: PivotRepositoryMap[K];
};
