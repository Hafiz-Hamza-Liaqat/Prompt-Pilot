import { expect } from 'vitest';
import { calculateProviderRecommendation } from '../../src/domain/providerRecommendationEngine.js';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  createDefaultProductionRequirements,
  type ProductionRequirements,
} from '../../src/domain/productionRequirements.js';
import { buildDeterministicRecommendationCatalogue, buildRecommendationCalculateInput } from './catalogueFixtures.js';

export const RECOMMENDATION_COMBINATION_COUNT = 16384;
export const RECOMMENDATION_COMBINATION_CHUNK_SIZE = 1024;
export const RECOMMENDATION_COMBINATION_CHUNK_COUNT =
  RECOMMENDATION_COMBINATION_COUNT / RECOMMENDATION_COMBINATION_CHUNK_SIZE;

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

function buildRequirementsFromMask(mask: number): ProductionRequirements {
  const requirements = createDefaultProductionRequirements();
  PRODUCTION_REQUIREMENT_KEYS.forEach((key, index) => {
    requirements[key] = Boolean(mask & (1 << index));
  });
  return requirements;
}

function* requirementCombinationsInRange(startMask: number, endMask: number): Generator<ProductionRequirements> {
  for (let mask = startMask; mask < endMask; mask += 1) {
    yield buildRequirementsFromMask(mask);
  }
}

export function runRecommendationInvariantLoop(startMask: number, endMask: number) {
  const catalogue = buildDeterministicRecommendationCatalogue();
  const sceneDecomposition = buildRecommendationCalculateInput(catalogue).sceneDecomposition;
  const briefBase = buildRecommendationCalculateInput(catalogue).brief;

  for (const requirements of requirementCombinationsInRange(startMask, endMask)) {
    const input = {
      brief: { ...briefBase, productionRequirements: requirements },
      sceneDecomposition,
      catalogue,
    };

    const first = calculateProviderRecommendation(input);
    const second = calculateProviderRecommendation(input);

    expect(first).toEqual(second);

    const rankedIds = [
      first.primaryRecommendation,
      ...first.leadingAlternatives,
      ...first.alternatives,
    ]
      .filter((candidate) => candidate !== null)
      .map((candidate) => candidate.providerId);
    expect(rankedIds).not.toContain('openai_sora');
    expect(new Set(rankedIds).size).toBe(rankedIds.length);

    const allCandidates = [
      first.primaryRecommendation,
      ...first.leadingAlternatives,
      ...first.alternatives,
      ...first.insufficientEvidence,
      ...first.ineligible,
    ].filter((candidate) => candidate !== null);

    for (const candidate of allCandidates) {
      expect(candidate.evidenceBackedFitScore).toBeGreaterThanOrEqual(0);
      expect(candidate.evidenceBackedFitScore).toBeLessThanOrEqual(100);
      expect(candidate.evidenceCoverageScore).toBeGreaterThanOrEqual(0);
      expect(candidate.evidenceCoverageScore).toBeLessThanOrEqual(100);
    }

    for (const key of PROHIBITED_OUTPUT_KEYS) {
      expect(first).not.toHaveProperty(key);
    }

    if (first.primaryRecommendation) {
      expect(first.recommendationStatus).toBe('recommended');
    }

    for (const candidate of first.ineligible) {
      expect(['ineligible', 'critical_blocked']).toContain(candidate.classification);
    }

    for (const candidate of allCandidates) {
      for (const needKey of candidate.unknownNeeds) {
        expect(candidate.unsupportedNeeds).not.toContain(needKey);
      }
    }

    for (const reference of allCandidates.flatMap(
      (candidate) => candidate.explanation.sourceReferences,
    )) {
      expect(reference.url.startsWith('https://')).toBe(true);
    }
  }
}
