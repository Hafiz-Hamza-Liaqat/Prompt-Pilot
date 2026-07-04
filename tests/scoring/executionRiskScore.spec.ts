import { describe, expect, it } from 'vitest';
import {
  EXECUTION_RISK_INTERACTIONS,
  calculateExecutionRiskAssessment,
  sumExecutionRiskRequirementWeights,
  type ComplexityRiskScoringInput,
} from '../../src/domain/complexityRiskAssessment.js';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  createDefaultProductionRequirements,
} from '../../src/domain/productionRequirements.js';

function baseInput(
  overrides: Partial<ComplexityRiskScoringInput> = {},
): ComplexityRiskScoringInput {
  return {
    durationSeconds: 30,
    sceneCount: 3,
    sourceType: 'idea',
    userConstraints: null,
    productionRequirements: createDefaultProductionRequirements(),
    ...overrides,
  };
}

function requirementsWith(enabled: Partial<Record<(typeof PRODUCTION_REQUIREMENT_KEYS)[number], boolean>>) {
  const productionRequirements = createDefaultProductionRequirements();
  for (const [key, value] of Object.entries(enabled)) {
    productionRequirements[key as (typeof PRODUCTION_REQUIREMENT_KEYS)[number]] = Boolean(value);
  }
  return productionRequirements;
}

describe('execution-risk duration boundaries', () => {
  it.each([
    [5, 0],
    [40, 0],
    [41, 3],
    [60, 3],
    [61, 6],
    [90, 6],
    [91, 8],
    [120, 8],
    [121, 10],
    [180, 10],
  ])('31. duration %i seconds contributes %i risk points', (durationSeconds, expectedPoints) => {
    const result = calculateExecutionRiskAssessment(baseInput({ durationSeconds }));
    const durationFactor = result.contributions.find((factor) => factor.key === 'duration');
    if (expectedPoints === 0) {
      expect(durationFactor).toBeUndefined();
    } else {
      expect(durationFactor?.points).toBe(expectedPoints);
    }
  });
});

describe('execution-risk scene-density boundaries', () => {
  it.each([
    [2, 0],
    [6, 0],
    [7, 3],
    [9, 3],
    [10, 5],
    [12, 5],
  ])('32. scene count %i contributes %i density points', (sceneCount, expectedPoints) => {
    const result = calculateExecutionRiskAssessment(baseInput({ sceneCount }));
    const densityFactor = result.contributions.find((factor) => factor.key === 'scene_density');
    if (expectedPoints === 0) {
      expect(densityFactor).toBeUndefined();
    } else {
      expect(densityFactor?.points).toBe(expectedPoints);
    }
  });
});

describe('execution-risk requirement weights', () => {
  it('33. base requirement-weight total is exactly 60', () => {
    expect(sumExecutionRiskRequirementWeights()).toBe(60);
  });
});

describe('execution-risk interactions', () => {
  it('34. every approved interaction triggers correctly', () => {
    const cases: Array<{
      key: string;
      input: Partial<ComplexityRiskScoringInput>;
    }> = [
      {
        key: 'exact_text_and_logo_fidelity',
        input: {
          productionRequirements: requirementsWith({
            exactTextVisibility: true,
            logoAccuracy: true,
          }),
        },
      },
      {
        key: 'dialogue_lip_sync_coordination',
        input: {
          productionRequirements: requirementsWith({
            dialogue: true,
            lipSync: true,
          }),
        },
      },
      {
        key: 'character_across_locations',
        input: {
          productionRequirements: requirementsWith({
            characterConsistency: true,
            multipleLocations: true,
          }),
        },
      },
      {
        key: 'product_across_locations',
        input: {
          productionRequirements: requirementsWith({
            productConsistency: true,
            multipleLocations: true,
          }),
        },
      },
      {
        key: 'extension_frame_boundary_control',
        input: {
          productionRequirements: requirementsWith({
            videoExtension: true,
            firstLastFrameControl: true,
          }),
        },
      },
      {
        key: 'native_audio_dialogue_coordination',
        input: {
          productionRequirements: requirementsWith({
            nativeAudio: true,
            dialogue: true,
          }),
        },
      },
      {
        key: 'long_form_multi_location',
        input: {
          durationSeconds: 91,
          productionRequirements: requirementsWith({ multipleLocations: true }),
        },
      },
      {
        key: 'dense_scene_camera_control',
        input: {
          sceneCount: 10,
          productionRequirements: requirementsWith({ cameraControl: true }),
        },
      },
    ];

    for (const testCase of cases) {
      const result = calculateExecutionRiskAssessment(baseInput(testCase.input));
      expect(result.contributions.some((factor) => factor.key === testCase.key)).toBe(true);
    }
  });

  it('35. every interaction remains absent when one condition is false', () => {
    const cases: Array<Partial<ComplexityRiskScoringInput>> = [
      {
        productionRequirements: requirementsWith({
          exactTextVisibility: true,
          logoAccuracy: false,
        }),
      },
      {
        productionRequirements: requirementsWith({
          dialogue: true,
          lipSync: false,
        }),
      },
      {
        productionRequirements: requirementsWith({
          characterConsistency: true,
          multipleLocations: false,
        }),
      },
      {
        productionRequirements: requirementsWith({
          productConsistency: true,
          multipleLocations: false,
        }),
      },
      {
        productionRequirements: requirementsWith({
          videoExtension: true,
          firstLastFrameControl: false,
        }),
      },
      {
        productionRequirements: requirementsWith({
          nativeAudio: true,
          dialogue: false,
        }),
      },
      {
        durationSeconds: 90,
        productionRequirements: requirementsWith({ multipleLocations: true }),
      },
      {
        sceneCount: 9,
        productionRequirements: requirementsWith({ cameraControl: true }),
      },
    ];

    for (const input of cases) {
      const result = calculateExecutionRiskAssessment(baseInput(input));
      const interactionKeys = result.contributions
        .filter((factor) => factor.category === 'interaction')
        .map((factor) => factor.key);
      expect(interactionKeys).toHaveLength(0);
    }
  });

  it('36. no unknown interaction appears', () => {
    const requirements = createDefaultProductionRequirements();
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      requirements[key] = true;
    }

    const result = calculateExecutionRiskAssessment(
      baseInput({
        durationSeconds: 120,
        sceneCount: 12,
        productionRequirements: requirements,
      }),
    );

    const approvedInteractionKeys = new Set<string>(
      EXECUTION_RISK_INTERACTIONS.map((entry) => entry.key),
    );
    const interactionFactors = result.contributions.filter(
      (factor) => factor.category === 'interaction',
    );

    expect(interactionFactors.length).toBe(approvedInteractionKeys.size);
    for (const factor of interactionFactors) {
      expect(approvedInteractionKeys.has(factor.key)).toBe(true);
    }
  });
});

