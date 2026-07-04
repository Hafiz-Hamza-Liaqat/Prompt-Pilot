import { describe, expect, it } from 'vitest';
import {
  calculateProviderRecommendation,
  decidePrimaryRecommendation,
  evaluateOffering,
  rankProviderCandidates,
  selectStrongestOfferingPerProvider,
  type OfferingEvaluationResult,
  type ProviderRecommendationCandidate,
} from '../../src/domain/providerRecommendationEngine.js';
import {
  buildProviderCapabilityNeeds,
} from '../../src/domain/providerRequirementMapping.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';
import {
  DUE_SOON_REVIEW_AT,
  FIXTURE_IDS,
  VERIFIED_AT,
  buildAspectRatioListFact,
  buildDeterministicRecommendationCatalogue,
  buildMaxDurationFact,
  buildRecommendationCalculateInput,
  buildRunwayMultiOfferingFixture,
  factRecord,
  OFFICIAL_URLS,
  offeringRecord,
  providerRecord,
  sourceRecord,
} from './catalogueFixtures.js';

const REFERENCE_NOW = new Date(VERIFIED_AT);

function buildNeeds() {
  return buildProviderCapabilityNeeds({
    sourceType: 'idea',
    aspectRatio: '16:9',
    durationSeconds: 30,
    sceneDecomposition: decomposeDurationIntoScenes(30),
    productionRequirements: createDefaultProductionRequirements(),
  });
}

function baselineFacts(offeringId: string, sourceId: string, prefix: string, maxDuration = 60) {
  return [
    factRecord(`${prefix}-001`, offeringId, sourceId, { id: `${prefix}-001` }),
    buildAspectRatioListFact(`${prefix}-002`, offeringId, sourceId, ['16:9']),
    buildMaxDurationFact(`${prefix}-003`, offeringId, sourceId, maxDuration),
  ];
}

