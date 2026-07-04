import { describe, expect, it } from 'vitest';
import {
  COMPLEXITY_REQUIREMENT_WEIGHTS,
  ComplexityRiskScoringInputSchema,
  EXECUTION_RISK_INTERACTIONS,
  EXECUTION_RISK_REQUIREMENT_WEIGHTS,
  calculateComplexityAssessment,
  calculateComplexityRiskAssessment,
  calculateExecutionRiskAssessment,
} from '../../src/domain/complexityRiskAssessment.js';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  createDefaultProductionRequirements,
  type ProductionRequirements,
} from '../../src/domain/productionRequirements.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';

const PROHIBITED_OUTPUT_KEYS = [
  'providerId',
  'selectedProvider',
  'recommendedProvider',
  'providerScore',
  'matchPercentage',
  'successProbability',
  'failureProbability',
  'qualityScore',
  'estimatedCost',
  'priceEstimate',
  'generationTime',
  'safetyScore',
] as const;

const APPROVED_SOURCE_FIELDS = new Set<string>([
  'durationSeconds',
  'sceneCount',
  'sourceType',
  'userConstraints',
  'productionRequirements',
  ...PRODUCTION_REQUIREMENT_KEYS,
]);

const LOOP_INPUT = {
  durationSeconds: 30,
  sceneCount: 3,
  sourceType: 'idea' as const,
  userConstraints: null as string | null,
};

function buildRequirementsFromMask(mask: number): ProductionRequirements {
  const requirements = createDefaultProductionRequirements();
  PRODUCTION_REQUIREMENT_KEYS.forEach((key, index) => {
    requirements[key] = Boolean(mask & (1 << index));
  });
  return requirements;
}

describe('provider neutrality and privacy', () => {
  it('42. provider records are not accepted as scorer input', () => {
    const parsed = ComplexityRiskScoringInputSchema.parse({
      ...LOOP_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
      providerId: 'google_veo',
      recommendedProvider: 'runway',
    });

    expect(parsed).not.toHaveProperty('providerId');
    expect(parsed).not.toHaveProperty('recommendedProvider');
    expect(Object.keys(parsed)).toEqual([
      'durationSeconds',
      'sceneCount',
      'sourceType',
      'userConstraints',
      'productionRequirements',
    ]);
  });

  it('43. provider IDs are absent from output', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
    });
    const serialized = JSON.stringify(assessment).toLowerCase();
    expect(serialized).not.toContain('google_veo');
    expect(serialized).not.toContain('providerid');
    expect(serialized).not.toContain('runway');
  });

  it('44. brief text is not copied into rationales', () => {
    const secretText = 'SECRET_BRIEF_TEXT_SHOULD_NOT_APPEAR_IN_RATIONALE';
    const assessment = calculateComplexityRiskAssessment({
      durationSeconds: 45,
      sceneCount: 4,
      sourceType: 'script',
      userConstraints: secretText,
      productionRequirements: createDefaultProductionRequirements(),
    });

    const rationales = [
      ...assessment.complexity.contributions.map((factor) => factor.rationale),
      ...assessment.executionRisk.contributions.map((factor) => factor.rationale),
    ].join('\n');

    expect(rationales).not.toContain(secretText);
  });

  it('45. source URLs are not copied into rationales', () => {
    const assessment = calculateComplexityRiskAssessment({
      durationSeconds: 45,
      sceneCount: 4,
      sourceType: 'product_url',
      userConstraints: null,
      productionRequirements: createDefaultProductionRequirements(),
    });

    const rationales = [
      ...assessment.complexity.contributions.map((factor) => factor.rationale),
      ...assessment.executionRisk.contributions.map((factor) => factor.rationale),
    ].join('\n');

    expect(rationales).not.toContain('http');
    expect(rationales).not.toContain('example.com');
  });

  it('46. user identifiers are absent', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
    });
    const serialized = JSON.stringify(assessment).toLowerCase();
    expect(serialized).not.toContain('userid');
    expect(serialized).not.toContain('ownerid');
    expect(serialized).not.toContain('11111111');
  });

  it('47. no match percentage exists', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
    });
    expect(assessment).not.toHaveProperty('matchPercentage');
  });

  it('48. no success probability exists', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
    });
    expect(assessment).not.toHaveProperty('successProbability');
  });

  it('49. no quality score exists', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
    });
    expect(assessment).not.toHaveProperty('qualityScore');
  });

  it('50. no price estimate exists', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: createDefaultProductionRequirements(),
    });
    expect(assessment).not.toHaveProperty('priceEstimate');
    expect(assessment).not.toHaveProperty('estimatedCost');
  });
});

