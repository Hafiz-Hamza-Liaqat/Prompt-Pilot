import { describe, expect, it } from 'vitest';
import type { JobRecord } from '../../src/domain/canonical/job.js';
import { createDefaultJobLifecycleService } from '../../src/server/job/index.js';
import { createDefaultJobOrchestrator } from '../../src/server/orchestration/index.js';

const TIMESTAMP = '2026-07-06T12:00:00.000Z';
const OWNER = 'owner-001';
const PROJECT = 'project-001';
const REFERENCE = 'reference-001';
const JOB = 'job-001';

describe('DefaultJobOrchestrator', () => {
  it('starts orchestration with an execution plan', () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'youtube_url',
      occurredAt: TIMESTAMP,
    });

    expect(started.ok).toBe(true);
    if (started.ok) {
      expect(started.data.context.job.state).toBe('created');
      expect(started.data.context.currentStageId).toBe('validation');
      expect(started.data.context.plan.stages.map((stage) => stage.stageId)).not.toContain('media_intake');
    }
  });

  it('advances stages and applies lifecycle transitions', () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'youtube_url',
      occurredAt: TIMESTAMP,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    const afterValidation = orchestrator.completeStage(started.data.context, {
      stageId: 'validation',
      jobId: JOB,
      completedAt: TIMESTAMP,
      outcome: 'success',
    });
    expect(afterValidation.ok).toBe(true);
    if (afterValidation.ok) {
      expect(afterValidation.data.context.job.state).toBe('validated');
    }
  });

  it('propagates stage failures to retry_pending when retryable', () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'youtube_url',
      occurredAt: TIMESTAMP,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    let context = started.data.context;
    for (const stageId of ['validation', 'ownership']) {
      const step = orchestrator.completeStage(context, {
        stageId: stageId as 'validation',
        jobId: JOB,
        completedAt: TIMESTAMP,
        outcome: 'success',
      });
      expect(step.ok).toBe(true);
      if (step.ok) {
        context = step.data.context;
      }
    }

    const failure = orchestrator.propagateFailure({
      context,
      stageId: 'fingerprint',
      occurredAt: TIMESTAMP,
      failure: {
        code: 'timeout',
        category: 'infrastructure',
        message: 'Worker timed out',
        retryable: true,
        occurredAt: TIMESTAMP,
      },
    });

    expect(failure.ok).toBe(true);
    if (failure.ok) {
      expect(failure.data.context.job.state).toBe('retry_pending');
    }
  });

  it('cancels jobs in cancellable states', () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      occurredAt: TIMESTAMP,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    let context = started.data.context;
    for (const stageId of ['validation', 'ownership']) {
      const step = orchestrator.completeStage(context, {
        stageId: stageId as 'validation',
        jobId: JOB,
        completedAt: TIMESTAMP,
        outcome: 'success',
      });
      if (step.ok) {
        context = step.data.context;
      }
    }

    const cancelled = orchestrator.cancel({
      context,
      requestedAt: TIMESTAMP,
      reason: 'User aborted',
    });

    expect(cancelled.ok).toBe(true);
    if (cancelled.ok) {
      expect(cancelled.data.context.job.state).toBe('cancelled');
    }
  });

  it('applies cache short-circuit skipping core_analysis', () => {
    const orchestrator = createDefaultJobOrchestrator({
      lifecycle: createDefaultJobLifecycleService(),
    });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'youtube_url',
      occurredAt: TIMESTAMP,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    const stagesBeforeCache = ['validation', 'ownership', 'link_intelligence', 'fingerprint'];
    let context = started.data.context;
    for (const stageId of stagesBeforeCache) {
      const step = orchestrator.completeStage(context, {
        stageId: stageId as 'validation',
        jobId: JOB,
        completedAt: TIMESTAMP,
        outcome: 'success',
      });
      expect(step.ok).toBe(true);
      if (step.ok) {
        context = step.data.context;
      }
    }

    const cacheHit = orchestrator.completeStage(context, {
      stageId: 'cache_lookup',
      jobId: JOB,
      completedAt: TIMESTAMP,
      outcome: 'success',
      cacheHit: true,
    });

    expect(cacheHit.ok).toBe(true);
    if (cacheHit.ok) {
      expect(cacheHit.data.context.plan.skippedStageIds).toContain('core_analysis');
      expect(cacheHit.data.context.job.state).toBe('generating_packages');
      expect(orchestrator.getNextStage(cacheHit.data.context)).toBe('package_generation');
    }
  });

  it('applyJobTransitions advances job state without completing a stage', () => {
    const lifecycle = createDefaultJobLifecycleService();
    const orchestrator = createDefaultJobOrchestrator({ lifecycle });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      occurredAt: TIMESTAMP,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    let context = started.data.context;
    for (const stageId of ['validation', 'ownership'] as const) {
      const step = orchestrator.completeStage(context, {
        stageId,
        jobId: JOB,
        completedAt: TIMESTAMP,
        outcome: 'success',
      });
      expect(step.ok).toBe(true);
      if (step.ok) {
        context = step.data.context;
      }
    }

    const applied = orchestrator.applyJobTransitions(context, [
      { nextState: 'preparing', progressPercent: 10, occurredAt: TIMESTAMP },
      { nextState: 'uploading', progressPercent: 15, occurredAt: TIMESTAMP },
    ]);

    expect(applied.ok).toBe(true);
    if (applied.ok) {
      expect(applied.data.context.job.state).toBe('uploading');
      expect(applied.data.context.job.progressPercent).toBe(15);
    }
  });

  it('refineJobProgress updates progress within the current state', () => {
    const lifecycle = createDefaultJobLifecycleService();
    const orchestrator = createDefaultJobOrchestrator({ lifecycle });

    const started = orchestrator.start({
      jobId: JOB,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      occurredAt: TIMESTAMP,
    });
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    let context = started.data.context;
    for (const stageId of ['validation', 'ownership'] as const) {
      const step = orchestrator.completeStage(context, {
        stageId,
        jobId: JOB,
        completedAt: TIMESTAMP,
        outcome: 'success',
      });
      expect(step.ok).toBe(true);
      if (step.ok) {
        context = step.data.context;
      }
    }

    const preparing = orchestrator.applyJobTransitions(context, [
      { nextState: 'preparing', progressPercent: 10, occurredAt: TIMESTAMP },
    ]);
    expect(preparing.ok).toBe(true);
    if (!preparing.ok) {
      return;
    }

    const refined = orchestrator.refineJobProgress(preparing.data.context, {
      progressPercent: 12,
      occurredAt: TIMESTAMP,
    });

    expect(refined.ok).toBe(true);
    if (refined.ok) {
      expect(refined.data.context.job.state).toBe('preparing');
      expect(refined.data.context.job.progressPercent).toBe(12);
    }
  });
});

describe('orchestrator compile-time contracts', () => {
  it('preserves JobRecord shape through orchestration context', () => {
    const sample: JobRecord = {
      jobId: JOB,
      projectId: PROJECT,
      referenceId: REFERENCE,
      state: 'created',
      progressPercent: 0,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };
    expect(sample.jobId).toBe(JOB);
  });
});
