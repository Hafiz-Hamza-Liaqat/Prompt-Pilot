import { describe, expect, it } from 'vitest';
import { JOB_STATES } from '../../src/domain/canonical/constants.js';
import {
  JOB_STATE_TRANSITIONS,
  getValidNextStates,
  isValidJobTransition,
} from '../../src/domain/job/state-machine.js';

describe('job state machine', () => {
  it('defines transitions for every canonical job state', () => {
    for (const state of JOB_STATES) {
      expect(JOB_STATE_TRANSITIONS[state]).toBeDefined();
    }
  });

  it('allows the PP-02 happy path', () => {
    const path = [
      ['created', 'validated'],
      ['validated', 'queued'],
      ['queued', 'preparing'],
      ['preparing', 'uploading'],
      ['uploading', 'fingerprinting'],
      ['fingerprinting', 'analyzing'],
      ['analyzing', 'generating_packages'],
      ['generating_packages', 'saving'],
      ['saving', 'completed'],
    ] as const;

    for (const [from, to] of path) {
      expect(isValidJobTransition(from, to)).toBe(true);
    }
  });

  it('allows upload skip and cache-hit shortcuts', () => {
    expect(isValidJobTransition('preparing', 'fingerprinting')).toBe(true);
    expect(isValidJobTransition('fingerprinting', 'generating_packages')).toBe(true);
  });

  it('rejects backward and terminal rewinds', () => {
    expect(isValidJobTransition('completed', 'saving')).toBe(false);
    expect(isValidJobTransition('cancelled', 'queued')).toBe(false);
    expect(isValidJobTransition('analyzing', 'preparing')).toBe(false);
  });

  it('allows failure from active pipeline states', () => {
    for (const state of [
      'created',
      'validated',
      'queued',
      'preparing',
      'uploading',
      'fingerprinting',
      'analyzing',
      'generating_packages',
      'saving',
    ] as const) {
      expect(isValidJobTransition(state, 'failed')).toBe(true);
    }
  });

  it('allows cancellation only from PP-02 cancellable states', () => {
    expect(getValidNextStates('queued')).toContain('cancelled');
    expect(getValidNextStates('generating_packages')).toContain('cancelled');
    expect(getValidNextStates('created')).not.toContain('cancelled');
    expect(getValidNextStates('saving')).not.toContain('cancelled');
  });

  it('allows retry_pending recovery path', () => {
    expect(isValidJobTransition('failed', 'retry_pending')).toBe(true);
    expect(isValidJobTransition('retry_pending', 'queued')).toBe(true);
  });
});
