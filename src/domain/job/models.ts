import type { JobState } from '../canonical/constants.js';
import type { JobFailure, JobRecord } from '../canonical/job.js';
import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';

/**
 * Canonical job aggregate for lifecycle operations.
 * Wraps {@link JobRecord} without extending PP-03 schema fields.
 */
export type Job = JobRecord;

/** Input to create a new pipeline job (ids assigned by orchestrator). */
export type JobCreateInput = {
  referenceId: EntityId;
  retryOfJobId?: EntityId;
};

/** Metadata captured when a job is first registered in the lifecycle layer. */
export type JobRegistration = {
  jobId: EntityId;
  projectId: EntityId;
  referenceId: EntityId;
  retryOfJobId?: EntityId;
  createdAt: IsoDateTime;
};

/** Request to move a job to the next lifecycle state. Persistence-agnostic. */
export type JobTransitionRequest = {
  nextState: JobState;
  progressPercent: number;
  failure?: JobFailure;
  completedAt?: IsoDateTime;
  cacheHit?: boolean;
  occurredAt: IsoDateTime;
};

/** Successful transition output — immutable snapshot for downstream persistence. */
export type JobTransitionResult = {
  previousState: JobState;
  nextState: JobState;
  job: JobRecord;
};

/** Lifecycle-layer status codes (distinct from persistence and HTTP). */
export const JOB_LIFECYCLE_ERROR_CODES = [
  'invalid_transition',
  'terminal_state',
  'progress_regression',
  'progress_mismatch',
  'missing_failure',
  'unexpected_failure',
  'not_cancellable',
  'retry_not_allowed',
  'resume_not_allowed',
  'validation_error',
] as const;

export type JobLifecycleErrorCode = (typeof JOB_LIFECYCLE_ERROR_CODES)[number];

export type JobLifecycleError = {
  code: JobLifecycleErrorCode;
  message: string;
  fromState?: JobState;
  toState?: JobState;
};

export type JobLifecycleResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: JobLifecycleError };

export function jobLifecycleOk<T>(data: T): JobLifecycleResult<T> {
  return { ok: true, data };
}

export function jobLifecycleErr<T>(
  code: JobLifecycleErrorCode,
  message: string,
  meta?: Pick<JobLifecycleError, 'fromState' | 'toState'>,
): JobLifecycleResult<T> {
  return { ok: false, error: { code, message, ...meta } };
}