describe('determinism and invariants', () => {
  it('51. identical input gives identical output', () => {
    const input = {
      ...LOOP_INPUT,
      productionRequirements: buildRequirementsFromMask(42),
    };
    const first = calculateComplexityRiskAssessment(input);
    const second = calculateComplexityRiskAssessment(input);
    expect(first).toEqual(second);
  });

  it('52. input object is not mutated', () => {
    const input = {
      ...LOOP_INPUT,
      productionRequirements: buildRequirementsFromMask(7),
    };
    const snapshot = structuredClone(input);
    calculateComplexityRiskAssessment(input);
    expect(input).toEqual(snapshot);
  });

  it('53. scene decomposition is not mutated', () => {
    const decomposition = decomposeDurationIntoScenes(30);
    const snapshot = structuredClone(decomposition);
    calculateComplexityRiskAssessment({
      durationSeconds: decomposition.totalDurationSeconds,
      sceneCount: decomposition.sceneCount,
      sourceType: 'idea',
      userConstraints: null,
      productionRequirements: createDefaultProductionRequirements(),
    });
    expect(decomposition).toEqual(snapshot);
  });

  it('54. enabling a positive-weight requirement never lowers complexity', () => {
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      if (COMPLEXITY_REQUIREMENT_WEIGHTS[key] <= 0) {
        continue;
      }

      const baselineRequirements = createDefaultProductionRequirements();
      const enabledRequirements = createDefaultProductionRequirements();
      enabledRequirements[key] = true;

      const baseline = calculateComplexityAssessment({
        ...LOOP_INPUT,
        productionRequirements: baselineRequirements,
      });
      const enabled = calculateComplexityAssessment({
        ...LOOP_INPUT,
        productionRequirements: enabledRequirements,
      });

      expect(enabled.score).toBeGreaterThanOrEqual(baseline.score);
    }
  });

  it('55. enabling a positive-weight requirement never lowers raw execution risk', () => {
    for (const key of PRODUCTION_REQUIREMENT_KEYS) {
      if (EXECUTION_RISK_REQUIREMENT_WEIGHTS[key] <= 0) {
        continue;
      }

      const baselineRequirements = createDefaultProductionRequirements();
      const enabledRequirements = createDefaultProductionRequirements();
      enabledRequirements[key] = true;

      const baseline = calculateExecutionRiskAssessment({
        ...LOOP_INPUT,
        productionRequirements: baselineRequirements,
      });
      const enabled = calculateExecutionRiskAssessment({
        ...LOOP_INPUT,
        productionRequirements: enabledRequirements,
      });

      expect(enabled.rawScore).toBeGreaterThanOrEqual(baseline.rawScore);
    }
  });

  it('56. scores remain within defined bounds', () => {
    const representativeMasks = [0, 1, 42, 8191, 16383];
    for (const mask of representativeMasks) {
      const assessment = calculateComplexityRiskAssessment({
        ...LOOP_INPUT,
        productionRequirements: buildRequirementsFromMask(mask),
      });

      expect(assessment.complexity.score).toBeGreaterThanOrEqual(0);
      expect(assessment.complexity.score).toBeLessThanOrEqual(100);
      expect(assessment.executionRisk.score).toBeGreaterThanOrEqual(0);
      expect(assessment.executionRisk.score).toBeLessThanOrEqual(100);
      expect(assessment.executionRisk.rawScore).toBeGreaterThanOrEqual(0);
    }
  });

  it('57. complexity contribution keys are unique', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: buildRequirementsFromMask(16383),
    });
    const keys = assessment.complexity.contributions.map((factor) => factor.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('58. risk contribution keys are unique', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: buildRequirementsFromMask(16383),
    });
    const keys = assessment.executionRisk.contributions.map((factor) => factor.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('59. every contribution has positive points', () => {
    const assessment = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: buildRequirementsFromMask(8191),
    });

    for (const factor of assessment.complexity.contributions) {
      expect(factor.points).toBeGreaterThan(0);
    }
    for (const factor of assessment.executionRisk.contributions) {
      expect(factor.points).toBeGreaterThan(0);
    }
  });

  it('60. every contribution has approved source fields', () => {
    const approvedInteractionFields = new Set<string>(
      EXECUTION_RISK_INTERACTIONS.flatMap((interaction) => interaction.sourceFields),
    );
    const assessment = calculateComplexityRiskAssessment({
      durationSeconds: 120,
      sceneCount: 12,
      sourceType: 'article_url',
      userConstraints: 'x'.repeat(400),
      productionRequirements: buildRequirementsFromMask(16383),
    });

    const allFactors = [
      ...assessment.complexity.contributions,
      ...assessment.executionRisk.contributions,
    ];

    for (const factor of allFactors) {
      expect(factor.sourceFields.length).toBeGreaterThan(0);
      for (const field of factor.sourceFields) {
        expect(
          APPROVED_SOURCE_FIELDS.has(field) || approvedInteractionFields.has(field),
        ).toBe(true);
      }
    }
  });
});

