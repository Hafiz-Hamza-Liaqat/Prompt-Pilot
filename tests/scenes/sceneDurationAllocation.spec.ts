import { describe, expect, it } from 'vitest';
import {
  allocateSceneDurations,
  buildSceneRoleSequence,
  buildSceneTimings,
  decomposeDurationIntoScenes,
  formatSceneBoundary,
  SCENE_ROLE_WEIGHTS,
} from '../../src/domain/sceneDecomposition.js';

describe('allocateSceneDurations', () => {
  it('allocates integers only', () => {
    const roles = buildSceneRoleSequence(6);
    const durations = allocateSceneDurations(roles, 60);
    for (const duration of durations) {
      expect(Number.isInteger(duration)).toBe(true);
    }
  });

  it('allocates at least one second per scene', () => {
    for (let total = 5; total <= 180; total += 1) {
      const roles = buildSceneRoleSequence(Math.min(12, Math.max(2, Math.round(total / 10))));
      const durations = allocateSceneDurations(roles, total);
      for (const duration of durations) {
        expect(duration).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('sums to total duration', () => {
    const roles = buildSceneRoleSequence(6);
    const durations = allocateSceneDurations(roles, 60);
    expect(durations.reduce((sum, value) => sum + value, 0)).toBe(60);
  });

  it('resolves equal remainders by scene order', () => {
    const roles = buildSceneRoleSequence(2);
    const durations = allocateSceneDurations(roles, 5);
    expect(durations).toEqual([3, 2]);
  });

  it('keeps approved role weights positive', () => {
    for (const weight of Object.values(SCENE_ROLE_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0);
    }
  });
});

describe('buildSceneTimings and boundaries', () => {
  it('starts first scene at zero', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    expect(decomposition.scenes[0]?.startSecond).toBe(0);
  });

  it('ends last scene at total duration', () => {
    const decomposition = decomposeDurationIntoScenes(90);
    const lastScene = decomposition.scenes[decomposition.scenes.length - 1];
    expect(lastScene?.endSecond).toBe(90);
  });

  it('keeps adjacent boundaries contiguous', () => {
    const decomposition = decomposeDurationIntoScenes(120);
    for (let index = 1; index < decomposition.scenes.length; index += 1) {
      expect(decomposition.scenes[index]?.startSecond).toBe(
        decomposition.scenes[index - 1]?.endSecond,
      );
    }
  });

  it('avoids overlaps', () => {
    const decomposition = decomposeDurationIntoScenes(60);
    for (let index = 1; index < decomposition.scenes.length; index += 1) {
      const previous = decomposition.scenes[index - 1]!;
      const current = decomposition.scenes[index]!;
      expect(current.startSecond).toBeGreaterThanOrEqual(previous.endSecond);
    }
  });

  it('avoids gaps', () => {
    const decomposition = decomposeDurationIntoScenes(60);
    for (let index = 1; index < decomposition.scenes.length; index += 1) {
      const previous = decomposition.scenes[index - 1]!;
      const current = decomposition.scenes[index]!;
      expect(current.startSecond).toBe(previous.endSecond);
    }
  });

  it('uses unique sequential scene ids and orders', () => {
    const decomposition = decomposeDurationIntoScenes(45);
    const ids = decomposition.scenes.map((scene) => scene.id);
    const orders = decomposition.scenes.map((scene) => scene.order);
    expect(new Set(ids).size).toBe(ids.length);
    expect(orders).toEqual(Array.from({ length: orders.length }, (_, index) => index + 1));
  });
});

describe('formatSceneBoundary', () => {
  it('formats values below 60 seconds', () => {
    expect(formatSceneBoundary(0)).toBe('0s');
    expect(formatSceneBoundary(45)).toBe('45s');
  });

  it('formats minute values', () => {
    expect(formatSceneBoundary(60)).toBe('1m');
    expect(formatSceneBoundary(90)).toBe('1m 30s');
  });

  it('formats 180 seconds', () => {
    expect(formatSceneBoundary(180)).toBe('3m');
  });
});

describe('decomposeDurationIntoScenes determinism', () => {
  it('returns identical output on repeated calls', () => {
    const first = decomposeDurationIntoScenes(60);
    const second = decomposeDurationIntoScenes(60);
    expect(first).toEqual(second);
  });

  it('labels repeated development scenes with ordinals', () => {
    const decomposition = decomposeDurationIntoScenes(70);
    const developmentLabels = decomposition.scenes
      .filter((scene) => scene.role === 'development')
      .map((scene) => scene.label);
    expect(developmentLabels).toContain('Message development 1');
    expect(developmentLabels).toContain('Message development 2');
  });
});

describe('buildSceneTimings direct allocation', () => {
  it('derives duration from end minus start', () => {
    const roles = buildSceneRoleSequence(4);
    const durations = allocateSceneDurations(roles, 20);
    const scenes = buildSceneTimings(roles, durations, 20);
    for (const scene of scenes) {
      expect(scene.durationSeconds).toBe(scene.endSecond - scene.startSecond);
    }
  });
});
