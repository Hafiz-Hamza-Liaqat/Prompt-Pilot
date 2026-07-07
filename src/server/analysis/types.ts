import type { ReferenceKind } from '@/domain/canonical/constants';
import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';
import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type { LinkMetadata } from '@/domain/link';
import type { TemporaryAsset, UrlMediaIntakeDescriptor } from '@/domain/media';

/** Unsaved analysis DTO — coordinator assigns analysisId before insert. */
export type ReferenceVideoAnalysisDraft = Omit<ReferenceVideoAnalysis, 'analysisId'>;

/** Normalized intake snapshot for mock/AI providers — not a new domain entity. */
export type ReferenceIntakeView = {
  linkMetadata?: LinkMetadata;
  urlDescriptor?: UrlMediaIntakeDescriptor;
  uploadAsset?: Pick<
    TemporaryAsset,
    'assetId' | 'mimeType' | 'byteSize' | 'durationSeconds' | 'storageLocator'
  >;
  transcriptText?: string;
  scriptText?: string;
  rightsAttestationId?: EntityId;
};

/** Internal — CoreAnalysisCoordinator only (PP-10). */
export type AnalyzeReferenceInput = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
  occurredAt: IsoDateTime;
  /** Resolved intake — coordinator loads missing pieces from repos when absent. */
  intake: ReferenceIntakeView;
};

/** Stage-runner boundary — test/runtime helpers only (PP-10). */
export type CoreAnalysisStageInput = {
  occurredAt: IsoDateTime;
  /** Test-double override when upstream intake is not fully wired. */
  intakeOverride?: Partial<ReferenceIntakeView>;
  fingerprintId?: EntityId;
  fingerprintAlgorithmVersion?: MonotonicVersion;
};

/** Coordinator request — intake assembly stays on the analysis boundary (PP-10). */
export type CoreAnalysisCoordinatorRequest = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
  occurredAt: IsoDateTime;
  intake: ReferenceIntakeView;
  intakeOverride?: Partial<ReferenceIntakeView>;
};

export type AnalyzeReferenceOutcome = {
  analysisId: EntityId;
  completedAt: IsoDateTime;
};
