import type { JobState } from '../canonical/constants.js';
import type { JobRecord } from '../canonical/job.js';
import type { IsoDateTime } from '../common.js';

/** PP-02 §7 — user may cancel from these active pipeline states. */
export const JOB_CANCELLABLE_STATES = [
  'queued',
  'preparing',
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
] as const satisfies readonly JobState[];

export type JobCancellableState = (typeof JOB_CANCELLABLE_STATES)[number];

export type JobCancellationRequest = {
  requestedAt: IsoDateTime;
  reason?: string;
};

export type JobCancellationResult = {
  previousState: JobState;
  cancelledAt: IsoDateTime;
  job: JobRecord;
};

export function isJobCancellableState(state: JobState): state is JobCancellableState {
  return (JOB_CANCELLABLE_STATES as readonly JobState[]).includes(state);
}

export function canCancelJob(job: JobRecord): boolean {
  return isJobCancellableState(job.state);
}

export function buildCancellationTransition(
  job: JobRecord,
  request: JobCancellationRequest,
): JobRecord {
  return {
    ...job,
    state: 'cancelled',
    updatedAt: request.requestedAt,
    completedAt: request.requestedAt,
    failure: undefined,
  };
}

/** States eligible for queue or temp-media TTL expiry. */
export const JOB_EXPIRABLE_STATES = [
  'queued',
  'preparing',
  'uploading',
] as const satisfies readonly JobState[];

export type JobExpirableState = (typeof JOB_EXPIRABLE_STATES)[number];

export function isJobExpirableState(state: JobState): state is JobExpirableState {
  return (JOB_EXPIRABLE_STATES as readonly JobState[]).includes(state);
}

export function buildExpirationTransition(job: JobRecord, expiredAt: IsoDateTime): JobRecord {
  return {
    ...job,
    state: 'expired',
    updatedAt: expiredAt,
    completedAt: expiredAt,
    failure: undefined,
  };
}