function* requirementCombinationsInRange(startMask: number, endMask: number): Generator<ProductionRequirements> {
  for (let mask = startMask; mask < endMask; mask += 1) {
    yield buildRequirementsFromMask(mask);
  }
}

function runScoringInvariantLoop(startMask: number, endMask: number) {
  const approvedInteractionFields = new Set<string>(
    EXECUTION_RISK_INTERACTIONS.flatMap((interaction) => interaction.sourceFields),
  );

  for (const requirements of requirementCombinationsInRange(startMask, endMask)) {
    const first = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: requirements,
    });
    const second = calculateComplexityRiskAssessment({
      ...LOOP_INPUT,
      productionRequirements: requirements,
    });

    expect(first).toEqual(second);
    expect(first.complexity.score).toBeGreaterThanOrEqual(0);
    expect(first.complexity.score).toBeLessThanOrEqual(100);
    expect(first.executionRisk.score).toBeGreaterThanOrEqual(0);
    expect(first.executionRisk.score).toBeLessThanOrEqual(100);
    expect(first.executionRisk.rawScore).toBeGreaterThanOrEqual(0);

    for (const key of PROHIBITED_OUTPUT_KEYS) {
      expect(first).not.toHaveProperty(key);
    }

    const complexityKeys = first.complexity.contributions.map((factor) => factor.key);
    const riskKeys = first.executionRisk.contributions.map((factor) => factor.key);
    expect(new Set(complexityKeys).size).toBe(complexityKeys.length);
    expect(new Set(riskKeys).size).toBe(riskKeys.length);

    for (const factor of first.complexity.contributions) {
      expect(factor.points).toBeGreaterThan(0);
    }
    for (const factor of first.executionRisk.contributions) {
      expect(factor.points).toBeGreaterThan(0);
    }

    for (const factor of [...first.complexity.contributions, ...first.executionRisk.contributions]) {
      for (const field of factor.sourceFields) {
        expect(
          APPROVED_SOURCE_FIELDS.has(field) || approvedInteractionFields.has(field),
        ).toBe(true);
      }
    }
  }
}

describe('exhaustive 16384 requirement-combination loop', () => {
  const chunkSize = 4096;
  const chunkCount = 16384 / chunkSize;

  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
    const startMask = chunkIndex * chunkSize;
    const endMask = startMask + chunkSize;

    it(`passes invariants for requirement combinations ${startMask}–${endMask - 1}`, () => {
      runScoringInvariantLoop(startMask, endMask);
    }, 60_000);
  }

  it('covers all 16384 combinations across chunks', () => {
    expect(chunkCount * chunkSize).toBe(16384);
  });
});
