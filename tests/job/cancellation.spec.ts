import { describe, expect, it } from 'vitest';
import type { JobRecord } from '../../src/domain/canonical/job.js';
import {
  JOB_CANCELLABLE_STATES,
  canCancelJob,
  isJobCancellableState,
} from '../../src/domain/job/cancellation.js';
import { cancelJob } from '../../src/domain/job/lifecycle-engine.js';

const TIMESTAMP = '2026-07-05T12:00:00.000Z';

function jobInState(state: JobRecord['state']): JobRecord {
  return {
    jobId: 'job-001',
    projectId: 'project-001',
    referenceId: 'reference-001',
    state,
    progressPercent: 20,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  };
}

describe('job cancellation model', () => {
  it('matches PP-02 cancellable states', () => {
    expect(JOB_CANCELLABLE_STATES).toEqual([
      'queued',
      'preparing',
      'uploading',
      'fingerprinting',
      'analyzing',
      'generating_packages',
    ]);
  });

  it('allows cancellation from queued jobs', () => {
    expect(canCancelJob(jobInState('queued'))).toBe(true);
    expect(isJobCancellableState('queued')).toBe(true);
  });

  it('rejects cancellation from created and saving states', () => {
    expect(canCancelJob(jobInState('created'))).toBe(false);
    expect(canCancelJob(jobInState('saving'))).toBe(false);
  });

  it('transitions cancelled jobs to terminal cancelled state', () => {
    const result = cancelJob(jobInState('analyzing'), TIMESTAMP);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.state).toBe('cancelled');
      expect(result.data.completedAt).toBe(TIMESTAMP);
      expect(result.data.failure).toBeUndefined();
    }
  });
});
