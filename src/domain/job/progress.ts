import type { JobState } from '../canonical/constants.js';
import {
  JOB_PROGRESS_STAGE_WEIGHTS,
  type JobProgressStage,
} from '../canonical/job.js';

/** Maps active pipeline states to PP-02 progress stage weights. */
export const JOB_STATE_PROGRESS_WEIGHTS: Record<
  Exclude<JobState, 'failed' | 'cancelled' | 'expired' | 'retry_pending'>,
  number
> = {
  created: 0,
  validated: JOB_PROGRESS_STAGE_WEIGHTS.validated,
  queued: JOB_PROGRESS_STAGE_WEIGHTS.validated,
  preparing: JOB_PROGRESS_STAGE_WEIGHTS.preparing,
  uploading: JOB_PROGRESS_STAGE_WEIGHTS.uploading,
  fingerprinting: JOB_PROGRESS_STAGE_WEIGHTS.fingerprinting,
  analyzing: JOB_PROGRESS_STAGE_WEIGHTS.analyzing,
  generating_packages: JOB_PROGRESS_STAGE_WEIGHTS.generating_packages,
  saving: JOB_PROGRESS_STAGE_WEIGHTS.saving,
  completed: JOB_PROGRESS_STAGE_WEIGHTS.completed,
};

export type JobProgressSnapshot = {
  state: JobState;
  progressPercent: number;
  stage: JobProgressStage | null;
  label: string;
};

const STAGE_LABELS: Record<JobProgressStage, string> = {
  validated: 'Validated',
  preparing: 'Preparing',
  uploading: 'Uploading',
  fingerprinting: 'Fingerprinting',
  analyzing: 'Analyzing',
  generating_packages: 'Generating packages',
  saving: 'Saving results',
  completed: 'Completed',
};

export function resolveProgressStage(state: JobState): JobProgressStage | null {
  switch (state) {
    case 'validated':
    case 'queued':
      return 'validated';
    case 'preparing':
      return 'preparing';
    case 'uploading':
      return 'uploading';
    case 'fingerprinting':
      return 'fingerprinting';
    case 'analyzing':
      return 'analyzing';
    case 'generating_packages':
      return 'generating_packages';
    case 'saving':
      return 'saving';
    case 'completed':
      return 'completed';
    default:
      return null;
  }
}

export function resolveProgressPercentForState(state: JobState): number {
  if (state === 'failed' || state === 'cancelled' || state === 'expired' || state === 'retry_pending') {
    return 0;
  }
  if (state === 'created') {
    return 0;
  }
  return JOB_STATE_PROGRESS_WEIGHTS[state];
}

export function buildProgressSnapshot(
  state: JobState,
  progressPercent: number,
): JobProgressSnapshot {
  const stage = resolveProgressStage(state);
  return {
    state,
    progressPercent,
    stage,
    label: stage ? STAGE_LABELS[stage] : 'In progress',
  };
}

export function isMonotonicProgress(previousPercent: number, nextPercent: number): boolean {
  return nextPercent >= previousPercent;
}

export function isProgressConsistentWithState(state: JobState, progressPercent: number): boolean {
  if (state === 'completed') {
    return progressPercent === 100;
  }
  if (state === 'failed' || state === 'cancelled' || state === 'expired') {
    return progressPercent >= 0 && progressPercent <= 100;
  }
  const floor = resolveProgressPercentForState(state);
  return progressPercent >= floor && progressPercent <= 100;
}
