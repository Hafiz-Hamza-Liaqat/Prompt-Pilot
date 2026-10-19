import type { IsoDateTime } from '@/domain/common';
import type {
  AccessStatus,
  FingerprintState,
  JobState,
  PackageType,
} from '@/domain/canonical/constants';
import type {
  ContentFingerprint,
  ExportRecord,
  JobFailure,
  JobRecord,
  PackageEnvelope,
  Reference,
  ReferenceVideoAnalysis,
} from '@/domain/canonical';
import type { EntityId, MonotonicVersion, SemanticVersion } from '@/domain/canonical/primitives';

/** Input for creating a Reference at intake (server assigns ids and timestamps). */
export type CreateReferenceInput = {
  referenceKind: Reference['referenceKind'];
  canonicalUrl?: Reference['canonicalUrl'];
  platform?: Reference['platform'];
  platformContentId?: Reference['platformContentId'];
  title?: Reference['title'];
  accessStatus: AccessStatus;
  rightsAttestationId?: EntityId;
};

export type RightsAttestationRecord = {
  attestationId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  attestationVersion: string;
  acceptedAt: IsoDateTime;
  createdAt: IsoDateTime;
};

export type CreateAttestationInput = {
  attestationVersion: string;
};

export type ReferenceIntakePayloadKind = 'transcript' | 'script';

export type ReferenceIntakePayloadRecord = {
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  payloadKind: ReferenceIntakePayloadKind;
  bodyText: string;
  createdAt: IsoDateTime;
};

export type CreateReferenceIntakePayloadInput = {
  referenceId: EntityId;
  payloadKind: ReferenceIntakePayloadKind;
  bodyText: string;
};

export type UpdateReferenceInput = {
  referenceId: EntityId;
  accessStatus?: AccessStatus;
  title?: Reference['title'];
  platformContentId?: Reference['platformContentId'];
};

export type CreateJobInput = {
  referenceId: EntityId;
  retryOfJobId?: EntityId;
};

export type JobStateTransitionInput = {
  jobId: EntityId;
  expectedState: JobState;
  nextState: JobState;
  progressPercent: number;
  failure?: JobFailure;
  completedAt?: IsoDateTime;
  cacheHit?: boolean;
};

export type JobEventRecord = {
  eventId: EntityId;
  jobId: EntityId;
  stage: JobState;
  eventType: 'stage_entered' | 'stage_completed' | 'checkpoint' | 'warning';
  message?: string;
  occurredAt: IsoDateTime;
};

export type AppendJobEventInput = Omit<JobEventRecord, 'eventId' | 'jobId'>;

export type CacheEntryRecord = {
  cacheKey: string;
  fingerprintId: EntityId;
  analysisId: EntityId;
  analysisVersion: MonotonicVersion;
  pipelineVersion: SemanticVersion;
  scopeUserId: EntityId;
  createdAt: IsoDateTime;
  expiresAt: IsoDateTime;
  lastHitAt?: IsoDateTime;
  hitCount: number;
  invalidatedAt?: IsoDateTime;
};

export type CreateCacheEntryInput = Omit<
  CacheEntryRecord,
  'createdAt' | 'lastHitAt' | 'hitCount' | 'invalidatedAt'
>;

export type CacheLookupResult = {
  hit: boolean;
  entry?: CacheEntryRecord;
  analysisId?: EntityId;
};

export type FingerprintLookupKey = {
  referenceKind: ContentFingerprint['referenceKind'];
  fingerprintAlgorithmVersion: MonotonicVersion;
  identityDescriptor: string;
  scopeUserId: EntityId;
};

export type CreateExportInput = Omit<
  ExportRecord,
  'exportId' | 'createdAt' | 'projectId'
>;

export type PackageQueryFilter = {
  analysisId: EntityId;
  packageType?: PackageType;
};

export type AnalysisVersionQuery = {
  referenceId: EntityId;
  analysisVersion?: MonotonicVersion;
};

export type WorkspaceIntelligenceSnapshot = {
  reference: Reference | null;
  analysis: ReferenceVideoAnalysis | null;
  packages: PackageEnvelope[];
  activeJob: JobRecord | null;
};

export type WorkspaceIntelligenceQuery = {
  referenceId?: EntityId;
  analysisId?: EntityId;
  includePackages?: boolean;
};

export type PromoteFingerprintInput = {
  fingerprintId: EntityId;
  fromState: Extract<FingerprintState, 'candidate'>;
  toState: Extract<FingerprintState, 'active'>;
};
