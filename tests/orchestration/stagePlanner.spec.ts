import { describe, expect, it } from 'vitest';
import {
  buildExecutionPlan,
  applyCacheShortCircuit,
  getNextPendingStage,
  markStageCompleted,
  isPlanTerminal,
  stagePlanner,
} from '../../src/domain/orchestration/index.js';

const BASE = {
  planId: 'plan-001',
  jobId: 'job-001',
  referenceId: 'reference-001',
};

describe('stage planner', () => {
  it('includes media_intake for upload reference kinds', () => {
    const plan = buildExecutionPlan({ ...BASE, referenceKind: 'video_upload' });
    expect(plan.stages.map((stage) => stage.stageId)).toContain('media_intake');
  });

  it('omits media_intake for youtube_url references', () => {
    const plan = buildExecutionPlan({ ...BASE, referenceKind: 'youtube_url' });
    expect(plan.stages.map((stage) => stage.stageId)).not.toContain('media_intake');
  });

  it('includes link_intelligence for youtube_url references', () => {
    const plan = buildExecutionPlan({ ...BASE, referenceKind: 'youtube_url' });
    const stageIds = plan.stages.map((stage) => stage.stageId);
    expect(stageIds).toContain('link_intelligence');
    expect(stageIds.indexOf('link_intelligence')).toBeLessThan(stageIds.indexOf('fingerprint'));
  });

  it('omits link_intelligence for upload references', () => {
    const plan = buildExecutionPlan({ ...BASE, referenceKind: 'video_upload' });
    expect(plan.stages.map((stage) => stage.stageId)).not.toContain('link_intelligence');
  });

  it('orders stages respecting dependencies', () => {
    const plan = buildExecutionPlan({ ...BASE, referenceKind: 'transcript' });
    const ids = plan.stages.map((stage) => stage.stageId);
    expect(ids.indexOf('validation')).toBeLessThan(ids.indexOf('fingerprint'));
    expect(ids.indexOf('cache_lookup')).toBeLessThan(ids.indexOf('core_analysis'));
  });

  it('exposes planner via stagePlanner facade', () => {
    const stages = stagePlanner.resolveStagesForReferenceKind('script');
    expect(stages[0]?.stageId).toBe('validation');
  });
});

describe('execution plan progression', () => {
  it('tracks completed and skipped stages', () => {
    let plan = buildExecutionPlan({ ...BASE, referenceKind: 'youtube_url' });
    plan = markStageCompleted(plan, {
      stageId: 'validation',
      jobId: BASE.jobId,
      completedAt: '2026-07-06T12:00:00.000Z',
      outcome: 'success',
    });
    expect(getNextPendingStage(plan)?.stageId).toBe('ownership');
    plan = applyCacheShortCircuit(plan);
    expect(plan.skippedStageIds).toContain('core_analysis');
  });

  it('detects terminal plans', () => {
    let plan = buildExecutionPlan({ ...BASE, referenceKind: 'youtube_url' });
    for (const stageId of plan.stages.map((stage) => stage.stageId)) {
      plan = markStageCompleted(plan, {
        stageId,
        jobId: BASE.jobId,
        completedAt: '2026-07-06T12:00:00.000Z',
        outcome: 'success',
      });
    }
    expect(isPlanTerminal(plan)).toBe(true);
    expect(getNextPendingStage(plan)).toBeNull();
  });
});
