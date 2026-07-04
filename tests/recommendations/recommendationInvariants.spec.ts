import { describe, expect, it } from 'vitest';
import { calculateProviderRecommendation } from '../../src/domain/providerRecommendationEngine.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import { buildDeterministicRecommendationCatalogue, buildRecommendationCalculateInput } from './catalogueFixtures.js';
import {
  RECOMMENDATION_COMBINATION_CHUNK_COUNT,
  RECOMMENDATION_COMBINATION_CHUNK_SIZE,
  RECOMMENDATION_COMBINATION_COUNT,
} from './recommendationInvariantLoop.js';

describe('recommendation invariants', () => {  it('output remains deterministic for identical inputs', () => {
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

  it('16384 requirement combinations are covered across chunked suite files', () => {
    expect(RECOMMENDATION_COMBINATION_CHUNK_COUNT * RECOMMENDATION_COMBINATION_CHUNK_SIZE).toBe(
      RECOMMENDATION_COMBINATION_COUNT,
    );
  });
});
