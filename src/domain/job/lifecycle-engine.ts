import type { JobState } from '../canonical/constants.js';
import { JOB_TERMINAL_STATES } from '../canonical/constants.js';
import type { JobRecord } from '../canonical/job.js';
import {
  buildCancellationTransition,
  canCancelJob,
  isJobCancellableState,
} from './cancellation.js';
import type {
  Job,
  JobLifecycleResult,
  JobRegistration,
  JobTransitionRequest,
  JobTransitionResult,
} from './models.js';
import { jobLifecycleErr, jobLifecycleOk } from './models.js';
import {
  isMonotonicProgress,
  isProgressConsistentWithState,
  resolveProgressPercentForState,
} from './progress.js';
import { evaluateRetry, type RetryDecision, type RetryPolicy } from './retry.js';
import { isValidJobTransition } from './state-machine.js';

function isTerminalState(state: JobState): boolean {
  return (JOB_TERMINAL_STATES as readonly JobState[]).includes(state);
}

function requiresFailure(state: JobState): boolean {
  return state === 'failed' || state === 'retry_pending';
}

function forbidsFailure(state: JobState): boolean {
  return state === 'completed' || state === 'cancelled' || state === 'expired';
}

export function createInitialJobRecord(registration: JobRegistration): JobRecord {
  const timestamp = registration.createdAt;
  return {
    jobId: registration.jobId,
    projectId: registration.projectId,
    referenceId: registration.referenceId,
    state: 'created',
    progressPercent: 0,
    retryOfJobId: registration.retryOfJobId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function validateJobTransition(
  job: Job,
  request: JobTransitionRequest,
): JobLifecycleResult<JobTransitionResult> {
  const fromState = job.state;
  const toState = request.nextState;

  if (isTerminalState(fromState) && fromState !== 'failed') {
    return jobLifecycleErr('terminal_state', `Job in terminal state "${fromState}" cannot transition`, {
      fromState,
      toState,
    });
  }

  if (fromState === 'failed' && toState !== 'retry_pending') {
    return jobLifecycleErr('invalid_transition', 'Failed jobs may only transition to retry_pending', {
      fromState,
      toState,
    });
  }

  if (!isValidJobTransition(fromState, toState)) {
    return jobLifecycleErr('invalid_transition', `Transition ${fromState} → ${toState} is not allowed`, {
      fromState,
      toState,
    });
  }

  if (requiresFailure(toState) && !request.failure) {
    return jobLifecycleErr('missing_failure', `State "${toState}" requires a failure record`, {
      fromState,
      toState,
    });
  }

  if (forbidsFailure(toState) && request.failure) {
    return jobLifecycleErr('unexpected_failure', `State "${toState}" must not include a failure record`, {
      fromState,
      toState,
    });
  }

  if (!isMonotonicProgress(job.progressPercent, request.progressPercent)) {
    return jobLifecycleErr('progress_regression', 'Progress percent cannot decrease', {
      fromState,
      toState,
    });
  }

  if (!isProgressConsistentWithState(toState, request.progressPercent)) {
    const floor = resolveProgressPercentForState(toState);
    return jobLifecycleErr(
      'progress_mismatch',
      `Progress ${request.progressPercent}% is inconsistent with state "${toState}" (minimum ${floor}%)`,
      { fromState, toState },
    );
  }

  return jobLifecycleOk({
    previousState: fromState,
    nextState: toState,
    job: applyJobTransition(job, request),
  });
}

export function applyJobTransition(job: Job, request: JobTransitionRequest): JobRecord {
  return {
    ...job,
    state: request.nextState,
    progressPercent: request.progressPercent,
    failure: request.failure,
    cacheHit: request.cacheHit ?? job.cacheHit,
    updatedAt: request.occurredAt,
    completedAt:
      request.nextState === 'completed' ||
      request.nextState === 'cancelled' ||
      request.nextState === 'expired'
        ? (request.completedAt ?? request.occurredAt)
        : job.completedAt,
  };
}

export function cancelJob(
  job: Job,
  requestedAt: string,
): JobLifecycleResult<JobRecord> {
  if (!canCancelJob(job)) {
    return jobLifecycleErr('not_cancellable', `Job in state "${job.state}" cannot be cancelled`, {
      fromState: job.state,
      toState: 'cancelled',
    });
  }

  if (!isJobCancellableState(job.state)) {
    return jobLifecycleErr('not_cancellable', `Job in state "${job.state}" cannot be cancelled`, {
      fromState: job.state,
      toState: 'cancelled',
    });
  }

  return jobLifecycleOk(
    buildCancellationTransition(job, {
      requestedAt,
    }),
  );
}

export function evaluateJobRetry(
  job: Job,
  attemptNumber: number,
  policy?: RetryPolicy,
): RetryDecision {
  return evaluateRetry(job, attemptNumber, policy);
}

export type JobLifecycleEngine = {
  createInitialJob: typeof createInitialJobRecord;
  validateTransition: typeof validateJobTransition;
  applyTransition: typeof applyJobTransition;
  cancel: typeof cancelJob;
  evaluateRetry: typeof evaluateJobRetry;
};

export const jobLifecycleEngine: JobLifecycleEngine = {
  createInitialJob: createInitialJobRecord,
  validateTransition: validateJobTransition,
  applyTransition: applyJobTransition,
  cancel: cancelJob,
  evaluateRetry: evaluateJobRetry,
};
