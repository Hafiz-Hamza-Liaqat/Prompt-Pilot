import type { JobState } from '@/domain/canonical/constants';
import type { JobFailure } from '@/domain/canonical/job';
import type { EntityId } from '@/domain/canonical/primitives';
import { buildProgressSnapshot } from '@/domain/job/progress';

export type JobStatusViewModel = {
  jobId: EntityId;
  referenceId: EntityId;
  state: JobState;
  progressPercent: number;
  progressLabel: string;
  failure: JobFailure | null;
  cacheHit: boolean | null;
  completedAt: string | null;
  updatedAt: string;
};

export type JobStatusPresentationState = 'idle' | 'running' | 'completed' | 'failed';

export type SessionJobStatusHint = {
  jobId: EntityId;
  referenceId: EntityId;
  state: JobState;
  failure?: JobFailure;
  message?: string;
};

const RUNNING_JOB_STATES = new Set<JobState>([
  'created',
  'validated',
  'queued',
  'preparing',
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
  'saving',
]);

const FAILED_JOB_STATES = new Set<JobState>(['failed', 'retry_pending']);

export function isPollableJobState(state: JobState): boolean {
  return RUNNING_JOB_STATES.has(state);
}

export function shouldContinueJobStatusPolling(activeJob: JobStatusViewModel | null): boolean {
  return activeJob !== null && isPollableJobState(activeJob.state);
}

export function mapJobRecordToStatusViewModel(job: {
  jobId: EntityId;
  referenceId: EntityId;
  state: JobState;
  progressPercent: number;
  failure?: JobFailure;
  cacheHit?: boolean;
  completedAt?: string;
  updatedAt: string;
}): JobStatusViewModel {
  const progress = buildProgressSnapshot(job.state, job.progressPercent);

  return {
    jobId: job.jobId,
    referenceId: job.referenceId,
    state: job.state,
    progressPercent: job.progressPercent,
    progressLabel: progress.label,
    failure: job.failure ?? null,
    cacheHit: job.cacheHit ?? null,
    completedAt: job.completedAt ?? null,
    updatedAt: job.updatedAt,
  };
}

export function resolveJobStatusPresentationState(
  activeJob: JobStatusViewModel | null,
  sessionHint: SessionJobStatusHint | null,
): JobStatusPresentationState {
  const displayed = resolveDisplayedJobStatus(activeJob, sessionHint);
  if (displayed === null) {
    return 'idle';
  }

  if (FAILED_JOB_STATES.has(displayed.state)) {
    return 'failed';
  }

  if (displayed.state === 'completed') {
    return 'completed';
  }

  if (RUNNING_JOB_STATES.has(displayed.state)) {
    return 'running';
  }

  return 'idle';
}

export function resolveDisplayedJobStatus(
  activeJob: JobStatusViewModel | null,
  sessionHint: SessionJobStatusHint | null,
): JobStatusViewModel | null {
  if (activeJob !== null) {
    return activeJob;
  }

  if (sessionHint === null) {
    return null;
  }

  const progressPercent = sessionHint.state === 'completed' ? 100 : 0;
  const progress = buildProgressSnapshot(sessionHint.state, progressPercent);

  return {
    jobId: sessionHint.jobId,
    referenceId: sessionHint.referenceId,
    state: sessionHint.state,
    progressPercent,
    progressLabel: progress.label,
    failure: sessionHint.failure ?? null,
    cacheHit: null,
    completedAt: sessionHint.state === 'completed' ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };
}

export function mapStartAnalysisFormToSessionHint(input: {
  status: string;
  jobId?: EntityId;
  referenceId?: EntityId;
  terminalState?: JobState;
  failure?: JobFailure;
  message?: string;
}): SessionJobStatusHint | null {
  if (!input.jobId || !input.referenceId) {
    return null;
  }

  if (input.status === 'success' && input.terminalState) {
    return {
      jobId: input.jobId,
      referenceId: input.referenceId,
      state: input.terminalState,
      message: input.message,
    };
  }

  if (input.status === 'conflict') {
    return {
      jobId: input.jobId,
      referenceId: input.referenceId,
      state: 'failed',
      message: input.message,
    };
  }

  if (input.status === 'error') {
    return {
      jobId: input.jobId,
      referenceId: input.referenceId,
      state: input.terminalState ?? 'failed',
      failure: input.failure,
      message: input.message,
    };
  }

  return null;
}
