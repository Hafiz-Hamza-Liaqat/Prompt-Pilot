import { describe, expect, it } from 'vitest';
import {
  PROVIDER_RECOMMENDATION_ALGORITHM_VERSION,
  PROVIDER_RECOMMENDATION_ORIGIN,
  calculateProviderRecommendation,
} from '../../src/domain/providerRecommendationEngine.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import { buildRecommendationCalculateInput } from './catalogueFixtures.js';

const PROHIBITED_OUTPUT_KEYS = [
  'successProbability',
  'failureProbability',
  'qualityScore',
  'priceEstimate',
  'estimatedCost',
  'generationTime',
  'selectedProviderCredential',
  'providerApiKey',
  'matchPercentage',
  'bestProvider',
  'winner',
  'guaranteed',
  'perfect_match',
] as const;

const PROHIBITED_PHRASES = [
  'best provider',
  'perfect match',
  'guaranteed',
  'success probability',
  'failure probability',
  'quality prediction',
  'will generate',
  'provider tested',
  'live pricing',
  'cheapest provider',
  'fastest provider',
] as const;

function collectAllText(result: ReturnType<typeof calculateProviderRecommendation>): string {
  return JSON.stringify(result).toLowerCase();
}

describe('recommendation truthfulness', () => {
  it('59. no success probability exists', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result).not.toHaveProperty('successProbability');
    expect(collectAllText(result)).not.toContain('successprobability');
  });

  it('60. no failure probability exists', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result).not.toHaveProperty('failureProbability');
    expect(collectAllText(result)).not.toContain('failureprobability');
  });

  it('61. no quality score exists', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result).not.toHaveProperty('qualityScore');
    expect(collectAllText(result)).not.toContain('qualityscore');
  });

  it('62. no price estimate exists', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result).not.toHaveProperty('priceEstimate');
    expect(result).not.toHaveProperty('estimatedCost');
  });

  it('63. no provider credential key exists', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result).not.toHaveProperty('selectedProviderCredential');
    expect(result).not.toHaveProperty('providerApiKey');
  });

  it('64. no provider is called perfect', () => {
    const text = collectAllText(calculateProviderRecommendation(buildRecommendationCalculateInput()));
    expect(text).not.toContain('perfect match');
    expect(text).not.toContain('perfect provider');
  });

  it('65. no provider is called guaranteed', () => {
    const text = collectAllText(calculateProviderRecommendation(buildRecommendationCalculateInput()));
    expect(text).not.toContain('guaranteed');
  });

  it('66. no provider is called best', () => {
    const text = collectAllText(calculateProviderRecommendation(buildRecommendationCalculateInput()));
    expect(text).not.toContain('best provider');
    expect(text).not.toContain('best_model');
  });

  it('67. unknown evidence is labelled as an evidence gap', () => {
    const result = calculateProviderRecommendation(
      buildRecommendationCalculateInput(undefined, {
        brief: {
          productionRequirements: {
            ...createDefaultProductionRequirements(),
            dialogue: true,
          },
        },
      }),
    );
    const allGaps = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
      ...result.insufficientEvidence,
    ]
      .filter((candidate) => candidate !== null)
      .flatMap((candidate) => candidate.explanation.evidenceGaps);
    expect(allGaps.some((gap) => gap.toLowerCase().includes('lacks verified catalogue evidence'))).toBe(
      true,
    );
  });

  it('68. recommendation output is non-AI', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result.isAiGenerated).toBe(false);
    expect(result.origin).toBe(PROVIDER_RECOMMENDATION_ORIGIN);
  });

  it('69. recommendation output is non-persistent', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result.isPersisted).toBe(false);
  });

  it('70. algorithm version is exact', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result.algorithmVersion).toBe(PROVIDER_RECOMMENDATION_ALGORITHM_VERSION);
    expect(result.algorithmVersion).toBe('provider-recommendation-v1');
  });

  it('prohibited output keys remain absent across candidates', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    for (const key of PROHIBITED_OUTPUT_KEYS) {
      expect(result).not.toHaveProperty(key);
    }

    const candidates = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
      ...result.insufficientEvidence,
      ...result.ineligible,
    ].filter((candidate) => candidate !== null);

    for (const candidate of candidates) {
      for (const key of PROHIBITED_OUTPUT_KEYS) {
        expect(candidate).not.toHaveProperty(key);
      }
    }
  });

  it('prohibited marketing phrases are absent from explanations', () => {
    const text = collectAllText(calculateProviderRecommendation(buildRecommendationCalculateInput()));
    for (const phrase of PROHIBITED_PHRASES) {
      expect(text).not.toContain(phrase);
    }
  });
});
