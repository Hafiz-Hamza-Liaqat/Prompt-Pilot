import { describe, expect, it } from 'vitest';
import type { JobRecord } from '../../src/domain/canonical/job.js';
import {
  DEFAULT_JOB_RETRY_POLICY,
  evaluateRetry,
  isRetryableFailure,
  resolveRetryBackoffMs,
} from '../../src/domain/job/retry.js';

const TIMESTAMP = '2026-07-05T12:00:00.000Z';

function failedJob(retryable: boolean): JobRecord {
  return {
    jobId: 'job-001',
    projectId: 'project-001',
    referenceId: 'reference-001',
    state: 'failed',
    progressPercent: 40,
    failure: {
      code: 'timeout',
      category: 'infrastructure',
      message: 'Worker timed out',
      retryable,
      occurredAt: TIMESTAMP,
    },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

describe('job retry model', () => {
  it('allows retry for retryable infrastructure failures within max attempts', () => {
    const decision = evaluateRetry(failedJob(true), 1);
    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.nextAttempt.attemptNumber).toBe(2);
    }
  });

  it('rejects retry when failure is not retryable', () => {
    const decision = evaluateRetry(failedJob(false), 1);
    expect(decision).toEqual({ allowed: false, reason: 'not_retryable' });
  });

  it('rejects retry when max attempts exceeded', () => {
    const decision = evaluateRetry(failedJob(true), DEFAULT_JOB_RETRY_POLICY.maxAttempts);
    expect(decision).toEqual({ allowed: false, reason: 'max_attempts_exceeded' });
  });

  it('allows retry_pending jobs to re-enter queue', () => {
    const job: JobRecord = {
      ...failedJob(true),
      state: 'retry_pending',
    };
    const decision = evaluateRetry(job, 1);
    expect(decision.allowed).toBe(true);
  });

  it('rejects retry for cancelled jobs', () => {
    const job: JobRecord = {
      jobId: 'job-001',
      projectId: 'project-001',
      referenceId: 'reference-001',
      state: 'cancelled',
      progressPercent: 20,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
      completedAt: TIMESTAMP,
    };
    expect(evaluateRetry(job, 1)).toEqual({ allowed: false, reason: 'cancelled' });
  });

  it('classifies retryable failures via policy', () => {
    expect(
      isRetryableFailure({
        code: 'cache_corrupt',
        category: 'cache',
        message: 'Cache entry invalid',
        retryable: true,
        occurredAt: TIMESTAMP,
      }),
    ).toBe(true);
  });

  it('resolves backoff schedule by attempt number', () => {
    expect(resolveRetryBackoffMs(1)).toBe(1_000);
    expect(resolveRetryBackoffMs(3)).toBe(15_000);
    expect(resolveRetryBackoffMs(99)).toBe(15_000);
  });
});
