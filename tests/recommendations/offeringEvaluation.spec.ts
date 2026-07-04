import { describe, expect, it } from 'vitest';
import {
  classifyOffering,
  evaluateCapabilityNeed,
  evaluateOffering,
  supportLevelToPoints,
} from '../../src/domain/providerRecommendationEngine.js';
import { buildProviderCapabilityNeeds } from '../../src/domain/providerRequirementMapping.js';
import { createDefaultProductionRequirements } from '../../src/domain/productionRequirements.js';
import { decomposeDurationIntoScenes } from '../../src/domain/sceneDecomposition.js';
import {
  OVERDUE_REVIEW_AT,
  VERIFIED_AT,
  buildAspectRatioListFact,
  buildMaxDurationFact,
  factRecord,
  offeringRecord,
  providerRecord,
  sourceRecord,
} from './catalogueFixtures.js';

const REFERENCE_NOW = new Date(VERIFIED_AT);
const OFFERING_ID = 'a1000001-0001-4001-8001-000000000001';
const SOURCE_ID = 'b1000001-0001-4001-8001-000000000001';

function buildNeeds(requirementOverrides: Partial<ReturnType<typeof createDefaultProductionRequirements>> = {}) {
  return buildProviderCapabilityNeeds({
    sourceType: 'idea',
    aspectRatio: '16:9',
    durationSeconds: 30,
    sceneDecomposition: decomposeDurationIntoScenes(30),
    productionRequirements: {
      ...createDefaultProductionRequirements(),
      ...requirementOverrides,
    },
  });
}

