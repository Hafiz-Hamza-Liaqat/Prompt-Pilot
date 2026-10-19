import { describe, expect, it } from 'vitest';
import type { JobRecord } from '../../src/domain/canonical/job.js';
import {
  buildTransitionPlan,
  buildFailureTransition,
  resolveTargetStateForStage,
} from '../../src/server/orchestration/pipeline-coordinator.js';

const TIMESTAMP = '2026-07-06T12:00:00.000Z';

function job(state: JobRecord['state'], progressPercent: number): JobRecord {
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

describe('pipeline coordinator', () => {
  it('plans validation transition from created to validated', () => {
    const plan = buildTransitionPlan(
      job('created', 0),
      'validation',
      {
        stageId: 'validation',
        jobId: 'job-001',
        completedAt: TIMESTAMP,
        outcome: 'success',
      },
      TIMESTAMP,
    );
    expect(plan?.targetState).toBe('validated');
    expect(plan?.transitions.map((step) => step.nextState)).toEqual(['validated']);
  });

  it('plans multi-hop path for youtube_url fingerprint stage', () => {
    const plan = buildTransitionPlan(
      job('validated', 5),
      'fingerprint',
      {
        stageId: 'fingerprint',
        jobId: 'job-001',
        completedAt: TIMESTAMP,
        outcome: 'success',
      },
      TIMESTAMP,
    );
    expect(plan?.transitions.at(-1)?.nextState).toBe('fingerprinting');
    expect(plan!.transitions.length).toBeGreaterThan(1);
  });

  it('short-circuits to generating_packages on cache hit', () => {
    const target = resolveTargetStateForStage('cache_lookup', {
      stageId: 'cache_lookup',
      jobId: 'job-001',
      completedAt: TIMESTAMP,
      outcome: 'success',
      cacheHit: true,
    });
    expect(target).toBe('generating_packages');
  });

  it('plans failure propagation to retry_pending', () => {
    const failure = {
      code: 'timeout' as const,
      category: 'infrastructure' as const,
      message: 'Timed out',
      retryable: true,
      occurredAt: TIMESTAMP,
    };
    const plan = buildFailureTransition(job('analyzing', 55), failure, 'retry_pending', TIMESTAMP);
    expect(plan?.targetState).toBe('retry_pending');
    expect(plan?.transitions.at(-1)?.failure).toEqual(failure);
  });
});
