import { describe, expect, it } from 'vitest';
import {
  buildSceneRoleSequence,
  calculateSceneCount,
  SCENE_ROLE_LABELS,
} from '../../src/domain/sceneDecomposition.js';

describe('calculateSceneCount', () => {
  it('produces two scenes for five seconds', () => {
    expect(calculateSceneCount(5)).toBe(2);
  });

  it('produces two scenes for ten seconds', () => {
    expect(calculateSceneCount(10)).toBe(2);
  });

  it('produces two scenes for twenty seconds', () => {
    expect(calculateSceneCount(20)).toBe(2);
  });

  it('produces three scenes for thirty seconds', () => {
    expect(calculateSceneCount(30)).toBe(3);
  });

  it('produces six scenes for sixty seconds', () => {
    expect(calculateSceneCount(60)).toBe(6);
  });

  it('produces nine scenes for ninety seconds', () => {
    expect(calculateSceneCount(90)).toBe(9);
  });

  it('produces twelve scenes for one-hundred-twenty seconds', () => {
    expect(calculateSceneCount(120)).toBe(12);
  });

  it('produces twelve scenes for one-hundred-eighty seconds', () => {
    expect(calculateSceneCount(180)).toBe(12);
  });

  it('never falls below two scenes', () => {
    for (let duration = 5; duration <= 180; duration += 1) {
      expect(calculateSceneCount(duration)).toBeGreaterThanOrEqual(2);
    }
  });

  it('never exceeds twelve scenes', () => {
    for (let duration = 5; duration <= 180; duration += 1) {
      expect(calculateSceneCount(duration)).toBeLessThanOrEqual(12);
    }
  });

  it('never exceeds total seconds', () => {
    for (let duration = 5; duration <= 180; duration += 1) {
      expect(calculateSceneCount(duration)).toBeLessThanOrEqual(duration);
    }
  });
});

describe('buildSceneRoleSequence', () => {
  it('uses opening hook and closing direction for two scenes', () => {
    expect(buildSceneRoleSequence(2)).toEqual(['opening_hook', 'closing_direction']);
  });

  it('uses opening hook, core message, and closing direction for three scenes', () => {
    expect(buildSceneRoleSequence(3)).toEqual([
      'opening_hook',
      'core_message',
      'closing_direction',
    ]);
  });

  it('uses four-scene pattern for four scenes', () => {
    expect(buildSceneRoleSequence(4)).toEqual([
      'opening_hook',
      'context_setup',
      'core_message',
      'closing_direction',
    ]);
  });

  it('omits repeated development for five scenes', () => {
    expect(buildSceneRoleSequence(5)).toEqual([
      'opening_hook',
      'context_setup',
      'core_message',
      'proof_or_demonstration',
      'closing_direction',
    ]);
  });

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
    'starts with opening hook for %i scenes',
    (count) => {
      expect(buildSceneRoleSequence(count)[0]).toBe('opening_hook');
    },
  );

  it.each([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
    'ends with closing direction for %i scenes',
    (count) => {
      const sequence = buildSceneRoleSequence(count);
      expect(sequence[sequence.length - 1]).toBe('closing_direction');
    },
  );

  it('includes core message exactly once for counts 3 through 12', () => {
    for (let count = 3; count <= 12; count += 1) {
      const sequence = buildSceneRoleSequence(count);
      expect(sequence.filter((role) => role === 'core_message')).toHaveLength(1);
    }
  });

  it('includes proof or demonstration no more than once', () => {
    for (let count = 2; count <= 12; count += 1) {
      const sequence = buildSceneRoleSequence(count);
      expect(sequence.filter((role) => role === 'proof_or_demonstration').length).toBeLessThanOrEqual(
        1,
      );
    }
  });

  it('repeats development roles deterministically for larger counts', () => {
    expect(buildSceneRoleSequence(7).filter((role) => role === 'development')).toHaveLength(2);
    expect(buildSceneRoleSequence(8).filter((role) => role === 'development')).toHaveLength(3);
  });

  it('matches requested count length for every count from 2 through 12', () => {
    for (let count = 2; count <= 12; count += 1) {
      expect(buildSceneRoleSequence(count)).toHaveLength(count);
    }
  });

  it('maps approved role labels', () => {
    expect(SCENE_ROLE_LABELS.opening_hook).toBe('Opening hook');
    expect(SCENE_ROLE_LABELS.proof_or_demonstration).toBe('Proof or demonstration');
  });
});
