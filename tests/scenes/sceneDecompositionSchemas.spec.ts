import { describe, expect, it } from 'vitest';
import {
  SceneDecompositionSchema,
  SceneRoleSchema,
  SceneTimingSchema,
  TotalDurationSecondsSchema,
  SCENE_DECOMPOSITION_ALGORITHM_VERSION,
  SCENE_DECOMPOSITION_ORIGIN,
  decomposeDurationIntoScenes,
} from '../../src/domain/sceneDecomposition.js';

describe('TotalDurationSecondsSchema', () => {
  it('rejects duration below 5', () => {
    expect(TotalDurationSecondsSchema.safeParse(4).success).toBe(false);
  });

  it('rejects duration above 180', () => {
    expect(TotalDurationSecondsSchema.safeParse(181).success).toBe(false);
  });

  it('rejects decimal duration', () => {
    expect(TotalDurationSecondsSchema.safeParse(30.5).success).toBe(false);
  });

  it('accepts whole durations from 5 through 180', () => {
    for (let duration = 5; duration <= 180; duration += 1) {
      expect(TotalDurationSecondsSchema.safeParse(duration).success).toBe(true);
    }
  });
});

describe('SceneDecompositionSchema', () => {
  it('requires algorithmVersion duration-v1', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    expect(decomposition.algorithmVersion).toBe(SCENE_DECOMPOSITION_ALGORITHM_VERSION);
  });

  it('requires origin deterministic_rule_engine', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    expect(decomposition.origin).toBe(SCENE_DECOMPOSITION_ORIGIN);
  });

  it('rejects isAiGenerated true', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    expect(() =>
      SceneDecompositionSchema.parse({ ...decomposition, isAiGenerated: true }),
    ).toThrow();
  });

  it('rejects isPersisted true', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    expect(() =>
      SceneDecompositionSchema.parse({ ...decomposition, isPersisted: true }),
    ).toThrow();
  });

  it('requires isAiGenerated false', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    expect(decomposition.isAiGenerated).toBe(false);
  });

  it('requires isPersisted false', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    expect(decomposition.isPersisted).toBe(false);
  });

  it('contains no provider id fields', () => {
    const serialized = JSON.stringify(decomposeDurationIntoScenes(60));
    expect(serialized).not.toContain('provider');
    expect(serialized).not.toContain('google_veo');
  });

  it('contains no recommendation or score fields', () => {
    const decomposition = decomposeDurationIntoScenes(60);
    expect(decomposition).not.toHaveProperty('recommendationScore');
    expect(decomposition).not.toHaveProperty('matchPercentage');
    expect(decomposition).not.toHaveProperty('complexityScore');
    expect(decomposition).not.toHaveProperty('riskScore');
    expect(decomposition).not.toHaveProperty('qualityScore');
  });

  it('contains no prompt content fields', () => {
    const decomposition = decomposeDurationIntoScenes(60);
    for (const scene of decomposition.scenes) {
      expect(scene).not.toHaveProperty('prompt');
      expect(scene).not.toHaveProperty('sampleContent');
      expect(scene).not.toHaveProperty('dialogue');
    }
  });
});

describe('SceneRoleSchema', () => {
  it('accepts approved roles only', () => {
    expect(SceneRoleSchema.parse('opening_hook')).toBe('opening_hook');
    expect(() => SceneRoleSchema.parse('creative_hook')).toThrow();
  });
});

describe('SceneTimingSchema', () => {
  it('validates timing fields from decomposition output', () => {
    const scene = decomposeDurationIntoScenes(30).scenes[0]!;
    expect(() => SceneTimingSchema.parse(scene)).not.toThrow();
  });
});