function evaluateWithFacts(
  facts: Parameters<typeof evaluateOffering>[3],
  requirementOverrides: Partial<ReturnType<typeof createDefaultProductionRequirements>> = {},
) {
  const needs = buildNeeds(requirementOverrides);
  const provider = providerRecord('google_veo');
  const offering = offeringRecord(OFFERING_ID, 'google_veo', { id: OFFERING_ID });
  const sourcesById = new Map([
    [
      SOURCE_ID,
      sourceRecord(SOURCE_ID, 'google_veo', 'https://ai.google.dev/gemini-api/docs/veo', {
        id: SOURCE_ID,
        offeringId: OFFERING_ID,
      }),
    ],
  ]);

  return evaluateOffering(
    provider,
    offering,
    needs,
    facts,
    { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    REFERENCE_NOW,
    sourcesById,
  );
}

describe('support semantics', () => {
  it('1. supported earns full weight', () => {
    expect(supportLevelToPoints(10, 'supported')).toBe(10);
    const evaluated = evaluateCapabilityNeed(
      buildNeeds()[0]!,
      [factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' })],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.evidenceBackedPoints).toBe(20);
    expect(evaluated.knownEvidenceWeight).toBe(20);
  });

  it('2. limited earns floor of 60%', () => {
    expect(supportLevelToPoints(10, 'limited')).toBe(6);
    const evaluated = evaluateCapabilityNeed(
      buildNeeds()[0]!,
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, {
          id: 'f1',
          supportLevel: 'limited',
          limitationSummary: 'Limited workflow availability.',
        }),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.evidenceBackedPoints).toBe(12);
    expect(evaluated.knownEvidenceWeight).toBe(20);
  });

  it('3. unsupported earns zero', () => {
    expect(supportLevelToPoints(10, 'unsupported')).toBe(0);
    const evaluated = evaluateCapabilityNeed(
      buildNeeds()[0]!,
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, {
          id: 'f1',
          supportLevel: 'unsupported',
          evidenceSummary: 'Official documentation states text-to-video is unavailable.',
        }),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.evidenceBackedPoints).toBe(0);
    expect(evaluated.supportLevel).toBe('unsupported');
  });

  it('4. unknown earns zero evidence-backed points', () => {
    expect(supportLevelToPoints(10, 'unknown')).toBe(0);
    const evaluated = evaluateCapabilityNeed(
      buildNeeds()[0]!,
      [],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.evidenceBackedPoints).toBe(0);
    expect(evaluated.knownEvidenceWeight).toBe(0);
  });

  it('5. unknown remains distinct from unsupported', () => {
    const unknown = evaluateCapabilityNeed(buildNeeds()[0]!, [], {
      aspectRatio: '16:9',
      maximumSceneDurationSeconds: 12,
    });
    const unsupported = evaluateCapabilityNeed(
      buildNeeds()[0]!,
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, {
          id: 'f1',
          supportLevel: 'unsupported',
        }),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(unknown.supportLevel).toBe('unknown');
    expect(unsupported.supportLevel).toBe('unsupported');
    expect(unknown.knownEvidenceWeight).toBe(0);
    expect(unsupported.knownEvidenceWeight).toBe(20);
  });

  it('6. limited preserves limitation text', () => {
    const evaluation = evaluateWithFacts([
      factRecord('f1', OFFERING_ID, SOURCE_ID, {
        id: 'f1',
        supportLevel: 'limited',
        limitationSummary: 'Limited to preview workflows.',
      }),
      buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
      buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
    ]);
    expect(evaluation.explanation.limitations.some((item) => item.includes('Limited to preview'))).toBe(
      true,
    );
  });

  it('7. unsupported preserves evidence', () => {
    const evaluation = evaluateWithFacts([
      factRecord('f1', OFFERING_ID, SOURCE_ID, {
        id: 'f1',
        supportLevel: 'unsupported',
        evidenceSummary: 'Official documentation excludes text-to-video.',
      }),
      buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
      buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
    ]);
    expect(evaluation.explanation.limitations.some((item) => item.includes('excludes text-to-video'))).toBe(
      true,
    );
  });

  it('8. missing fact becomes unknown', () => {
    const evaluation = evaluateWithFacts([]);
    expect(evaluation.unknownNeeds).toContain('primary_text_to_video');
    expect(evaluation.unsupportedNeeds).not.toContain('primary_text_to_video');
  });

  it('9. source references are deduplicated', () => {
    const evaluation = evaluateWithFacts([
      factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' }),
      buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
      buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
    ]);
    const sourceIds = evaluation.explanation.sourceReferences.map((reference) => reference.sourceId);
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
  });
});

describe('structured facts', () => {
  it('10. requested aspect ratio is recognized', () => {
    const needs = buildNeeds();
    const aspectNeed = needs.find((need) => need.key === 'requested_aspect_ratio')!;
    const evaluated = evaluateCapabilityNeed(
      aspectNeed,
      [buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9', '9:16'])],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.supportLevel).toBe('supported');
  });

  it('11. non-exhaustive ratio evidence does not become unsupported', () => {
    const needs = buildNeeds();
    const aspectNeed = needs.find((need) => need.key === 'requested_aspect_ratio')!;
    const evaluated = evaluateCapabilityNeed(
      aspectNeed,
      [buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['9:16'])],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.supportLevel).toBe('unknown');
    expect(evaluated.supportLevel).not.toBe('unsupported');
  });

  it('12. maximum scene duration within limit passes', () => {
    const needs = buildNeeds();
    const durationNeed = needs.find((need) => need.key === 'maximum_scene_duration')!;
    const evaluated = evaluateCapabilityNeed(
      durationNeed,
      [buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60)],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.supportLevel).toBe('supported');
  });

  it('13. maximum scene duration above limit is unsupported', () => {
    const needs = buildNeeds();
    const durationNeed = needs.find((need) => need.key === 'maximum_scene_duration')!;
    const evaluated = evaluateCapabilityNeed(
      durationNeed,
      [buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 5)],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(evaluated.supportLevel).toBe('unsupported');
  });

  it('14. missing duration limit is unknown', () => {
    const needs = buildNeeds();
    const durationNeed = needs.find((need) => need.key === 'maximum_scene_duration')!;
    const evaluated = evaluateCapabilityNeed(durationNeed, [], {
      aspectRatio: '16:9',
      maximumSceneDurationSeconds: 12,
    });
    expect(evaluated.supportLevel).toBe('unknown');
  });

  it('15. numeric and list facts are not treated as booleans', () => {
    const needs = buildNeeds();
    const aspectNeed = needs.find((need) => need.key === 'requested_aspect_ratio')!;
    const durationNeed = needs.find((need) => need.key === 'maximum_scene_duration')!;
    const aspectEvaluated = evaluateCapabilityNeed(
      aspectNeed,
      [
        factRecord('f2', OFFERING_ID, SOURCE_ID, {
          id: 'f2',
          capabilityKey: 'supported_aspect_ratios',
          supportLevel: 'supported',
          structuredValue: ['16:9'],
        }),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    const durationEvaluated = evaluateCapabilityNeed(
      durationNeed,
      [
        factRecord('f3', OFFERING_ID, SOURCE_ID, {
          id: 'f3',
          capabilityKey: 'max_duration_seconds',
          supportLevel: 'supported',
          numericValue: 60,
        }),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
    );
    expect(aspectEvaluated.supportLevel).toBe('supported');
    expect(durationEvaluated.supportLevel).toBe('supported');
  });
});

describe('eligibility', () => {
  it('16. provider ineligibility excludes offering', () => {
    const evaluation = evaluateOffering(
      providerRecord('google_veo', { recommendationEligible: false }),
      offeringRecord(OFFERING_ID, 'google_veo', { id: OFFERING_ID }),
      buildNeeds(),
      [factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' })],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(evaluation.classification).toBe('ineligible');
    expect(evaluation.explanation.eligibilityReasons.length).toBeGreaterThan(0);
  });

  it('17. offering ineligibility excludes offering', () => {
    const evaluation = evaluateOffering(
      providerRecord('google_veo'),
      offeringRecord(OFFERING_ID, 'google_veo', {
        id: OFFERING_ID,
        recommendationEligible: false,
      }),
      buildNeeds(),
      [factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' })],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(evaluation.classification).toBe('ineligible');
  });

  it('18. sunsetting excludes normal recommendation', () => {
    const evaluation = evaluateOffering(
      providerRecord('openai_sora', {
        lifecycleStatus: 'sunsetting',
        apiAccessStatus: 'sunsetting',
        recommendationEligible: false,
      }),
      offeringRecord(OFFERING_ID, 'openai_sora', {
        id: OFFERING_ID,
        lifecycleStatus: 'sunsetting',
        apiAccessStatus: 'sunsetting',
        recommendationEligible: false,
      }),
      buildNeeds(),
      [factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' })],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(evaluation.classification).toBe('ineligible');
  });

  it('19. deprecated excludes normal recommendation', () => {
    const evaluation = evaluateOffering(
      providerRecord('runway'),
      offeringRecord(OFFERING_ID, 'runway', {
        id: OFFERING_ID,
        lifecycleStatus: 'deprecated',
        recommendationEligible: false,
      }),
      buildNeeds(),
      [factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' })],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(evaluation.classification).toBe('ineligible');
  });

  it('20. unavailable excludes normal recommendation', () => {
    const evaluation = evaluateOffering(
      providerRecord('runway', { lifecycleStatus: 'unavailable' }),
      offeringRecord(OFFERING_ID, 'runway', {
        id: OFFERING_ID,
        lifecycleStatus: 'unavailable',
      }),
      buildNeeds(),
      [factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' })],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(evaluation.classification).toBe('ineligible');
  });

  it('21. preview produces caution', () => {
    const evaluation = evaluateWithFacts(
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' }),
        buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
        buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
      ],
      {},
    );
    const previewEvaluation = evaluateOffering(
      providerRecord('google_veo', { lifecycleStatus: 'preview' }),
      offeringRecord(OFFERING_ID, 'google_veo', { id: OFFERING_ID, lifecycleStatus: 'preview' }),
      buildNeeds(),
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' }),
        buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
        buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(evaluation.explanation.cautions.length).toBeGreaterThanOrEqual(0);
    expect(
      previewEvaluation.explanation.cautions.some((item) => item.toLowerCase().includes('preview')),
    ).toBe(true);
  });

  it('22. limited access produces caution', () => {
    const evaluation = evaluateOffering(
      providerRecord('google_veo'),
      offeringRecord(OFFERING_ID, 'google_veo', {
        id: OFFERING_ID,
        apiAccessStatus: 'limited',
      }),
      buildNeeds(),
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' }),
        buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
        buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(
      evaluation.explanation.cautions.some((item) => item.toLowerCase().includes('limited')),
    ).toBe(true);
  });

  it('23. enterprise access produces caution', () => {
    const evaluation = evaluateOffering(
      providerRecord('google_veo', { apiAccessStatus: 'enterprise' }),
      offeringRecord(OFFERING_ID, 'google_veo', { id: OFFERING_ID }),
      buildNeeds(),
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' }),
        buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
        buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(
      evaluation.explanation.cautions.some((item) => item.toLowerCase().includes('enterprise')),
    ).toBe(true);
  });

  it('24. overdue evidence produces caution', () => {
    const evaluation = evaluateOffering(
      providerRecord('google_veo'),
      offeringRecord(OFFERING_ID, 'google_veo', {
        id: OFFERING_ID,
        reviewDueAt: OVERDUE_REVIEW_AT,
      }),
      buildNeeds(),
      [
        factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1', reviewDueAt: OVERDUE_REVIEW_AT }),
        buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
        buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
      ],
      { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 },
      REFERENCE_NOW,
      new Map(),
    );
    expect(
      evaluation.explanation.cautions.some((item) => item.toLowerCase().includes('overdue')),
    ).toBe(true);
  });

  it('25. unknown text-to-video becomes insufficient evidence', () => {
    const needs = buildNeeds();
    const needByKey = new Map(needs.map((need) => [need.key, need]));
    const evaluatedNeeds = needs.map((need) =>
      evaluateCapabilityNeed(need, [], { aspectRatio: '16:9', maximumSceneDurationSeconds: 12 }),
    );
    const classification = classifyOffering(
      providerRecord('google_veo'),
      offeringRecord(OFFERING_ID, 'google_veo', { id: OFFERING_ID }),
      evaluatedNeeds,
      needByKey,
      [],
    );
    expect(classification).toBe('insufficient_evidence');
  });

  it('26. unsupported text-to-video becomes critical blocker', () => {
    const evaluation = evaluateWithFacts([
      factRecord('f1', OFFERING_ID, SOURCE_ID, {
        id: 'f1',
        supportLevel: 'unsupported',
      }),
      buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
      buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
    ]);
    expect(evaluation.classification).toBe('critical_blocked');
    expect(evaluation.criticalBlockers.length).toBeGreaterThan(0);
  });
});

describe('scoring', () => {
  it('27. evidence-backed fit formula is exact', () => {
    const evaluation = evaluateWithFacts([
      factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' }),
      buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
      buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
    ]);
    const expected = Math.floor((evaluation.evidenceBackedPoints / evaluation.totalRequestedWeight) * 100);
    expect(evaluation.evidenceBackedFitScore).toBe(expected);
  });

  it('28. evidence-coverage formula is exact', () => {
    const evaluation = evaluateWithFacts([
      factRecord('f1', OFFERING_ID, SOURCE_ID, { id: 'f1' }),
      buildAspectRatioListFact('f2', OFFERING_ID, SOURCE_ID, ['16:9']),
      buildMaxDurationFact('f3', OFFERING_ID, SOURCE_ID, 60),
    ]);
    const expected = Math.floor((evaluation.knownEvidenceWeight / evaluation.totalRequestedWeight) * 100);
    expect(evaluation.evidenceCoverageScore).toBe(expected);
  });
});
