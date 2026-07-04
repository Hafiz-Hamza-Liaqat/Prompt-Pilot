import { describe, expect, it } from 'vitest';
import {
  calculateSceneCount,
  decomposeDurationIntoScenes,
} from '../../src/domain/sceneDecomposition.js';

function assertDecompositionInvariants(totalDurationSeconds: number) {
  const decomposition = decomposeDurationIntoScenes(totalDurationSeconds);

  expect(decomposition.totalDurationSeconds).toBe(totalDurationSeconds);
  expect(decomposition.sceneCount).toBe(calculateSceneCount(totalDurationSeconds));
  expect(decomposition.scenes).toHaveLength(decomposition.sceneCount);
  expect(decomposition.isAiGenerated).toBe(false);
  expect(decomposition.isPersisted).toBe(false);
  expect(decomposition.algorithmVersion).toBe('duration-v1');
  expect(decomposition.origin).toBe('deterministic_rule_engine');

  const durationSum = decomposition.scenes.reduce(
    (sum, scene) => sum + scene.durationSeconds,
    0,
  );
  expect(durationSum).toBe(totalDurationSeconds);

  expect(decomposition.scenes[0]?.startSecond).toBe(0);
  expect(decomposition.scenes[decomposition.scenes.length - 1]?.endSecond).toBe(
    totalDurationSeconds,
  );

  for (const scene of decomposition.scenes) {
    expect(scene.durationSeconds).toBeGreaterThanOrEqual(1);
    expect(scene.endSecond).toBeGreaterThan(scene.startSecond);
  }

  for (let index = 1; index < decomposition.scenes.length; index += 1) {
    expect(decomposition.scenes[index]?.startSecond).toBe(
      decomposition.scenes[index - 1]?.endSecond,
    );
  }

  const ids = decomposition.scenes.map((scene) => scene.id);
  expect(new Set(ids).size).toBe(ids.length);

  const serialized = JSON.stringify(decomposition);
  expect(serialized).not.toContain('recommendationScore');
  expect(serialized).not.toContain('complexityScore');
  expect(serialized).not.toContain('riskScore');
  expect(serialized).not.toContain('qualityScore');
  expect(serialized).not.toContain('matchPercentage');
}

describe('scene decomposition invariants for every whole duration 5 through 180', () => {
  for (let duration = 5; duration <= 180; duration += 1) {
    it(`satisfies invariants for ${duration} seconds`, () => {
      assertDecompositionInvariants(duration);
    });
  }
});

describe('scene count examples', () => {
  it.each([
    [5, 2],
    [10, 2],
    [20, 2],
    [30, 3],
    [60, 6],
    [90, 9],
    [120, 12],
    [180, 12],
  ])('%i seconds produces %i scenes', (duration, expectedCount) => {
    expect(calculateSceneCount(duration)).toBe(expectedCount);
    expect(decomposeDurationIntoScenes(duration).sceneCount).toBe(expectedCount);
  });
});
