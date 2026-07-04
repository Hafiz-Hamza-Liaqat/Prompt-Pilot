import { describe, expect, it } from 'vitest';
import {
  AssessmentLevelSchema,
  COMPLEXITY_RISK_ALGORITHM_VERSION,
  COMPLEXITY_RISK_ORIGIN,
  ComplexityAssessmentSchema,
  ComplexityRiskAssessmentSchema,
  ExecutionRiskAssessmentSchema,
  calculateComplexityRiskAssessment,
} from '../../src/domain/complexityRiskAssessment.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';

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

function minimalAssessmentInput() {
  return {
    durationSeconds: 30,
    sceneCount: 3,
    sourceType: 'idea' as const,
    userConstraints: null,
    productionRequirements: createDefaultProductionRequirements(),
  };
}

function validComplexityFactor() {
  return {
    key: 'duration',
    assessment: 'complexity' as const,
    category: 'duration' as const,
    label: 'Saved duration',
    points: 5,
    rationale: 'Saved duration falls in the 21–40 seconds bracket.',
    sourceFields: ['durationSeconds'],
  };
}

function validExecutionFactor() {
  return {
    key: 'requirement_voiceover',
    assessment: 'execution_risk' as const,
    category: 'production_requirement' as const,
    label: 'Voiceover narration',
    points: 1,
    rationale: 'Voiceover narration introduces fidelity or coordination demands.',
    sourceFields: ['productionRequirements', 'voiceover'],
  };
}

describe('complexity-risk schema and metadata', () => {
  it('1. algorithm version is exactly complexity-risk-v1', () => {
    const assessment = calculateComplexityRiskAssessment(minimalAssessmentInput());
    expect(assessment.algorithmVersion).toBe(COMPLEXITY_RISK_ALGORITHM_VERSION);
    expect(COMPLEXITY_RISK_ALGORITHM_VERSION).toBe('complexity-risk-v1');
  });

  it('2. origin is deterministic_rule_engine', () => {
    const assessment = calculateComplexityRiskAssessment(minimalAssessmentInput());
    expect(assessment.origin).toBe(COMPLEXITY_RISK_ORIGIN);
    expect(COMPLEXITY_RISK_ORIGIN).toBe('deterministic_rule_engine');
  });

  it('3. isAiGenerated must be false', () => {
    const assessment = calculateComplexityRiskAssessment(minimalAssessmentInput());
    expect(assessment.isAiGenerated).toBe(false);
    expect(() =>
      ComplexityRiskAssessmentSchema.parse({ ...assessment, isAiGenerated: true }),
    ).toThrow();
  });

  it('4. isPersisted must be false', () => {
    const assessment = calculateComplexityRiskAssessment(minimalAssessmentInput());
    expect(assessment.isPersisted).toBe(false);
    expect(() =>
      ComplexityRiskAssessmentSchema.parse({ ...assessment, isPersisted: true }),
    ).toThrow();
  });

  it('5. invalid levels fail', () => {
    expect(() => AssessmentLevelSchema.parse('low')).not.toThrow();
    expect(() => AssessmentLevelSchema.parse('moderate')).not.toThrow();
    expect(() => AssessmentLevelSchema.parse('high')).not.toThrow();
    expect(() => AssessmentLevelSchema.parse('very_high')).not.toThrow();
    expect(() => AssessmentLevelSchema.parse('critical')).toThrow();
    expect(() => AssessmentLevelSchema.parse('')).toThrow();
  });

  it('6. scores below zero fail', () => {
    expect(() =>
      ComplexityAssessmentSchema.parse({
        score: -1,
        level: 'low',
        contributions: [],
      }),
    ).toThrow();

    expect(() =>
      ExecutionRiskAssessmentSchema.parse({
        rawScore: -1,
        score: 0,
        level: 'low',
        wasCapped: false,
        contributions: [],
      }),
    ).toThrow();
  });

  it('7. capped scores over 100 fail', () => {
    expect(() =>
      ComplexityAssessmentSchema.parse({
        score: 101,
        level: 'very_high',
        contributions: [],
      }),
    ).toThrow();

    expect(() =>
      ExecutionRiskAssessmentSchema.parse({
        rawScore: 101,
        score: 101,
        level: 'very_high',
        wasCapped: true,
        contributions: [],
      }),
    ).toThrow();
  });

  it('8. risk raw score may exceed 100', () => {
    const factor = validExecutionFactor();
    expect(() =>
      ExecutionRiskAssessmentSchema.parse({
        rawScore: 127,
        score: 100,
        level: 'very_high',
        wasCapped: true,
        contributions: Array.from({ length: 127 }, (_, index) => ({
          ...factor,
          key: `factor_${index}`,
        })),
      }),
    ).not.toThrow();
  });

  it('9. complexity score may not exceed 100', () => {
    const contributions = Array.from({ length: 100 }, (_, index) => ({
      ...validComplexityFactor(),
      key: `factor_${index}`,
      points: 1,
    }));

    expect(() =>
      ComplexityAssessmentSchema.parse({
        score: 100,
        level: 'very_high',
        contributions,
      }),
    ).not.toThrow();

    expect(() =>
      ComplexityAssessmentSchema.parse({
        score: 101,
        level: 'very_high',
        contributions,
      }),
    ).toThrow();
  });

  it('10. prohibited provider fields are absent', () => {
    const assessment = calculateComplexityRiskAssessment(minimalAssessmentInput());
    const serialized = JSON.stringify(assessment);

    for (const key of PROHIBITED_OUTPUT_KEYS) {
      expect(assessment).not.toHaveProperty(key);
      expect(serialized.toLowerCase()).not.toContain(key.toLowerCase());
    }

    expect(() =>
      ComplexityRiskAssessmentSchema.parse({
        ...assessment,
        providerId: 'google_veo',
      }),
    ).toThrow();
  });
});
