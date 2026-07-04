import { describe, expect, it } from 'vitest';
import {
  COMPLEXITY_REQUIREMENT_WEIGHTS,
  COMPLEXITY_SOURCE_TYPE_POINTS,
  calculateComplexityAssessment,
  deriveAssessmentLevel,
  sumComplexityRequirementWeights,
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
    durationSeconds: 5,
    sceneCount: 2,
    sourceType: 'idea',
    userConstraints: null,
    productionRequirements: createDefaultProductionRequirements(),
    ...overrides,
  };
}

function requirementOnlyInput(key: (typeof PRODUCTION_REQUIREMENT_KEYS)[number]) {
  const requirements = createDefaultProductionRequirements();
  requirements[key] = true;
  return baseInput({ productionRequirements: requirements });
}

describe('assessment level thresholds', () => {
  it('11. score 0 is low', () => {
    expect(deriveAssessmentLevel(0)).toBe('low');
  });

  it('12. score 24 is low', () => {
    expect(deriveAssessmentLevel(24)).toBe('low');
  });

  it('13. score 25 is moderate', () => {
    expect(deriveAssessmentLevel(25)).toBe('moderate');
  });

  it('14. score 49 is moderate', () => {
    expect(deriveAssessmentLevel(49)).toBe('moderate');
  });

  it('15. score 50 is high', () => {
    expect(deriveAssessmentLevel(50)).toBe('high');
  });

  it('16. score 74 is high', () => {
    expect(deriveAssessmentLevel(74)).toBe('high');
  });

  it('17. score 75 is very high', () => {
    expect(deriveAssessmentLevel(75)).toBe('very_high');
  });

  it('18. score 100 is very high', () => {
    expect(deriveAssessmentLevel(100)).toBe('very_high');
  });
});

describe('complexity duration boundaries', () => {
  it.each([
    [5, 0],
    [20, 0],
    [21, 5],
    [40, 5],
    [41, 9],
    [60, 9],
    [61, 13],
    [90, 13],
    [91, 17],
    [120, 17],
    [121, 20],
    [180, 20],
  ])('19. duration %i seconds contributes %i points', (durationSeconds, expectedPoints) => {
    const result = calculateComplexityAssessment(baseInput({ durationSeconds }));
    const durationFactor = result.contributions.find((factor) => factor.key === 'duration');
    if (expectedPoints === 0) {
      expect(durationFactor).toBeUndefined();
    } else {
      expect(durationFactor?.points).toBe(expectedPoints);
    }
    expect(result.score).toBe(expectedPoints);
  });
});

describe('complexity scene-count boundaries', () => {
  it.each([
    [2, 0],
    [3, 0],
    [4, 3],
    [6, 3],
    [7, 6],
    [9, 6],
    [10, 10],
    [12, 10],
  ])('20. scene count %i contributes %i points', (sceneCount, expectedPoints) => {
    const result = calculateComplexityAssessment(baseInput({ sceneCount }));
    const sceneFactor = result.contributions.find((factor) => factor.key === 'scene_structure');
    if (expectedPoints === 0) {
      expect(sceneFactor).toBeUndefined();
    } else {
      expect(sceneFactor?.points).toBe(expectedPoints);
    }
    expect(result.score).toBe(expectedPoints);
  });
});

describe('complexity source-type weights', () => {
  it.each([
    ['idea', 0],
    ['script', 4],
    ['product_url', 6],
    ['article_url', 8],
  ] as const)('21. source type %s contributes %i points', (sourceType, expectedPoints) => {
    expect(COMPLEXITY_SOURCE_TYPE_POINTS[sourceType]).toBe(expectedPoints);
    const result = calculateComplexityAssessment(baseInput({ sourceType }));
    const sourceFactor = result.contributions.find((factor) => factor.key === `source_type_${sourceType}`);
    if (expectedPoints === 0) {
      expect(sourceFactor).toBeUndefined();
    } else {
      expect(sourceFactor?.points).toBe(expectedPoints);
    }
    expect(result.score).toBe(expectedPoints);
  });
});

describe('complexity user-constraint boundaries', () => {
  it.each([
    [null, 0],
    ['', 0],
    ['x', 2],
    ['x'.repeat(250), 2],
    ['x'.repeat(251), 4],
    ['x'.repeat(750), 4],
    ['x'.repeat(751), 6],
    ['x'.repeat(2000), 6],
  ])('22. constraint length %s contributes expected points', (userConstraints, expectedPoints) => {
    const result = calculateComplexityAssessment(baseInput({ userConstraints }));
    const constraintFactor = result.contributions.find((factor) => factor.key === 'user_constraints');
    if (expectedPoints === 0) {
      expect(constraintFactor).toBeUndefined();
    } else {
      expect(constraintFactor?.points).toBe(expectedPoints);
    }
    expect(result.score).toBe(expectedPoints);
  });
});

