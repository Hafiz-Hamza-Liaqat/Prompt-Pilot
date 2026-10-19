import type { JobRecord } from '@/domain/canonical';
import type { JobFailure } from '@/domain/canonical/job';
import type { ReferenceKind } from '@/domain/canonical/constants';
import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type { LinkMetadata } from '@/domain/link';
import type { MediaOwnerScope } from '@/domain/media';
import type { OrchestrationResult } from '@/domain/orchestration';

export type LinkIntelligenceRequest = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  rawUrl: string;
  requestedAt: IsoDateTime;
};

export type LinkIntelligencePortResult = OrchestrationResult<{
  linkMetadata: LinkMetadata;
  cacheHit: boolean;
}>;

/** Orchestrator delegate port — PP-05B. */
export type LinkIntelligencePort = {
  analyze(request: LinkIntelligenceRequest): Promise<LinkIntelligencePortResult>;
};

/**
 * Future job persistence boundary — no implementation in PP-08.
 */
export type JobPersistencePort = {
  saveJob(scope: MediaOwnerScope, job: JobRecord): Promise<OrchestrationResult<void>>;
  loadJob(scope: MediaOwnerScope, jobId: EntityId): Promise<OrchestrationResult<JobRecord>>;
};

export type AnalysisProviderRequest = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  requestedAt: IsoDateTime;
};

export type AnalysisProviderResult = OrchestrationResult<{
  analysisId: EntityId;
  completedAt: IsoDateTime;
}>;

export type AnalysisProviderPort = {
  readonly providerId: string;
  analyze(request: AnalysisProviderRequest): Promise<AnalysisProviderResult>;
};

export type PackageGenerationRequest = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  analysisId?: EntityId;
  requestedAt: IsoDateTime;
};

export type PackageGenerationResult = OrchestrationResult<{
  packageIds: readonly EntityId[];
  completedAt: IsoDateTime;
}>;

export type PackageEnginePort = {
  generate(request: PackageGenerationRequest): Promise<PackageGenerationResult>;
};

export type PersistArtifactsRequest = {
  jobId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceId: EntityId;
  analysisId?: EntityId;
  packageIds?: readonly EntityId[];
  occurredAt: IsoDateTime;
};

export type PersistenceCoordinatorResult = OrchestrationResult<{
  persistedAt: IsoDateTime;
}>;

export type PersistenceCoordinatorPort = {
  persistArtifacts(request: PersistArtifactsRequest): Promise<PersistenceCoordinatorResult>;
};

/** Orchestrator delegate port — PP-09B. */
export type CacheLookupRequest = {
  jobId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceId: EntityId;
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
  requestedAt: IsoDateTime;
};

export type CacheLookupOutcome = {
  hit: boolean;
  analysisId?: EntityId;
  cacheKey?: string;
  corrupt?: boolean;
};

export type CachePortResult = OrchestrationResult<CacheLookupOutcome>;

export type CachePort = {
  lookup(request: CacheLookupRequest): Promise<CachePortResult>;
};

export const ORCHESTRATION_PORT_TOKENS = {
  jobPersistence: Symbol.for('prompt-pilot.orchestration.JobPersistencePort'),
  linkIntelligence: Symbol.for('prompt-pilot.link.LinkIntelligencePort'),
  cache: Symbol.for('prompt-pilot.cache.CachePort'),
  analysisProvider: Symbol.for('prompt-pilot.orchestration.AnalysisProviderPort'),
  packageEngine: Symbol.for('prompt-pilot.orchestration.PackageEnginePort'),
  persistenceCoordinator: Symbol.for('prompt-pilot.orchestration.PersistenceCoordinatorPort'),
} as const;

export type OrchestrationPorts = {
  jobPersistence?: JobPersistencePort;
  linkIntelligence?: LinkIntelligencePort;
  cache?: CachePort;
  analysisProvider?: AnalysisProviderPort;
  packageEngine?: PackageEnginePort;
  persistenceCoordinator?: PersistenceCoordinatorPort;
};

export type PropagateFailureInput = {
  job: JobRecord;
  failure: JobFailure;
  occurredAt: IsoDateTime;
  attemptNumber: number;
};

export const LINK_INTELLIGENCE_PORT_TOKEN = ORCHESTRATION_PORT_TOKENS.linkIntelligence;
export const CACHE_PORT_TOKEN = ORCHESTRATION_PORT_TOKENS.cache;
