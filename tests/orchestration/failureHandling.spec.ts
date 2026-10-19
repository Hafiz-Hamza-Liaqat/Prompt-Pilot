import { describe, expect, it } from 'vitest';
import {
  buildDependencyGraph,
  buildTimeoutFailure,
  classifyStageFailure,
  evaluateStageTimeout,
  resolveStageTimeoutMs,
} from '../../src/domain/orchestration/index.js';

describe('failure and timeout contracts', () => {
  it('classifies retryable failures toward retry_pending', () => {
    const failure = buildTimeoutFailure('core_analysis', '2026-07-06T12:00:00.000Z');
    expect(classifyStageFailure(failure, true)).toBe('retry_pending');
    expect(classifyStageFailure(failure, false)).toBe('failed');
  });

  it('evaluates stage timeout deadlines', () => {
    const startedAt = '2026-07-06T12:00:00.000Z';
    const withinBudget = evaluateStageTimeout('core_analysis', startedAt, '2026-07-06T12:05:00.000Z');
    expect(withinBudget?.exceeded).toBe(false);

    const exceeded = evaluateStageTimeout('core_analysis', startedAt, '2026-07-06T12:15:00.000Z');
    expect(exceeded?.exceeded).toBe(true);
  });

  it('resolves configured timeout budgets', () => {
    expect(resolveStageTimeoutMs('persistence')).toBe(120_000);
    expect(resolveStageTimeoutMs('validation')).toBeNull();
  });

  it('builds a dependency graph for all pipeline stages', () => {
    const graph = buildDependencyGraph();
    expect(graph.core_analysis).toContain('cache_lookup');
    expect(graph.package_generation).toContain('core_analysis');
  });
});