describe('complexity requirement weights and maximum', () => {
  it('23. requirement-weight total is exactly 56', () => {
    expect(sumComplexityRequirementWeights()).toBe(56);
    const manualTotal = PRODUCTION_REQUIREMENT_KEYS.reduce(
      (total, key) => total + COMPLEXITY_REQUIREMENT_WEIGHTS[key],
      0,
    );
    expect(manualTotal).toBe(56);
  });

  it('24. overall designed maximum is exactly 100', () => {
    const requirements = createDefaultProductionRequirements();
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      requirements[key] = true;
    }

    const result = calculateComplexityAssessment(
      baseInput({
        durationSeconds: 180,
        sceneCount: 12,
        sourceType: 'article_url',
        userConstraints: 'x'.repeat(751),
        productionRequirements: requirements,
      }),
    );

    expect(result.score).toBe(100);
  });

  it('25. empty requirements produce no requirement factors', () => {
    const result = calculateComplexityAssessment(baseInput());
    const requirementFactors = result.contributions.filter(
      (factor) => factor.category === 'production_requirement',
    );
    expect(requirementFactors).toHaveLength(0);
  });

  it('26. every enabled requirement produces one factor', () => {
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      const result = calculateComplexityAssessment(requirementOnlyInput(key));
      const factor = result.contributions.find((entry) => entry.key === `requirement_${key}`);
      expect(factor).toBeDefined();
      expect(factor?.points).toBe(COMPLEXITY_REQUIREMENT_WEIGHTS[key]);
      expect(factor?.category).toBe('production_requirement');
    }
  });

  it('27. disabling a requirement removes its factor', () => {
    const requirements = createDefaultProductionRequirements();
    requirements.voiceover = true;
    requirements.dialogue = true;

    const enabled = calculateComplexityAssessment(baseInput({ productionRequirements: requirements }));
    expect(enabled.contributions.some((factor) => factor.key === 'requirement_voiceover')).toBe(true);

    requirements.voiceover = false;
    const disabled = calculateComplexityAssessment(baseInput({ productionRequirements: requirements }));
    expect(disabled.contributions.some((factor) => factor.key === 'requirement_voiceover')).toBe(false);
    expect(disabled.contributions.some((factor) => factor.key === 'requirement_dialogue')).toBe(true);
  });

  it('28. contribution sum equals score', () => {
    const requirements = createDefaultProductionRequirements();
    requirements.characterConsistency = true;
    requirements.lipSync = true;

    const result = calculateComplexityAssessment(
      baseInput({
        durationSeconds: 45,
        sceneCount: 4,
        sourceType: 'script',
        userConstraints: 'Keep the brand palette consistent.',
        productionRequirements: requirements,
      }),
    );

    const sum = result.contributions.reduce((total, factor) => total + factor.points, 0);
    expect(sum).toBe(result.score);
  });

  it('29. no complexity cap is required', () => {
    const requirements = createDefaultProductionRequirements();
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      requirements[key] = true;
    }

    const result = calculateComplexityAssessment(
      baseInput({
        durationSeconds: 180,
        sceneCount: 12,
        sourceType: 'article_url',
        userConstraints: 'x'.repeat(751),
        productionRequirements: requirements,
      }),
    );

    expect(result.score).toBe(100);
    expect(result.level).toBe('very_high');
  });

  it('30. contributions sort deterministically', () => {
    const requirements = createDefaultProductionRequirements();
    requirements.characterConsistency = true;
    requirements.lipSync = true;
    requirements.exactTextVisibility = true;
    requirements.logoAccuracy = true;

    const result = calculateComplexityAssessment(
      baseInput({
        durationSeconds: 60,
        sceneCount: 6,
        sourceType: 'article_url',
        userConstraints: 'x'.repeat(300),
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

    const secondPass = calculateComplexityAssessment(
      baseInput({
        durationSeconds: 60,
        sceneCount: 6,
        sourceType: 'article_url',
        userConstraints: 'x'.repeat(300),
        productionRequirements: requirements,
      }),
    );
    expect(secondPass.contributions.map((factor) => factor.key)).toEqual(
      result.contributions.map((factor) => factor.key),
    );
  });
});
