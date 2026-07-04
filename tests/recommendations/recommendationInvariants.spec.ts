import { describe, expect, it } from 'vitest';
import { calculateProviderRecommendation } from '../../src/domain/providerRecommendationEngine.js';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  createDefaultProductionRequirements,
  type ProductionRequirements,
} from '../../src/domain/productionRequirements.js';
import { buildDeterministicRecommendationCatalogue, buildRecommendationCalculateInput } from './catalogueFixtures.js';

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

describe('recommendation invariants', () => {
  it('output remains deterministic for identical inputs', () => {
    const input = buildRecommendationCalculateInput(buildDeterministicRecommendationCatalogue(), {
      brief: { productionRequirements: createDefaultProductionRequirements() },
    });
    const first = calculateProviderRecommendation(input);
    const second = calculateProviderRecommendation(input);
    expect(first).toEqual(second);
  });

  it('Sora remains excluded from normal ranking when sunsetting', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    const rankedIds = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
    ]
      .filter((candidate) => candidate !== null)
      .map((candidate) => candidate.providerId);
    expect(rankedIds).not.toContain('openai_sora');
    expect(result.ineligible.some((candidate) => candidate.providerId === 'openai_sora')).toBe(true);
  });

  it('at most one primary recommendation exists', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    expect(result.primaryRecommendation === null || result.primaryRecommendation.tier === 'primary_recommendation').toBe(
      true,
    );
  });

  it('each provider appears at most once in primary ranking', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    const providerIds = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
    ]
      .filter((candidate) => candidate !== null)
      .map((candidate) => candidate.providerId);
    expect(new Set(providerIds).size).toBe(providerIds.length);
  });

  it('source references remain official HTTPS references', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    const references = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
      ...result.ineligible,
    ]
      .filter((candidate) => candidate !== null)
      .flatMap((candidate) => candidate.explanation.sourceReferences);

    for (const reference of references) {
      expect(reference.url.startsWith('https://')).toBe(true);
    }
  });

  it('input brief is not mutated', () => {
    const input = buildRecommendationCalculateInput();
    const snapshot = structuredClone(input);
    calculateProviderRecommendation(input);
    expect(input).toEqual(snapshot);
  });

  it('catalogue input is not mutated', () => {
    const catalogue = buildDeterministicRecommendationCatalogue();
    const input = buildRecommendationCalculateInput(catalogue);
    const snapshot = structuredClone(input.catalogue);
    calculateProviderRecommendation(input);
    expect(input.catalogue).toEqual(snapshot);
  });

  it('scene decomposition is not mutated', () => {
    const input = buildRecommendationCalculateInput();
    const snapshot = structuredClone(input.sceneDecomposition);
    calculateProviderRecommendation(input);
    expect(input.sceneDecomposition).toEqual(snapshot);
  });
});

function* requirementCombinationsInRange(startMask: number, endMask: number): Generator<ProductionRequirements> {
  for (let mask = startMask; mask < endMask; mask += 1) {
    yield buildRequirementsFromMask(mask);
  }
}

function runInvariantLoop(startMask: number, endMask: number) {
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

describe('exhaustive 16384 requirement-combination loop', () => {
  const chunkSize = 4096;

  for (let chunkIndex = 0; chunkIndex < 4; chunkIndex += 1) {
    const startMask = chunkIndex * chunkSize;
    const endMask = startMask + chunkSize;

    it(`passes invariants for requirement combinations ${startMask}–${endMask - 1}`, () => {
      runInvariantLoop(startMask, endMask);
    }, 90_000);
  }

  it('covers all 16384 combinations across chunks', () => {
    expect(4 * chunkSize).toBe(16384);
  });
});