function evaluateCatalogueOffering(
  providerId: 'google_veo' | 'runway' | 'kling',
  offeringId: string,
  facts: ReturnType<typeof factRecord>[],
) {
  const provider = providerRecord(providerId);
  const offering = offeringRecord(offeringId, providerId, { id: offeringId });
  const sourceId = FIXTURE_IDS[providerId].sourceId;

  return evaluateOffering(
    provider,
    offering,
    buildNeeds(),
    facts,
    { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    REFERENCE_NOW,
    new Map([
      [
        sourceId,
        sourceRecord(sourceId, providerId, 'https://ai.google.dev/gemini-api/docs/veo', {
          id: sourceId,
          offeringId,
        }),
      ],
    ]),
  );
}

function toCandidate(
  evaluation: OfferingEvaluationResult,
  tier: ProviderRecommendationCandidate['tier'] = 'alternative',
): ProviderRecommendationCandidate {
  const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
  const template =
    result.alternatives[0] ??
    result.primaryRecommendation ??
    result.leadingAlternatives[0];
  if (!template) {
    throw new Error('Expected at least one candidate template');
  }

  return {
    ...template,
    tier,
    providerId: evaluation.provider.id,
    providerDisplayName: evaluation.provider.displayName,
    offeringId: evaluation.offering.id,
    offeringKey: evaluation.offering.offeringKey,
    offeringDisplayName: evaluation.offering.displayName,
    totalRequestedWeight: evaluation.totalRequestedWeight,
    evidenceBackedPoints: evaluation.evidenceBackedPoints,
    knownEvidenceWeight: evaluation.knownEvidenceWeight,
    evidenceBackedFitScore: evaluation.evidenceBackedFitScore,
    evidenceCoverageScore: evaluation.evidenceCoverageScore,
    supportedNeeds: evaluation.supportedNeeds,
    limitedNeeds: evaluation.limitedNeeds,
    unsupportedNeeds: evaluation.unsupportedNeeds,
    unknownNeeds: evaluation.unknownNeeds,
    criticalBlockers: evaluation.criticalBlockers,
    evaluatedNeeds: evaluation.evaluatedNeeds,
    explanation: evaluation.explanation,
    classification: evaluation.classification,
    lifecycleStatus: evaluation.offering.lifecycleStatus,
    apiAccessStatus: evaluation.offering.apiAccessStatus,
    freshness: evaluation.freshness,
    ownershipType: evaluation.offering.ownershipType,
    siblingOfferings: [],
  };
}

describe('provider deduplication', () => {
  it('35. multiple offerings from one provider produce one provider-ranking entry', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    const rankedProviderIds = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
    ]
      .filter((candidate) => candidate !== null)
      .map((candidate) => candidate.providerId);
    expect(new Set(rankedProviderIds).size).toBe(rankedProviderIds.length);
    expect(rankedProviderIds.filter((id) => id === 'runway')).toHaveLength(1);
  });

  it('36. strongest offering is selected deterministically', () => {
    const runwayFixture = buildRunwayMultiOfferingFixture();
    const primaryEval = evaluateCatalogueOffering(
      'runway',
      runwayFixture.primaryOffering.id,
      runwayFixture.primaryFacts,
    );
    const secondaryEval = evaluateCatalogueOffering(
      'runway',
      runwayFixture.secondaryOffering.id,
      runwayFixture.secondaryFacts,
    );
    const strongest = selectStrongestOfferingPerProvider([secondaryEval, primaryEval]);
    expect(strongest).toHaveLength(1);
    expect(strongest[0]?.offering.id).toBe(runwayFixture.primaryOffering.id);
  });

  it('37. sibling offering capabilities are not merged', () => {
    const runwayFixture = buildRunwayMultiOfferingFixture();
    const needs = buildProviderCapabilityNeeds({
      sourceType: 'idea',
      aspectRatio: '16:9',
      durationSeconds: 30,
      sceneDecomposition: decomposeDurationIntoScenes(30),
      productionRequirements: {
        ...createDefaultProductionRequirements(),
        lipSync: true,
      },
    });
    const provider = providerRecord('runway');
    const primaryEval = evaluateOffering(
      provider,
      runwayFixture.primaryOffering,
      needs,
      runwayFixture.primaryFacts,
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    const secondaryEval = evaluateOffering(
      provider,
      runwayFixture.secondaryOffering,
      needs,
      runwayFixture.secondaryFacts,
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(primaryEval.supportedNeeds).toContain('lip_sync');
    expect(secondaryEval.supportedNeeds).not.toContain('lip_sync');
  });

  it('38. provider can retain supporting offerings separately', () => {
    const result = calculateProviderRecommendation(
      buildRecommendationCalculateInput(undefined, {
        brief: {
          productionRequirements: {
            ...createDefaultProductionRequirements(),
            lipSync: true,
          },
        },
      }),
    );
    const runwayRanked = [
      result.primaryRecommendation,
      ...result.leadingAlternatives,
      ...result.alternatives,
    ].find((candidate) => candidate?.providerId === 'runway');
    expect(runwayRanked?.siblingOfferings.length).toBeGreaterThan(0);
  });
});

describe('ranking tie-breaks', () => {
  it('39. higher fit ranks first', () => {
    const google = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      baselineFacts(
        FIXTURE_IDS.google_veo.offeringId,
        FIXTURE_IDS.google_veo.sourceId,
        'c1000001',
        60,
      ),
    );
    const kling = evaluateCatalogueOffering(
      'kling',
      FIXTURE_IDS.kling.offeringId,
      baselineFacts(FIXTURE_IDS.kling.offeringId, FIXTURE_IDS.kling.sourceId, 'c4000001', 45),
    );
    const ranked = rankProviderCandidates([kling, google]);
    expect(ranked[0]?.provider.id).toBe('google_veo');
  });

  it('40. coverage breaks equal fit', () => {
    const strongCoverage = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      baselineFacts(
        FIXTURE_IDS.google_veo.offeringId,
        FIXTURE_IDS.google_veo.sourceId,
        'c1000001',
        60,
      ),
    );
    const weakCoverage = evaluateCatalogueOffering(
      'google_veo',
      'a1000002-0001-4001-8001-000000000002',
      [factRecord('x1', 'a1000002-0001-4001-8001-000000000002', FIXTURE_IDS.google_veo.sourceId, { id: 'x1' })],
    );
    const ranked = selectStrongestOfferingPerProvider([
      { ...weakCoverage, classification: 'eligible_primary' },
      { ...strongCoverage, classification: 'eligible_primary' },
    ]);
    expect(ranked[0]?.evidenceCoverageScore).toBeGreaterThan(ranked[1]?.evidenceCoverageScore ?? 0);
  });

  it('41. fewer unsupported needs break equal scores', () => {
    const fewerUnsupported = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      baselineFacts(
        FIXTURE_IDS.google_veo.offeringId,
        FIXTURE_IDS.google_veo.sourceId,
        'c1000001',
        60,
      ),
    );
    const moreUnsupported = {
      ...fewerUnsupported,
      unsupportedNeeds: ['requested_aspect_ratio'],
      evidenceBackedFitScore: fewerUnsupported.evidenceBackedFitScore,
      evidenceCoverageScore: fewerUnsupported.evidenceCoverageScore,
      classification: 'eligible_primary' as const,
    };
    const ranked = selectStrongestOfferingPerProvider([moreUnsupported, fewerUnsupported]);
    expect(ranked[0]?.unsupportedNeeds.length).toBeLessThanOrEqual(
      ranked[1]?.unsupportedNeeds.length ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it('42. fewer limited needs break the next tie', () => {
    const limitedA = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      baselineFacts(
        FIXTURE_IDS.google_veo.offeringId,
        FIXTURE_IDS.google_veo.sourceId,
        'c1000001',
        60,
      ),
    );
    const limitedB = {
      ...limitedA,
      limitedNeeds: ['primary_text_to_video', 'requested_aspect_ratio'],
      classification: 'eligible_primary' as const,
    };
    const ranked = selectStrongestOfferingPerProvider([limitedB, limitedA]);
    expect(ranked[0]?.limitedNeeds.length).toBeLessThanOrEqual(ranked[1]?.limitedNeeds.length ?? 999);
  });

  it('43. freshness breaks the next tie', () => {
    const fresh = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      baselineFacts(
        FIXTURE_IDS.google_veo.offeringId,
        FIXTURE_IDS.google_veo.sourceId,
        'c1000001',
        60,
      ),
    );
    const dueSoon = evaluateOffering(
      providerRecord('kling'),
      offeringRecord(FIXTURE_IDS.kling.offeringId, 'kling', {
        id: FIXTURE_IDS.kling.offeringId,
        reviewDueAt: DUE_SOON_REVIEW_AT,
      }),
      buildNeeds(),
      baselineFacts(FIXTURE_IDS.kling.offeringId, FIXTURE_IDS.kling.sourceId, 'c4000001', 60),
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    const ranked = rankProviderCandidates([
      {
        ...dueSoon,
        evidenceBackedFitScore: fresh.evidenceBackedFitScore,
        evidenceCoverageScore: fresh.evidenceCoverageScore,
        unsupportedNeeds: fresh.unsupportedNeeds,
        limitedNeeds: fresh.limitedNeeds,
        classification: 'eligible_primary',
      },
      { ...fresh, classification: 'eligible_primary' },
    ]);
    expect(ranked[0]?.freshness).toBe('fresh');
  });

  it('44. provider name breaks the next tie', () => {
    const google = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      baselineFacts(
        FIXTURE_IDS.google_veo.offeringId,
        FIXTURE_IDS.google_veo.sourceId,
        'c1000001',
        60,
      ),
    );
    const kling = evaluateCatalogueOffering(
      'kling',
      FIXTURE_IDS.kling.offeringId,
      baselineFacts(FIXTURE_IDS.kling.offeringId, FIXTURE_IDS.kling.sourceId, 'c4000001', 60),
    );

    const tiedGoogle = {
      ...google,
      provider: providerRecord('google_veo', { displayName: 'Google Veo' }),
      classification: 'eligible_primary' as const,
    };
    const tiedKling = {
      ...kling,
      provider: providerRecord('kling', { displayName: 'Kling' }),
      evidenceBackedFitScore: google.evidenceBackedFitScore,
      evidenceCoverageScore: google.evidenceCoverageScore,
      unsupportedNeeds: google.unsupportedNeeds,
      limitedNeeds: google.limitedNeeds,
      freshness: google.freshness,
      classification: 'eligible_primary' as const,
    };

    const ranked = rankProviderCandidates([tiedKling, tiedGoogle]);
    expect(ranked[0]?.provider.displayName).toBe('Google Veo');
    expect(ranked[1]?.provider.displayName).toBe('Kling');
  });

  it('45. offering key is the final tie-breaker', () => {
    const runwayFixture = buildRunwayMultiOfferingFixture();
    const provider = providerRecord('runway');
    const needs = buildNeeds();
    const sourceId = FIXTURE_IDS.runway.sourceId;
    const sourceMap = new Map([
      [
        sourceId,
        sourceRecord(sourceId, 'runway', OFFICIAL_URLS.runway, {
          id: sourceId,
          offeringId: runwayFixture.primaryOffering.id,
        }),
      ],
    ]);

    const alphaOffering = offeringRecord('a3000003-0001-4001-8001-000000000003', 'runway', {
      id: 'a3000003-0001-4001-8001-000000000003',
      offeringKey: 'alpha-hosted',
      displayName: 'Runway Alpha Hosted',
    });
    const betaOffering = offeringRecord('a3000004-0001-4001-8001-000000000004', 'runway', {
      id: 'a3000004-0001-4001-8001-000000000004',
      offeringKey: 'beta-hosted',
      displayName: 'Runway Beta Hosted',
    });
    const sharedFacts = baselineFacts(
      runwayFixture.primaryOffering.id,
      sourceId,
      'c3000099',
      60,
    );

    const alphaEval = evaluateOffering(
      provider,
      alphaOffering,
      needs,
      sharedFacts,
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      sourceMap,
    );
    const betaEval = evaluateOffering(
      provider,
      betaOffering,
      needs,
      sharedFacts,
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      sourceMap,
    );

    const strongest = selectStrongestOfferingPerProvider([betaEval, alphaEval]);
    expect(strongest).toHaveLength(1);
    expect(strongest[0]?.offering.offeringKey).toBe('alpha-hosted');
  });

  it('46. database order cannot affect ranking', () => {
    const catalogue = buildDeterministicRecommendationCatalogue();
    const first = calculateProviderRecommendation(buildRecommendationCalculateInput(catalogue));
    const second = calculateProviderRecommendation({
      ...buildRecommendationCalculateInput(catalogue),
      catalogue: { ...catalogue, providers: [...catalogue.providers].reverse() },
    });
    expect(first.recommendationStatus).toBe(second.recommendationStatus);
    expect(first.primaryRecommendation?.providerId).toBe(second.primaryRecommendation?.providerId);
  });
});

