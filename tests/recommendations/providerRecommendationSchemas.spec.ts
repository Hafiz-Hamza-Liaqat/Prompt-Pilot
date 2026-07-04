import { describe, expect, it } from 'vitest';
import {
  PROVIDER_RECOMMENDATION_ALGORITHM_VERSION,
  PROVIDER_RECOMMENDATION_ORIGIN,
  ProviderRecommendationResultSchema,
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

function minimalResult() {
  return calculateProviderRecommendation(buildRecommendationCalculateInput());
}

describe('provider recommendation schema and metadata', () => {
  it('1. algorithm version is exactly provider-recommendation-v1', () => {
    const result = minimalResult();
    expect(result.algorithmVersion).toBe(PROVIDER_RECOMMENDATION_ALGORITHM_VERSION);
    expect(PROVIDER_RECOMMENDATION_ALGORITHM_VERSION).toBe('provider-recommendation-v1');
  });

  it('2. origin is deterministic_evidence_engine', () => {
    const result = minimalResult();
    expect(result.origin).toBe(PROVIDER_RECOMMENDATION_ORIGIN);
    expect(PROVIDER_RECOMMENDATION_ORIGIN).toBe('deterministic_evidence_engine');
  });

  it('3. isAiGenerated must be false', () => {
    const result = minimalResult();
    expect(result.isAiGenerated).toBe(false);
    expect(() =>
      ProviderRecommendationResultSchema.parse({ ...result, isAiGenerated: true }),
    ).toThrow();
  });

  it('4. isPersisted must be false', () => {
    const result = minimalResult();
    expect(result.isPersisted).toBe(false);
    expect(() =>
      ProviderRecommendationResultSchema.parse({ ...result, isPersisted: true }),
    ).toThrow();
  });

  it('5. recommendation status enum is exact', () => {
    const result = minimalResult();
    expect([
      'recommended',
      'close_alternatives',
      'insufficient_evidence',
      'no_eligible_candidate',
    ]).toContain(result.recommendationStatus);
  });

  it('6. candidate tier enum is exact', () => {
    const result = minimalResult();
    const tiers = new Set<string>();
    if (result.primaryRecommendation) {
      tiers.add(result.primaryRecommendation.tier);
    }
    for (const candidate of [
      ...result.leadingAlternatives,
      ...result.alternatives,
      ...result.supportingServices,
      ...result.insufficientEvidence,
      ...result.ineligible,
    ]) {
      tiers.add(candidate.tier);
    }
    for (const tier of tiers) {
      expect([
        'primary_recommendation',
        'leading_alternative',
        'alternative',
        'supporting_service',
        'insufficient_evidence',
        'ineligible',
      ]).toContain(tier);
    }
  });

  it('7. fit and coverage scores stay within 0–100', () => {
    const result = minimalResult();
    const candidates = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
      ...result.insufficientEvidence,
      ...result.ineligible,
    ].filter((candidate) => candidate !== null);

    for (const candidate of candidates) {
      expect(candidate.evidenceBackedFitScore).toBeGreaterThanOrEqual(0);
      expect(candidate.evidenceBackedFitScore).toBeLessThanOrEqual(100);
      expect(candidate.evidenceCoverageScore).toBeGreaterThanOrEqual(0);
      expect(candidate.evidenceCoverageScore).toBeLessThanOrEqual(100);
    }
  });

  it('8. strict schema rejects extra top-level fields', () => {
    const result = minimalResult();
    expect(() =>
      ProviderRecommendationResultSchema.parse({ ...result, extraField: true }),
    ).toThrow();
  });

  it('9. requested needs are validated', () => {
    const result = minimalResult();
    expect(result.requestedNeeds.length).toBeGreaterThanOrEqual(3);
    expect(result.requestedNeeds[0]?.key).toBe('primary_text_to_video');
  });

  it('10. catalogue freshness summary is present', () => {
    const result = minimalResult();
    expect(result.catalogueFreshness.referenceVerifiedAt).toBeTruthy();
    expect(result.catalogueFreshness.overdueOfferingCount).toBeGreaterThanOrEqual(0);
    expect(result.catalogueFreshness.dueSoonOfferingCount).toBeGreaterThanOrEqual(0);
  });

  it('11. prohibited output keys are absent from result', () => {
    const result = minimalResult();
    for (const key of PROHIBITED_OUTPUT_KEYS) {
      expect(result).not.toHaveProperty(key);
    }
  });

  it('12. prohibited keys are absent from serialized candidates', () => {
    const result = minimalResult();
    const serialized = JSON.stringify(result).toLowerCase();
    expect(serialized).not.toContain('successprobability');
    expect(serialized).not.toContain('failureprobability');
    expect(serialized).not.toContain('qualityscore');
    expect(serialized).not.toContain('priceestimate');
  });

  it('13. source references use HTTPS URLs', () => {
    const result = minimalResult();
    const candidates = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
    ].filter((candidate) => candidate !== null);

    for (const candidate of candidates) {
      for (const reference of candidate.explanation.sourceReferences) {
        expect(reference.url.startsWith('https://')).toBe(true);
      }
    }
  });

  it('14. empty production requirements still parse', () => {
    const result = calculateProviderRecommendation(
      buildRecommendationCalculateInput(undefined, {
        brief: { productionRequirements: createDefaultProductionRequirements() },
      }),
    );
    expect(() => ProviderRecommendationResultSchema.parse(result)).not.toThrow();
  });
});