describe('execution-risk score aggregation', () => {
  it('37. raw score equals contribution sum', () => {
    const requirements = createDefaultProductionRequirements();
    requirements.exactTextVisibility = true;
    requirements.logoAccuracy = true;
    requirements.dialogue = true;
    requirements.lipSync = true;

    const result = calculateExecutionRiskAssessment(
      baseInput({
        durationSeconds: 45,
        sceneCount: 4,
        productionRequirements: requirements,
      }),
    );

    const sum = result.contributions.reduce((total, factor) => total + factor.points, 0);
    expect(result.rawScore).toBe(sum);
  });

  it('38. capped score equals min(100, rawScore)', () => {
    const requirements = createDefaultProductionRequirements();
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      requirements[key] = true;
    }

    const capped = calculateExecutionRiskAssessment(
      baseInput({
        durationSeconds: 180,
        sceneCount: 12,
        productionRequirements: requirements,
      }),
    );
    expect(capped.score).toBe(Math.min(100, capped.rawScore));

    const uncapped = calculateExecutionRiskAssessment(
      baseInput({
        productionRequirements: requirementsWith({ voiceover: true }),
      }),
    );
    expect(uncapped.score).toBe(Math.min(100, uncapped.rawScore));
  });

  it('39. wasCapped is false at exactly 100', () => {
    const result = calculateExecutionRiskAssessment(
      baseInput({
        durationSeconds: 45,
        sceneCount: 3,
        productionRequirements: requirementsWith({
          exactTextVisibility: true,
          logoAccuracy: true,
          dialogue: true,
          lipSync: true,
          characterConsistency: true,
          productConsistency: true,
          multipleLocations: true,
          nativeAudio: true,
          videoExtension: true,
          firstLastFrameControl: true,
          cameraControl: true,
        }),
      }),
    );

    expect(result.rawScore).toBe(100);
    expect(result.score).toBe(100);
    expect(result.wasCapped).toBe(false);
  });

  it('40. wasCapped is true above 100', () => {
    const requirements = createDefaultProductionRequirements();
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      requirements[key] = true;
    }

    const result = calculateExecutionRiskAssessment(
      baseInput({
        durationSeconds: 180,
        sceneCount: 12,
        productionRequirements: requirements,
      }),
    );

    expect(result.rawScore).toBeGreaterThan(100);
    expect(result.score).toBe(100);
    expect(result.wasCapped).toBe(true);
  });

  it('41. contributions sort deterministically', () => {
    const requirements = createDefaultProductionRequirements();
    requirements.exactTextVisibility = true;
    requirements.logoAccuracy = true;
    requirements.dialogue = true;
    requirements.lipSync = true;
    requirements.characterConsistency = true;
    requirements.multipleLocations = true;

    const result = calculateExecutionRiskAssessment(
      baseInput({
        durationSeconds: 60,
        sceneCount: 8,
        productionRequirements: requirements,
      }),
    );

    for (let index = 1; index < result.contributions.length; index += 1) {
      const previous = result.contributions[index - 1]!;
      const current = result.contributions[index]!;

      if (previous.points === current.points) {
        expect(previous.key.localeCompare(current.key)).toBeLessThanOrEqual(0);
      } else {
        expect(previous.points).toBeGreaterThan(current.points);
      }
    }
  });
});