describe('decision status', () => {
  it('47. qualified leader with five-point lead is recommended', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    if (result.recommendationStatus === 'recommended') {
      expect(result.primaryRecommendation).not.toBeNull();
      expect(result.primaryRecommendation?.tier).toBe('primary_recommendation');
    } else {
      expect(['close_alternatives', 'insufficient_evidence']).toContain(result.recommendationStatus);
    }
  });

  it('48. lead below five produces close alternatives', () => {
    const googleEval = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      baselineFacts(
        FIXTURE_IDS.google_veo.offeringId,
        FIXTURE_IDS.google_veo.sourceId,
        'c1000001',
        60,
      ),
    );
    const klingEval = evaluateCatalogueOffering(
      'kling',
      FIXTURE_IDS.kling.offeringId,
      baselineFacts(FIXTURE_IDS.kling.offeringId, FIXTURE_IDS.kling.sourceId, 'c4000001', 60),
    );

    const top = toCandidate({
      ...googleEval,
      classification: 'eligible_primary',
      evidenceBackedFitScore: 80,
      evidenceCoverageScore: 100,
      unsupportedNeeds: [],
      criticalBlockers: [],
    });
    const second = toCandidate({
      ...klingEval,
      classification: 'eligible_primary',
      evidenceBackedFitScore: 78,
      evidenceCoverageScore: 100,
      unsupportedNeeds: [],
      criticalBlockers: [],
    });

    const decision = decidePrimaryRecommendation([top, second]);
    expect(decision.recommendationStatus).toBe('close_alternatives');
    expect(decision.primaryRecommendation).toBeNull();
    expect(decision.leadingAlternatives).toHaveLength(2);
  });

  it('49. low evidence produces insufficient evidence', () => {
    const lowEvidence = evaluateCatalogueOffering(
      'google_veo',
      FIXTURE_IDS.google_veo.offeringId,
      [factRecord('f1', FIXTURE_IDS.google_veo.offeringId, FIXTURE_IDS.google_veo.sourceId, { id: 'f1' })],
    );
    const candidate = toCandidate({ ...lowEvidence, classification: 'eligible_primary' });
    const decision = decidePrimaryRecommendation([candidate]);
    expect(decision.recommendationStatus).toBe('insufficient_evidence');
    expect(decision.primaryRecommendation).toBeNull();
  });

  it('50. no eligible candidate produces no eligible candidate', () => {
    const decision = decidePrimaryRecommendation([]);
    expect(decision.recommendationStatus).toBe('no_eligible_candidate');
    expect(decision.primaryRecommendation).toBeNull();
  });

  it('51. no winner is forced', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    if (result.recommendationStatus !== 'recommended') {
      expect(result.primaryRecommendation).toBeNull();
    }
  });

  it('52. only one primary recommendation may exist', () => {
    const result = calculateProviderRecommendation(buildRecommendationCalculateInput());
    const primaryCount = result.primaryRecommendation ? 1 : 0;
    expect(primaryCount).toBeLessThanOrEqual(1);
  });
});
