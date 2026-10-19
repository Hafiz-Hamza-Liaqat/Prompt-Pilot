import type { JobState } from '../canonical/constants.js';
import type { JobRecord } from '../canonical/job.js';
import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';

/** Conceptual checkpoint boundaries — PP-02 §8. */
export const JOB_RESUME_CHECKPOINTS = [
  'upload_bytes',
  'post_fingerprinting',
  'post_analyzing',
  'post_package_type',
] as const;

export type JobResumeCheckpoint = (typeof JOB_RESUME_CHECKPOINTS)[number];

/** States where worker or upload resume may apply without creating a new job. */
export const JOB_RESUMABLE_STATES = [
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
  'saving',
] as const satisfies readonly JobState[];

export type JobResumableState = (typeof JOB_RESUMABLE_STATES)[number];

export type JobResumeCheckpointRecord = {
  checkpoint: JobResumeCheckpoint;
  jobId: EntityId;
  stateAtCheckpoint: JobState;
  recordedAt: IsoDateTime;
  packageType?: string;
};

export type JobResumeRequest = {
  jobId: EntityId;
  checkpoint: JobResumeCheckpoint;
  requestedAt: IsoDateTime;
};

export type JobResumeDecision =
  | { allowed: true; resumeState: JobResumableState; checkpoint: JobResumeCheckpointRecord }
  | { allowed: false; reason: 'not_resumable_state' | 'checkpoint_unavailable' | 'terminal_job' };

const CHECKPOINT_STATE: Record<JobResumeCheckpoint, JobResumableState> = {
  upload_bytes: 'uploading',
  post_fingerprinting: 'fingerprinting',
  post_analyzing: 'analyzing',
  post_package_type: 'generating_packages',
};

export function isJobResumableState(state: JobState): state is JobResumableState {
  return (JOB_RESUMABLE_STATES as readonly JobState[]).includes(state);
}

export function resolveResumeState(checkpoint: JobResumeCheckpoint): JobResumableState {
  return CHECKPOINT_STATE[checkpoint];
}

export function evaluateResume(
  job: JobRecord,
  checkpoint: JobResumeCheckpointRecord,
): JobResumeDecision {
  if (job.state === 'completed' || job.state === 'cancelled' || job.state === 'expired') {
    return { allowed: false, reason: 'terminal_job' };
  }

  if (!isJobResumableState(job.state)) {
    return { allowed: false, reason: 'not_resumable_state' };
  }

  if (checkpoint.jobId !== job.jobId) {
    return { allowed: false, reason: 'checkpoint_unavailable' };
  }

  const resumeState = resolveResumeState(checkpoint.checkpoint);
  if (job.state !== resumeState && job.state !== checkpoint.stateAtCheckpoint) {
    return { allowed: false, reason: 'checkpoint_unavailable' };
  }

  return { allowed: true, resumeState, checkpoint };
}

/** Upload-only resume contract — PP-02 §8. */
export type UploadResumeRequest = {
  jobId: EntityId;
  bytesUploaded: number;
  requestedAt: IsoDateTime;
};

export function canResumeUpload(job: JobRecord): boolean {
  return job.state === 'uploading';
}
