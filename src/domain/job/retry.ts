import type { JobFailureCategory } from '../canonical/constants.js';
import type { JobFailure, JobRecord } from '../canonical/job.js';
import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';

/** Default retry policy — operational tuning deferred to orchestrator phase. */
export const DEFAULT_JOB_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoffScheduleMs: [1_000, 5_000, 15_000],
  retryableCategories: ['processing', 'infrastructure', 'cache'],
  retryableFailureCodes: [
    'timeout',
    'worker_unavailable',
    'storage_error',
    'transcription_failed',
    'analysis_failed',
    'package_generation_failed',
    'cache_corrupt',
  ],
};

export type RetryPolicy = {
  maxAttempts: number;
  backoffScheduleMs: readonly number[];
  retryableCategories: readonly JobFailureCategory[];
  retryableFailureCodes: readonly JobFailure['code'][];
};

export type RetryAttemptContext = {
  priorJobId: EntityId;
  attemptNumber: number;
  scheduledAt: IsoDateTime;
};

export type RetryDecision =
  | { allowed: true; reason: 'retryable_failure' | 'retry_pending_state'; nextAttempt: RetryAttemptContext }
  | { allowed: false; reason: 'terminal_state' | 'not_retryable' | 'max_attempts_exceeded' | 'cancelled' | 'completed' };

export type RetryJobCreateRequest = {
  referenceId: EntityId;
  retryOfJobId: EntityId;
  attemptNumber: number;
};

export function isRetryableFailure(failure: JobFailure, policy: RetryPolicy = DEFAULT_JOB_RETRY_POLICY): boolean {
  if (!failure.retryable) {
    return false;
  }
  return (
    policy.retryableCategories.includes(failure.category) ||
    policy.retryableFailureCodes.includes(failure.code)
  );
}

export function evaluateRetry(job: JobRecord, attemptNumber: number, policy: RetryPolicy = DEFAULT_JOB_RETRY_POLICY): RetryDecision {
  if (job.state === 'completed' || job.state === 'cancelled') {
    return { allowed: false, reason: job.state };
  }

  if (job.state === 'retry_pending') {
    if (attemptNumber >= policy.maxAttempts) {
      return { allowed: false, reason: 'max_attempts_exceeded' };
    }
    return {
      allowed: true,
      reason: 'retry_pending_state',
      nextAttempt: {
        priorJobId: job.jobId,
        attemptNumber: attemptNumber + 1,
        scheduledAt: new Date().toISOString(),
      },
    };
  }

  if (job.state !== 'failed' || !job.failure) {
    return { allowed: false, reason: 'terminal_state' };
  }

  if (!isRetryableFailure(job.failure, policy)) {
    return { allowed: false, reason: 'not_retryable' };
  }

  if (attemptNumber >= policy.maxAttempts) {
    return { allowed: false, reason: 'max_attempts_exceeded' };
  }

  return {
    allowed: true,
    reason: 'retryable_failure',
    nextAttempt: {
      priorJobId: job.jobId,
      attemptNumber: attemptNumber + 1,
      scheduledAt: new Date().toISOString(),
    },
  };
}

export function resolveRetryBackoffMs(attemptNumber: number, policy: RetryPolicy = DEFAULT_JOB_RETRY_POLICY): number {
  const index = Math.max(0, Math.min(attemptNumber - 1, policy.backoffScheduleMs.length - 1));
  return policy.backoffScheduleMs[index] ?? policy.backoffScheduleMs.at(-1) ?? 0;
}
