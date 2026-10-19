import { describe, expect, it, expectTypeOf } from 'vitest';
import type { JobState } from '../../src/domain/canonical/constants.js';
import type { JobRecord } from '../../src/domain/canonical/job.js';
import {
  validateJobTransition,
  createInitialJobRecord,
} from '../../src/domain/job/lifecycle-engine.js';
import type { ValidNextJobState } from '../../src/domain/job/state-machine.js';

const TIMESTAMP = '2026-07-05T12:00:00.000Z';

function baseJob(state: JobState, progressPercent = 0): JobRecord {
  return {
    jobId: 'job-001',
    projectId: 'project-001',
    referenceId: 'reference-001',
    state,
    progressPercent,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

describe('job lifecycle engine', () => {
  it('creates jobs in created state at 0% progress', () => {
    const job = createInitialJobRecord({
      jobId: 'job-001',
      projectId: 'project-001',
      referenceId: 'reference-001',
      createdAt: TIMESTAMP,
    });
    expect(job.state).toBe('created');
    expect(job.progressPercent).toBe(0);
  });

  it('accepts valid happy-path transitions with monotonic progress', () => {
    let job = baseJob('created', 0);
    const steps = [
      { nextState: 'validated' as const, progressPercent: 5 },
      { nextState: 'queued' as const, progressPercent: 5 },
      { nextState: 'preparing' as const, progressPercent: 10 },
    ];

    for (const step of steps) {
      const result = validateJobTransition(job, {
        ...step,
        occurredAt: TIMESTAMP,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        job = result.data.job;
      }
    }
  });

  it('rejects invalid transitions at compile-time guarded boundaries', () => {
    const result = validateJobTransition(baseJob('completed', 100), {
      nextState: 'saving',
      progressPercent: 95,
      occurredAt: TIMESTAMP,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('terminal_state');
    }
  });

  it('requires failure payload for failed transitions', () => {
    const result = validateJobTransition(baseJob('analyzing', 55), {
      nextState: 'failed',
      progressPercent: 55,
      occurredAt: TIMESTAMP,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('missing_failure');
    }
  });

  it('rejects progress regression', () => {
    const result = validateJobTransition(baseJob('analyzing', 55), {
      nextState: 'generating_packages',
      progressPercent: 50,
      occurredAt: TIMESTAMP,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('progress_regression');
    }
  });
});

describe('compile-time transition typing', () => {
  it('narrows valid next states per current state', () => {
    expectTypeOf<'validated' | 'failed'>().toEqualTypeOf<ValidNextJobState<'created'>>();
    type CreatedNext = ValidNextJobState<'created'>;
    const allowed: CreatedNext[] = ['validated', 'failed'];
    expect(allowed).toHaveLength(2);
  });
});
