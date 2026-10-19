import { describe, expect, it } from 'vitest';
import {
  buildProgressSnapshot,
  isMonotonicProgress,
  isProgressConsistentWithState,
  resolveProgressPercentForState,
  resolveProgressStage,
} from '../../src/domain/job/progress.js';

describe('job progress model', () => {
  it('maps pipeline states to PP-02 stage weights', () => {
    expect(resolveProgressPercentForState('validated')).toBe(5);
    expect(resolveProgressPercentForState('analyzing')).toBe(55);
    expect(resolveProgressPercentForState('completed')).toBe(100);
  });

  it('resolves progress stages for UI labels', () => {
    expect(resolveProgressStage('queued')).toBe('validated');
    expect(resolveProgressStage('generating_packages')).toBe('generating_packages');
    expect(resolveProgressStage('failed')).toBeNull();
  });

  it('builds progress snapshots without implying media rendering', () => {
    const snapshot = buildProgressSnapshot('analyzing', 55);
    expect(snapshot.label).toBe('Analyzing');
    expect(snapshot.progressPercent).toBe(55);
  });

  it('rejects progress regression', () => {
    expect(isMonotonicProgress(40, 39)).toBe(false);
    expect(isMonotonicProgress(40, 40)).toBe(true);
  });

  it('requires completed jobs to report 100%', () => {
    expect(isProgressConsistentWithState('completed', 100)).toBe(true);
    expect(isProgressConsistentWithState('completed', 95)).toBe(false);
  });

  it('enforces minimum progress floor per active state', () => {
    expect(isProgressConsistentWithState('analyzing', 54)).toBe(false);
    expect(isProgressConsistentWithState('analyzing', 55)).toBe(true);
  });
});
