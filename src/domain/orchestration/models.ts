import type { ReferenceKind } from '../canonical/constants.js';
import type { JobFailure, JobRecord } from '../canonical/job.js';
import type { EntityId, MonotonicVersion } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';
import type { ExecutionPlan } from './execution-plan.js';
import type { OrchestrationEventType } from './events.js';
import type { PipelineStageId } from './stages.js';

/** Runtime scope for a single orchestrated pipeline run. */
export type OrchestrationContext = {
  ownerId: EntityId;
  projectId: EntityId;
  referenceId: EntityId;
  job: JobRecord;
  plan: ExecutionPlan;
  attemptNumber: number;
  currentStageId: PipelineStageId | null;
  /** Bound when media_intake upload session is active — PP-07B. */
  uploadSessionId?: EntityId;
  /** Bound when link_intelligence completes — PP-05B. */
  linkMetadataId?: EntityId;
  /** URL media descriptor from Media Intake handoff — PP-05B.1. */
  urlMediaDescriptorId?: EntityId;
  /** Bound when fingerprint stage completes — upstream of cache_lookup. */
  fingerprintId?: EntityId;
  fingerprintAlgorithmVersion?: MonotonicVersion;
  /** Bound when cache_lookup hits — analysis reused without core_analysis. */
  analysisId?: EntityId;
};

export const ORCHESTRATION_ERROR_CODES = [
  'validation_error',
  'invalid_stage',
  'stage_out_of_order',
  'lifecycle_rejected',
  'not_cancellable',
  'retry_not_allowed',
  'resume_not_allowed',
  'failure_propagation_error',
  'timeout_exceeded',
  'port_unavailable',
] as const;

export type OrchestrationErrorCode = (typeof ORCHESTRATION_ERROR_CODES)[number];

export type OrchestrationError = {
  code: OrchestrationErrorCode;
  message: string;
  stageId?: PipelineStageId;
  /** Canonical job failure code when a port maps coordinator/provider errors — PP-05B.1. */
  jobFailureCode?: JobFailure['code'];
};

export type OrchestrationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: OrchestrationError };

export function orchestrationOk<T>(data: T): OrchestrationResult<T> {
  return { ok: true, data };
}

export function orchestrationErr<T>(
  code: OrchestrationErrorCode,
  message: string,
  meta?: Pick<OrchestrationError, 'stageId' | 'jobFailureCode'>,
): OrchestrationResult<T> {
  return { ok: false, error: { code, message, ...meta } };
}

export type StartOrchestrationRequest = {
  jobId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceId: EntityId;
  referenceKind: ReferenceKind;
  occurredAt: IsoDateTime;
  retryOfJobId?: EntityId;
};

export type CancelOrchestrationRequest = {
  context: OrchestrationContext;
  requestedAt: IsoDateTime;
  reason?: string;
};

export type RetryOrchestrationRequest = {
  context: OrchestrationContext;
  attemptNumber: number;
};

export type ResumeOrchestrationRequest = {
  context: OrchestrationContext;
  checkpointStageId: PipelineStageId;
  requestedAt: IsoDateTime;
};

export type FailurePropagationRequest = {
  context: OrchestrationContext;
  failure: JobFailure;
  occurredAt: IsoDateTime;
  stageId: PipelineStageId;
};

export type OrchestrationOutcome = {
  context: OrchestrationContext;
  events: readonly OrchestrationEventType[];
};
