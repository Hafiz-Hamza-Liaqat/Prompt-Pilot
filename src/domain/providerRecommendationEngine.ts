import { z } from 'zod';
import { IsoDateTimeSchema, PercentageScoreSchema } from './common';
import type { AspectRatio } from './constants';
import {
  PRODUCTION_REQUIREMENT_TO_CATALOGUE_CAPABILITY,
  type CatalogueCapabilityFact,
  type CatalogueCapabilityKey,
  type CatalogueOffering,
  type CatalogueProvider,
  type CatalogueSource,
  type FreshnessState,
  type SupportLevel,
  getFreshnessState,
  isRecommendationEligibleLifecycle,
  HttpsOfficialUrlSchema,
} from './providerCatalogue';
import type { ProductionRequirements } from './productionRequirements';
import {
  buildProviderCapabilityNeeds,
  deriveMaximumSceneDurationFromDecomposition,
  type BuildProviderCapabilityNeedsInput,
  type ProviderCapabilityNeed,
  ProviderCapabilityNeedSchema,
  SUPPORTING_SERVICE_REQUIREMENT_KEYS,
  type SupportingServiceRequirementKey,
} from './providerRequirementMapping';
import type { SceneDecomposition } from './sceneDecomposition';

export const PROVIDER_RECOMMENDATION_ALGORITHM_VERSION = 'provider-recommendation-v1' as const;
export const PROVIDER_RECOMMENDATION_ORIGIN = 'deterministic_evidence_engine' as const;

export const RECOMMENDATION_STATUSES = [
  'recommended',
  'close_alternatives',
  'insufficient_evidence',
  'no_eligible_candidate',
] as const;

export const CANDIDATE_TIERS = [
  'primary_recommendation',
  'leading_alternative',
  'alternative',
  'supporting_service',
  'insufficient_evidence',
  'ineligible',
] as const;

export const OFFERING_CLASSIFICATIONS = [
  'ineligible',
  'critical_blocked',
  'insufficient_evidence',
  'eligible_primary',
] as const;

export const INSUFFICIENT_EVIDENCE_COVERAGE_THRESHOLD = 40 as const;
export const PRIMARY_RECOMMENDATION_MIN_FIT = 60 as const;
export const PRIMARY_RECOMMENDATION_MIN_COVERAGE = 60 as const;
export const PRIMARY_RECOMMENDATION_MIN_FIT_LEAD = 5 as const;

export const RecommendationStatusSchema = z.enum(RECOMMENDATION_STATUSES);
export const CandidateTierSchema = z.enum(CANDIDATE_TIERS);
export const OfferingClassificationSchema = z.enum(OFFERING_CLASSIFICATIONS);
export const NeedSupportLevelSchema = z.enum(['supported', 'limited', 'unsupported', 'unknown']);

export const RecommendationSourceReferenceSchema = z.object({
  sourceId: z.string().uuid(),
  title: z.string().trim().min(1),
  url: HttpsOfficialUrlSchema,
  verifiedAt: IsoDateTimeSchema,
});

export const EvaluatedNeedSchema = z.object({
  needKey: z.string().trim().min(1),
  capabilityKey: z.string().trim().min(1),
  importance: z.enum(['critical', 'required', 'preferred']),
  weight: z.number().int().positive(),
  supportLevel: NeedSupportLevelSchema,
  evidenceBackedPoints: z.number().int().min(0),
  knownEvidenceWeight: z.number().int().min(0),
  evidenceSummary: z.string().trim().min(1).nullable(),
  limitationSummary: z.string().trim().min(1).nullable(),
  sourceId: z.string().uuid().nullable(),
});

export const CandidateExplanationSchema = z.object({
  strengths: z.array(z.string().trim().min(1)),
  limitations: z.array(z.string().trim().min(1)),
  evidenceGaps: z.array(z.string().trim().min(1)),
  eligibilityReasons: z.array(z.string().trim().min(1)),
  cautions: z.array(z.string().trim().min(1)),
  sourceReferences: z.array(RecommendationSourceReferenceSchema),
});

export const ProviderRecommendationCandidateSchema = z.object({
  tier: CandidateTierSchema,
  classification: OfferingClassificationSchema,
  providerId: z.string().trim().min(1),
  providerDisplayName: z.string().trim().min(1),
  offeringId: z.string().uuid(),
  offeringKey: z.string().trim().min(1),
  offeringDisplayName: z.string().trim().min(1),
  ownershipType: z.enum(['first_party', 'third_party_hosted']),
  lifecycleStatus: z.string().trim().min(1),
  apiAccessStatus: z.string().trim().min(1),
  freshness: z.enum(['fresh', 'due_soon', 'overdue']),
  totalRequestedWeight: z.number().int().positive(),
  evidenceBackedPoints: z.number().int().min(0),
  knownEvidenceWeight: z.number().int().min(0),
  evidenceBackedFitScore: PercentageScoreSchema,
  evidenceCoverageScore: PercentageScoreSchema,
  supportedNeeds: z.array(z.string().trim().min(1)),
  limitedNeeds: z.array(z.string().trim().min(1)),
  unsupportedNeeds: z.array(z.string().trim().min(1)),
  unknownNeeds: z.array(z.string().trim().min(1)),
  criticalBlockers: z.array(z.string().trim().min(1)),
  evaluatedNeeds: z.array(EvaluatedNeedSchema),
  explanation: CandidateExplanationSchema,
  siblingOfferings: z.array(
    z.object({
      offeringId: z.string().uuid(),
      offeringKey: z.string().trim().min(1),
      offeringDisplayName: z.string().trim().min(1),
      classification: OfferingClassificationSchema,
    }),
  ),
});

export const SupportingServiceCandidateSchema = z.object({
  tier: z.literal('supporting_service'),
  providerId: z.string().trim().min(1),
  providerDisplayName: z.string().trim().min(1),
  offeringId: z.string().uuid(),
  offeringKey: z.string().trim().min(1),
  offeringDisplayName: z.string().trim().min(1),
  ownershipType: z.enum(['first_party', 'third_party_hosted']),
  lifecycleStatus: z.string().trim().min(1),
  apiAccessStatus: z.string().trim().min(1),
  freshness: z.enum(['fresh', 'due_soon', 'overdue']),
  supportedCapabilityKeys: z.array(z.string().trim().min(1)).min(1),
  relatedRequirementKeys: z.array(z.string().trim().min(1)).min(1),
  explanation: CandidateExplanationSchema,
});

export const CatalogueFreshnessSummarySchema = z.object({
  referenceVerifiedAt: IsoDateTimeSchema,
  overdueOfferingCount: z.number().int().min(0),
  dueSoonOfferingCount: z.number().int().min(0),
  warnings: z.array(z.string().trim().min(1)),
});

export const ProviderRecommendationResultSchema = z
  .object({
    algorithmVersion: z.literal(PROVIDER_RECOMMENDATION_ALGORITHM_VERSION),
    origin: z.literal(PROVIDER_RECOMMENDATION_ORIGIN),
    isAiGenerated: z.literal(false),
    isPersisted: z.literal(false),
    recommendationStatus: RecommendationStatusSchema,
    primaryRecommendation: ProviderRecommendationCandidateSchema.nullable(),
    leadingAlternatives: z.array(ProviderRecommendationCandidateSchema),
    alternatives: z.array(ProviderRecommendationCandidateSchema),
    supportingServices: z.array(SupportingServiceCandidateSchema),
    insufficientEvidence: z.array(ProviderRecommendationCandidateSchema),
    ineligible: z.array(ProviderRecommendationCandidateSchema),
    requestedNeeds: z.array(ProviderCapabilityNeedSchema),
    catalogueFreshness: CatalogueFreshnessSummarySchema,
  })
  .strict();

export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>;
export type CandidateTier = z.infer<typeof CandidateTierSchema>;
export type OfferingClassification = z.infer<typeof OfferingClassificationSchema>;
export type NeedSupportLevel = z.infer<typeof NeedSupportLevelSchema>;
export type RecommendationSourceReference = z.infer<typeof RecommendationSourceReferenceSchema>;
export type EvaluatedNeed = z.infer<typeof EvaluatedNeedSchema>;
export type CandidateExplanation = z.infer<typeof CandidateExplanationSchema>;
export type ProviderRecommendationCandidate = z.infer<typeof ProviderRecommendationCandidateSchema>;
export type SupportingServiceCandidate = z.infer<typeof SupportingServiceCandidateSchema>;
export type CatalogueFreshnessSummary = z.infer<typeof CatalogueFreshnessSummarySchema>;
export type ProviderRecommendationResult = z.infer<typeof ProviderRecommendationResultSchema>;

export type CapabilityEvaluationContext = {
  aspectRatio: AspectRatio;
  maximumSceneDurationSeconds: number;
};

export type ProviderRecommendationCatalogue = {
  providers: CatalogueProvider[];
  offerings: CatalogueOffering[];
  factsByOfferingId: Record<string, CatalogueCapabilityFact[]>;
  sourcesByProviderId: Record<string, CatalogueSource[]>;
};

export type CalculateProviderRecommendationInput = {
  brief: {
    sourceType: BuildProviderCapabilityNeedsInput['sourceType'];
    aspectRatio: AspectRatio;
    durationSeconds: number;
    productionRequirements: ProductionRequirements;
  };
  sceneDecomposition: SceneDecomposition;
  catalogue: ProviderRecommendationCatalogue;
};

export type OfferingEvaluationResult = {
  provider: CatalogueProvider;
  offering: CatalogueOffering;
  evaluatedNeeds: EvaluatedNeed[];
  totalRequestedWeight: number;
  evidenceBackedPoints: number;
  knownEvidenceWeight: number;
  evidenceBackedFitScore: number;
  evidenceCoverageScore: number;
  supportedNeeds: string[];
  limitedNeeds: string[];
  unsupportedNeeds: string[];
  unknownNeeds: string[];
  criticalBlockers: string[];
  cautions: string[];
  freshness: FreshnessState;
  classification: OfferingClassification;
  explanation: CandidateExplanation;
};

const FRESHNESS_RANK: Record<FreshnessState, number> = {
  fresh: 0,
  due_soon: 1,
  overdue: 2,
};

const INELIGIBLE_LIFECYCLE_STATUSES = new Set(['sunsetting', 'deprecated', 'unavailable']);
const INELIGIBLE_API_ACCESS_STATUSES = new Set(['sunsetting', 'unavailable']);

function limitedPoints(weight: number): number {
  return Math.floor(weight * 0.6);
}

function findFactForCapability(
  facts: CatalogueCapabilityFact[],
  capabilityKey: CatalogueCapabilityKey,
): CatalogueCapabilityFact | undefined {
  return facts.find((fact) => fact.capabilityKey === capabilityKey);
}

function resolveSupportPoints(weight: number, supportLevel: NeedSupportLevel): {
  evidenceBackedPoints: number;
  knownEvidenceWeight: number;
} {
  switch (supportLevel) {
    case 'supported':
      return { evidenceBackedPoints: weight, knownEvidenceWeight: weight };
    case 'limited':
      return { evidenceBackedPoints: limitedPoints(weight), knownEvidenceWeight: weight };
    case 'unsupported':
      return { evidenceBackedPoints: 0, knownEvidenceWeight: weight };
    case 'unknown':
      return { evidenceBackedPoints: 0, knownEvidenceWeight: 0 };
  }
}

function evaluateAspectRatioNeed(
  fact: CatalogueCapabilityFact | undefined,
  aspectRatio: AspectRatio,
): NeedSupportLevel {
  if (!fact) {
    return 'unknown';
  }

  if (fact.supportLevel === 'unsupported') {
    return 'unsupported';
  }

  if (fact.supportLevel === 'limited') {
    const structured = fact.structuredValue;
    if (Array.isArray(structured) && structured.includes(aspectRatio)) {
      return 'limited';
    }

    if (Array.isArray(structured) && !structured.includes(aspectRatio)) {
      return 'unknown';
    }

    return 'limited';
  }

  const structured = fact.structuredValue;
  if (Array.isArray(structured)) {
    return structured.includes(aspectRatio) ? 'supported' : 'unknown';
  }

  if (fact.supportLevel === 'supported') {
    return 'unknown';
  }

  return 'unknown';
}

function evaluateMaximumSceneDurationNeed(
  fact: CatalogueCapabilityFact | undefined,
  maximumSceneDurationSeconds: number,
): NeedSupportLevel {
  if (!fact) {
    return 'unknown';
  }

  if (fact.supportLevel === 'unsupported') {
    return 'unsupported';
  }

  if (fact.supportLevel === 'limited') {
    if (fact.numericValue === null) {
      return 'limited';
    }

    return fact.numericValue >= maximumSceneDurationSeconds ? 'limited' : 'unsupported';
  }

  if (fact.numericValue === null) {
    return 'unknown';
  }

  if (fact.numericValue >= maximumSceneDurationSeconds) {
    return 'supported';
  }

  return 'unsupported';
}

function evaluateBooleanCapabilityNeed(
  fact: CatalogueCapabilityFact | undefined,
): NeedSupportLevel {
  if (!fact) {
    return 'unknown';
  }

  return fact.supportLevel;
}

export function evaluateCapabilityNeed(
  need: ProviderCapabilityNeed,
  facts: CatalogueCapabilityFact[],
  context: CapabilityEvaluationContext,
): EvaluatedNeed {
  const fact = findFactForCapability(facts, need.capabilityKey);

  let supportLevel: NeedSupportLevel;

  if (need.key === 'requested_aspect_ratio') {
    supportLevel = evaluateAspectRatioNeed(fact, context.aspectRatio);
  } else if (need.key === 'maximum_scene_duration') {
    supportLevel = evaluateMaximumSceneDurationNeed(fact, context.maximumSceneDurationSeconds);
  } else {
    supportLevel = evaluateBooleanCapabilityNeed(fact);
  }

  const { evidenceBackedPoints, knownEvidenceWeight } = resolveSupportPoints(need.weight, supportLevel);

  return EvaluatedNeedSchema.parse({
    needKey: need.key,
    capabilityKey: need.capabilityKey,
    importance: need.importance,
    weight: need.weight,
    supportLevel,
    evidenceBackedPoints,
    knownEvidenceWeight,
    evidenceSummary: fact?.evidenceSummary ?? null,
    limitationSummary: fact?.limitationSummary ?? null,
    sourceId: fact?.sourceId ?? null,
  });
}

function isLifecycleEligible(status: string): boolean {
  return isRecommendationEligibleLifecycle(
    status as Parameters<typeof isRecommendationEligibleLifecycle>[0],
  );
}

function isApiAccessEligible(status: string): boolean {
  return !INELIGIBLE_API_ACCESS_STATUSES.has(status);
}

function collectEligibilityReasons(
  provider: CatalogueProvider,
  offering: CatalogueOffering,
): string[] {
  const reasons: string[] = [];

  if (!provider.recommendationEligible) {
    reasons.push('Provider is marked recommendation-ineligible in the catalogue.');
  }

  if (!offering.recommendationEligible) {
    reasons.push('Offering is marked recommendation-ineligible in the catalogue.');
  }

  if (INELIGIBLE_LIFECYCLE_STATUSES.has(provider.lifecycleStatus)) {
    reasons.push(`Provider lifecycle status is ${provider.lifecycleStatus}.`);
  }

  if (INELIGIBLE_LIFECYCLE_STATUSES.has(offering.lifecycleStatus)) {
    reasons.push(`Offering lifecycle status is ${offering.lifecycleStatus}.`);
  }

  if (INELIGIBLE_API_ACCESS_STATUSES.has(provider.apiAccessStatus)) {
    reasons.push(`Provider API access status is ${provider.apiAccessStatus}.`);
  }

  if (INELIGIBLE_API_ACCESS_STATUSES.has(offering.apiAccessStatus)) {
    reasons.push(`Offering API access status is ${offering.apiAccessStatus}.`);
  }

  return reasons;
}

function buildCautions(
  provider: CatalogueProvider,
  offering: CatalogueOffering,
  freshness: FreshnessState,
): string[] {
  const cautions: string[] = [];

  if (offering.lifecycleStatus === 'preview' || provider.lifecycleStatus === 'preview') {
    cautions.push('Catalogue evidence indicates preview lifecycle availability.');
  }

  if (offering.lifecycleStatus === 'limited' || provider.lifecycleStatus === 'limited') {
    cautions.push('Catalogue evidence indicates limited lifecycle availability.');
  }

  if (offering.apiAccessStatus === 'preview' || provider.apiAccessStatus === 'preview') {
    cautions.push('Catalogue evidence indicates preview API access.');
  }

  if (offering.apiAccessStatus === 'limited' || provider.apiAccessStatus === 'limited') {
    cautions.push('Catalogue evidence indicates limited API access.');
  }

  if (offering.apiAccessStatus === 'enterprise' || provider.apiAccessStatus === 'enterprise') {
    cautions.push('Catalogue evidence indicates enterprise API access requirements.');
  }

  if (freshness === 'due_soon') {
    cautions.push('Catalogue verification for this offering is due for review soon.');
  }

  if (freshness === 'overdue') {
    cautions.push('Catalogue verification for this offering is overdue for review.');
  }

  if (offering.sunsetAt) {
    cautions.push(`Catalogue records a sunset date of ${offering.sunsetAt}.`);
  }

  return cautions;
}

function buildSourceReferences(
  evaluatedNeeds: EvaluatedNeed[],
  sourcesById: Map<string, CatalogueSource>,
): RecommendationSourceReference[] {
  const references = new Map<string, RecommendationSourceReference>();

  for (const evaluatedNeed of evaluatedNeeds) {
    if (!evaluatedNeed.sourceId) {
      continue;
    }

    const source = sourcesById.get(evaluatedNeed.sourceId);
    if (!source || references.has(source.id)) {
      continue;
    }

    references.set(
      source.id,
      RecommendationSourceReferenceSchema.parse({
        sourceId: source.id,
        title: source.title,
        url: source.url,
        verifiedAt: source.verifiedAt,
      }),
    );
  }

  return [...references.values()].sort((left, right) => left.sourceId.localeCompare(right.sourceId));
}

function buildExplanation(
  needByKey: Map<string, ProviderCapabilityNeed>,
  evaluatedNeeds: EvaluatedNeed[],
  eligibilityReasons: string[],
  cautions: string[],
  sourcesById: Map<string, CatalogueSource>,
): CandidateExplanation {
  const strengths: string[] = [];
  const limitations: string[] = [];
  const evidenceGaps: string[] = [];

  for (const evaluatedNeed of evaluatedNeeds) {
    const need = needByKey.get(evaluatedNeed.needKey);
    const label = need?.label ?? evaluatedNeed.needKey;

    if (evaluatedNeed.supportLevel === 'supported') {
      strengths.push(`${label} is supported by official catalogue evidence.`);
    }

    if (evaluatedNeed.supportLevel === 'limited') {
      const limitation = evaluatedNeed.limitationSummary
        ? `${label} is limited: ${evaluatedNeed.limitationSummary}`
        : `${label} is limited according to official catalogue evidence.`;
      limitations.push(limitation);
    }

    if (evaluatedNeed.supportLevel === 'unsupported') {
      const evidence = evaluatedNeed.evidenceSummary
        ? `${label} is unsupported: ${evaluatedNeed.evidenceSummary}`
        : `${label} is explicitly unsupported according to official catalogue evidence.`;
      limitations.push(evidence);
    }

    if (evaluatedNeed.supportLevel === 'unknown') {
      evidenceGaps.push(`${label} lacks verified catalogue evidence for this offering.`);
    }
  }

  return CandidateExplanationSchema.parse({
    strengths,
    limitations,
    evidenceGaps,
    eligibilityReasons,
    cautions,
    sourceReferences: buildSourceReferences(evaluatedNeeds, sourcesById),
  });
}

function deriveCriticalBlockers(
  evaluatedNeeds: EvaluatedNeed[],
  needByKey: Map<string, ProviderCapabilityNeed>,
): string[] {
  const blockers: string[] = [];

  for (const evaluatedNeed of evaluatedNeeds) {
    if (evaluatedNeed.supportLevel !== 'unsupported') {
      continue;
    }

    const need = needByKey.get(evaluatedNeed.needKey);
    const label = need?.label ?? evaluatedNeed.needKey;

    if (evaluatedNeed.capabilityKey === 'text_to_video' || need?.importance === 'critical') {
      blockers.push(`${label} is explicitly unsupported for this offering.`);
    }
  }

  return blockers;
}

function calculateScores(
  evaluatedNeeds: EvaluatedNeed[],
): {
  totalRequestedWeight: number;
  evidenceBackedPoints: number;
  knownEvidenceWeight: number;
  evidenceBackedFitScore: number;
  evidenceCoverageScore: number;
} {
  const totalRequestedWeight = evaluatedNeeds.reduce((sum, need) => sum + need.weight, 0);
  const evidenceBackedPoints = evaluatedNeeds.reduce(
    (sum, need) => sum + need.evidenceBackedPoints,
    0,
  );
  const knownEvidenceWeight = evaluatedNeeds.reduce(
    (sum, need) => sum + need.knownEvidenceWeight,
    0,
  );

  const evidenceBackedFitScore =
    totalRequestedWeight === 0
      ? 0
      : Math.floor((evidenceBackedPoints / totalRequestedWeight) * 100);
  const evidenceCoverageScore =
    totalRequestedWeight === 0
      ? 0
      : Math.floor((knownEvidenceWeight / totalRequestedWeight) * 100);

  return {
    totalRequestedWeight,
    evidenceBackedPoints,
    knownEvidenceWeight,
    evidenceBackedFitScore,
    evidenceCoverageScore,
  };
}

export function classifyOffering(
  provider: CatalogueProvider,
  offering: CatalogueOffering,
  evaluatedNeeds: EvaluatedNeed[],
  needByKey: Map<string, ProviderCapabilityNeed>,
  eligibilityReasons: string[],
): OfferingClassification {
  if (eligibilityReasons.length > 0) {
    return 'ineligible';
  }

  const criticalBlockers = deriveCriticalBlockers(evaluatedNeeds, needByKey);
  if (criticalBlockers.length > 0) {
    return 'critical_blocked';
  }

  const textToVideoNeed = evaluatedNeeds.find((need) => need.capabilityKey === 'text_to_video');
  if (!textToVideoNeed || textToVideoNeed.supportLevel === 'unknown') {
    return 'insufficient_evidence';
  }

  if (textToVideoNeed.supportLevel === 'unsupported') {
    return 'critical_blocked';
  }

  const { evidenceCoverageScore } = calculateScores(evaluatedNeeds);
  if (evidenceCoverageScore < INSUFFICIENT_EVIDENCE_COVERAGE_THRESHOLD) {
    return 'insufficient_evidence';
  }

  if (textToVideoNeed.supportLevel === 'supported' || textToVideoNeed.supportLevel === 'limited') {
    return 'eligible_primary';
  }

  return 'insufficient_evidence';
}

export function evaluateOffering(
  provider: CatalogueProvider,
  offering: CatalogueOffering,
  needs: ProviderCapabilityNeed[],
  facts: CatalogueCapabilityFact[],
  context: CapabilityEvaluationContext,
  referenceNow: Date,
  sourcesById: Map<string, CatalogueSource>,
): OfferingEvaluationResult {
  const needByKey = new Map(needs.map((need) => [need.key, need]));
  const evaluatedNeeds = needs.map((need) => evaluateCapabilityNeed(need, facts, context));
  const scores = calculateScores(evaluatedNeeds);
  const eligibilityReasons = collectEligibilityReasons(provider, offering);
  const freshness = getFreshnessState(offering.verifiedAt, offering.reviewDueAt, referenceNow);
  const cautions = buildCautions(provider, offering, freshness);
  const criticalBlockers = deriveCriticalBlockers(evaluatedNeeds, needByKey);
  const classification = classifyOffering(
    provider,
    offering,
    evaluatedNeeds,
    needByKey,
    eligibilityReasons,
  );

  const supportedNeeds = evaluatedNeeds
    .filter((need) => need.supportLevel === 'supported')
    .map((need) => need.needKey);
  const limitedNeeds = evaluatedNeeds
    .filter((need) => need.supportLevel === 'limited')
    .map((need) => need.needKey);
  const unsupportedNeeds = evaluatedNeeds
    .filter((need) => need.supportLevel === 'unsupported')
    .map((need) => need.needKey);
  const unknownNeeds = evaluatedNeeds
    .filter((need) => need.supportLevel === 'unknown')
    .map((need) => need.needKey);

  return {
    provider,
    offering,
    evaluatedNeeds,
    ...scores,
    supportedNeeds,
    limitedNeeds,
    unsupportedNeeds,
    unknownNeeds,
    criticalBlockers,
    cautions,
    freshness,
    classification,
    explanation: buildExplanation(
      needByKey,
      evaluatedNeeds,
      eligibilityReasons,
      cautions,
      sourcesById,
    ),
  };
}

function compareOfferingEvaluations(
  left: OfferingEvaluationResult,
  right: OfferingEvaluationResult,
): number {
  if (right.evidenceBackedFitScore !== left.evidenceBackedFitScore) {
    return right.evidenceBackedFitScore - left.evidenceBackedFitScore;
  }

  if (right.evidenceCoverageScore !== left.evidenceCoverageScore) {
    return right.evidenceCoverageScore - left.evidenceCoverageScore;
  }

  if (left.unsupportedNeeds.length !== right.unsupportedNeeds.length) {
    return left.unsupportedNeeds.length - right.unsupportedNeeds.length;
  }

  if (left.limitedNeeds.length !== right.limitedNeeds.length) {
    return left.limitedNeeds.length - right.limitedNeeds.length;
  }

  const leftFreshness = FRESHNESS_RANK[left.freshness];
  const rightFreshness = FRESHNESS_RANK[right.freshness];
  if (leftFreshness !== rightFreshness) {
    return leftFreshness - rightFreshness;
  }

  const providerNameCompare = left.provider.displayName.localeCompare(right.provider.displayName);
  if (providerNameCompare !== 0) {
    return providerNameCompare;
  }

  return left.offering.offeringKey.localeCompare(right.offering.offeringKey);
}

export function selectStrongestOfferingPerProvider(
  evaluations: OfferingEvaluationResult[],
): OfferingEvaluationResult[] {
  const grouped = new Map<string, OfferingEvaluationResult[]>();

  for (const evaluation of evaluations) {
    const existing = grouped.get(evaluation.provider.id) ?? [];
    existing.push(evaluation);
    grouped.set(evaluation.provider.id, existing);
  }

  const strongest: OfferingEvaluationResult[] = [];

  for (const providerEvaluations of grouped.values()) {
    const sorted = [...providerEvaluations].sort(compareOfferingEvaluations);
    const retained = sorted[0];
    if (retained) {
      strongest.push(retained);
    }
  }

  return strongest.sort(compareOfferingEvaluations);
}

export function rankProviderCandidates(
  evaluations: OfferingEvaluationResult[],
): OfferingEvaluationResult[] {
  const eligiblePrimary = evaluations.filter(
    (evaluation) => evaluation.classification === 'eligible_primary',
  );

  return selectStrongestOfferingPerProvider(eligiblePrimary);
}

function toRecommendationCandidate(
  evaluation: OfferingEvaluationResult,
  tier: CandidateTier,
  siblingEvaluations: OfferingEvaluationResult[],
): ProviderRecommendationCandidate {
  return ProviderRecommendationCandidateSchema.parse({
    tier,
    classification: evaluation.classification,
    providerId: evaluation.provider.id,
    providerDisplayName: evaluation.provider.displayName,
    offeringId: evaluation.offering.id,
    offeringKey: evaluation.offering.offeringKey,
    offeringDisplayName: evaluation.offering.displayName,
    ownershipType: evaluation.offering.ownershipType,
    lifecycleStatus: evaluation.offering.lifecycleStatus,
    apiAccessStatus: evaluation.offering.apiAccessStatus,
    freshness: evaluation.freshness,
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
    siblingOfferings: siblingEvaluations
      .filter((sibling) => sibling.offering.id !== evaluation.offering.id)
      .map((sibling) => ({
        offeringId: sibling.offering.id,
        offeringKey: sibling.offering.offeringKey,
        offeringDisplayName: sibling.offering.displayName,
        classification: sibling.classification,
      }))
      .sort((left, right) => left.offeringKey.localeCompare(right.offeringKey)),
  });
}

function hasSupportedOrLimitedFact(
  facts: CatalogueCapabilityFact[],
  capabilityKey: CatalogueCapabilityKey,
): boolean {
  const fact = findFactForCapability(facts, capabilityKey);
  return fact?.supportLevel === 'supported' || fact?.supportLevel === 'limited';
}

function isOfferingEligibleForRecommendation(
  provider: CatalogueProvider,
  offering: CatalogueOffering,
): boolean {
  return collectEligibilityReasons(provider, offering).length === 0;
}

export function buildSupportingServiceCandidates(
  needs: ProviderCapabilityNeed[],
  productionRequirements: ProductionRequirements,
  evaluations: OfferingEvaluationResult[],
  factsByOfferingId: Record<string, CatalogueCapabilityFact[]>,
  primaryOfferingId: string | null,
  referenceNow: Date,
  sourcesById: Map<string, CatalogueSource>,
): SupportingServiceCandidate[] {
  const enabledSupportingRequirements = SUPPORTING_SERVICE_REQUIREMENT_KEYS.filter(
    (key) => productionRequirements[key],
  );

  if (enabledSupportingRequirements.length === 0) {
    return [];
  }

  const needByKey = new Map(needs.map((need) => [need.key, need]));
  const candidates: SupportingServiceCandidate[] = [];

  for (const evaluation of evaluations) {
    if (evaluation.offering.id === primaryOfferingId) {
      continue;
    }

    if (!isOfferingEligibleForRecommendation(evaluation.provider, evaluation.offering)) {
      continue;
    }

    const facts = factsByOfferingId[evaluation.offering.id] ?? [];
    const supportedCapabilityKeys: CatalogueCapabilityKey[] = [];
    const relatedRequirementKeys: SupportingServiceRequirementKey[] = [];

    for (const requirementKey of enabledSupportingRequirements) {
      if (requirementKey === 'firstLastFrameControl') {
        const firstSupported = hasSupportedOrLimitedFact(facts, 'first_frame_control');
        const lastSupported = hasSupportedOrLimitedFact(facts, 'last_frame_control');

        if (firstSupported || lastSupported) {
          relatedRequirementKeys.push(requirementKey);
          if (firstSupported) {
            supportedCapabilityKeys.push('first_frame_control');
          }
          if (lastSupported) {
            supportedCapabilityKeys.push('last_frame_control');
          }
        }

        continue;
      }

      const capabilityKey = PRODUCTION_REQUIREMENT_TO_CATALOGUE_CAPABILITY[requirementKey];
      if (hasSupportedOrLimitedFact(facts, capabilityKey)) {
        relatedRequirementKeys.push(requirementKey);
        supportedCapabilityKeys.push(capabilityKey);
      }
    }

    if (supportedCapabilityKeys.length === 0) {
      continue;
    }

    const evaluatedNeeds = supportedCapabilityKeys.map((capabilityKey) => {
      const need =
        [...needByKey.values()].find((entry) => entry.capabilityKey === capabilityKey) ??
        ProviderCapabilityNeedSchema.parse({
          key: capabilityKey,
          capabilityKey,
          category: 'specialized_service',
          importance: 'required',
          weight: 1,
          sourceFields: ['productionRequirements'],
          label: capabilityKey.replaceAll('_', ' '),
          rationale: 'Specialized supporting-service capability requested by the brief.',
        });

      return evaluateCapabilityNeed(need, facts, {
        aspectRatio: '16:9',
        maximumSceneDurationSeconds: 1,
      });
    });

    const freshness = getFreshnessState(
      evaluation.offering.verifiedAt,
      evaluation.offering.reviewDueAt,
      referenceNow,
    );
    const cautions = buildCautions(evaluation.provider, evaluation.offering, freshness);

    candidates.push(
      SupportingServiceCandidateSchema.parse({
        tier: 'supporting_service',
        providerId: evaluation.provider.id,
        providerDisplayName: evaluation.provider.displayName,
        offeringId: evaluation.offering.id,
        offeringKey: evaluation.offering.offeringKey,
        offeringDisplayName: evaluation.offering.displayName,
        ownershipType: evaluation.offering.ownershipType,
        lifecycleStatus: evaluation.offering.lifecycleStatus,
        apiAccessStatus: evaluation.offering.apiAccessStatus,
        freshness,
        supportedCapabilityKeys: [...new Set(supportedCapabilityKeys)].sort((left, right) =>
          left.localeCompare(right),
        ),
        relatedRequirementKeys: [...new Set(relatedRequirementKeys)].sort((left, right) =>
          left.localeCompare(right),
        ),
        explanation: buildExplanation(needByKey, evaluatedNeeds, [], cautions, sourcesById),
      }),
    );
  }

  return candidates.sort((left, right) => {
    const providerCompare = left.providerDisplayName.localeCompare(right.providerDisplayName);
    if (providerCompare !== 0) {
      return providerCompare;
    }

    return left.offeringKey.localeCompare(right.offeringKey);
  });
}

export type PrimaryRecommendationDecision = {
  recommendationStatus: RecommendationStatus;
  primaryRecommendation: ProviderRecommendationCandidate | null;
  leadingAlternatives: ProviderRecommendationCandidate[];
  alternatives: ProviderRecommendationCandidate[];
};

export function decidePrimaryRecommendation(
  rankedCandidates: ProviderRecommendationCandidate[],
): PrimaryRecommendationDecision {
  if (rankedCandidates.length === 0) {
    return {
      recommendationStatus: 'no_eligible_candidate',
      primaryRecommendation: null,
      leadingAlternatives: [],
      alternatives: [],
    };
  }

  const top = rankedCandidates[0]!;
  const second = rankedCandidates[1];

  const meetsThresholds =
    top.evidenceBackedFitScore >= PRIMARY_RECOMMENDATION_MIN_FIT &&
    top.evidenceCoverageScore >= PRIMARY_RECOMMENDATION_MIN_COVERAGE &&
    top.unsupportedNeeds.length === 0 &&
    top.criticalBlockers.length === 0;

  if (!meetsThresholds) {
    return {
      recommendationStatus: 'insufficient_evidence',
      primaryRecommendation: null,
      leadingAlternatives: [],
      alternatives: rankedCandidates.map((candidate) => ({
        ...candidate,
        tier: 'alternative' as const,
      })),
    };
  }

  if (second) {
    const fitLead = top.evidenceBackedFitScore - second.evidenceBackedFitScore;
    if (fitLead < PRIMARY_RECOMMENDATION_MIN_FIT_LEAD) {
      return {
        recommendationStatus: 'close_alternatives',
        primaryRecommendation: null,
        leadingAlternatives: [
          { ...top, tier: 'leading_alternative' },
          { ...second, tier: 'leading_alternative' },
        ],
        alternatives: rankedCandidates.slice(2).map((candidate) => ({
          ...candidate,
          tier: 'alternative' as const,
        })),
      };
    }
  }

  return {
    recommendationStatus: 'recommended',
    primaryRecommendation: { ...top, tier: 'primary_recommendation' },
    leadingAlternatives: [],
    alternatives: rankedCandidates.slice(1).map((candidate) => ({
      ...candidate,
      tier: 'alternative' as const,
    })),
  };
}

function deriveReferenceNow(catalogue: ProviderRecommendationCatalogue): Date {
  const timestamps = [
    ...catalogue.providers.map((provider) => provider.verifiedAt),
    ...catalogue.offerings.map((offering) => offering.verifiedAt),
  ];

  if (timestamps.length === 0) {
    return new Date('2026-07-04T12:00:00.000Z');
  }

  return timestamps.reduce((latest, value) => {
    const candidate = new Date(value);
    return candidate.getTime() > latest.getTime() ? candidate : latest;
  }, new Date(timestamps[0]!));
}

function buildSourcesById(catalogue: ProviderRecommendationCatalogue): Map<string, CatalogueSource> {
  const sourcesById = new Map<string, CatalogueSource>();

  for (const sources of Object.values(catalogue.sourcesByProviderId)) {
    for (const source of sources) {
      sourcesById.set(source.id, source);
    }
  }

  return sourcesById;
}

function buildCatalogueFreshnessSummary(
  evaluations: OfferingEvaluationResult[],
  referenceNow: Date,
): CatalogueFreshnessSummary {
  let overdueOfferingCount = 0;
  let dueSoonOfferingCount = 0;
  const warnings: string[] = [];

  for (const evaluation of evaluations) {
    const freshness = getFreshnessState(
      evaluation.offering.verifiedAt,
      evaluation.offering.reviewDueAt,
      referenceNow,
    );

    if (freshness === 'overdue') {
      overdueOfferingCount += 1;
    }

    if (freshness === 'due_soon') {
      dueSoonOfferingCount += 1;
    }
  }

  if (overdueOfferingCount > 0) {
    warnings.push(
      `${overdueOfferingCount} offering record(s) in the catalogue snapshot have overdue verification review dates.`,
    );
  }

  if (dueSoonOfferingCount > 0) {
    warnings.push(
      `${dueSoonOfferingCount} offering record(s) in the catalogue snapshot are due for verification review soon.`,
    );
  }

  return CatalogueFreshnessSummarySchema.parse({
    referenceVerifiedAt: referenceNow.toISOString(),
    overdueOfferingCount,
    dueSoonOfferingCount,
    warnings,
  });
}

export function calculateProviderRecommendation(
  input: CalculateProviderRecommendationInput,
): ProviderRecommendationResult {
  const needs = buildProviderCapabilityNeeds({
    sourceType: input.brief.sourceType,
    aspectRatio: input.brief.aspectRatio,
    durationSeconds: input.brief.durationSeconds,
    sceneDecomposition: input.sceneDecomposition,
    productionRequirements: input.brief.productionRequirements,
  });

  const maximumSceneDurationSeconds = deriveMaximumSceneDurationFromDecomposition(
    input.sceneDecomposition,
  );
  const evaluationContext: CapabilityEvaluationContext = {
    aspectRatio: input.brief.aspectRatio,
    maximumSceneDurationSeconds,
  };

  const providerById = new Map(input.catalogue.providers.map((provider) => [provider.id, provider]));
  const referenceNow = deriveReferenceNow(input.catalogue);
  const sourcesById = buildSourcesById(input.catalogue);

  const evaluations: OfferingEvaluationResult[] = input.catalogue.offerings
    .map((offering) => {
      const provider = providerById.get(offering.providerId);
      if (!provider) {
        return null;
      }

      const facts = input.catalogue.factsByOfferingId[offering.id] ?? [];

      return evaluateOffering(
        provider,
        offering,
        needs,
        facts,
        evaluationContext,
        referenceNow,
        sourcesById,
      );
    })
    .filter((evaluation): evaluation is OfferingEvaluationResult => evaluation !== null);

  const evaluationsByProvider = new Map<string, OfferingEvaluationResult[]>();
  for (const evaluation of evaluations) {
    const group = evaluationsByProvider.get(evaluation.provider.id) ?? [];
    group.push(evaluation);
    evaluationsByProvider.set(evaluation.provider.id, group);
  }

  const rankedEvaluations = rankProviderCandidates(evaluations);
  const rankedCandidates = rankedEvaluations.map((evaluation) =>
    toRecommendationCandidate(
      evaluation,
      'alternative',
      evaluationsByProvider.get(evaluation.provider.id) ?? [],
    ),
  );

  const decision = decidePrimaryRecommendation(rankedCandidates);

  const primaryOfferingId = decision.primaryRecommendation?.offeringId ?? null;

  const supportingServices = buildSupportingServiceCandidates(
    needs,
    input.brief.productionRequirements,
    evaluations,
    input.catalogue.factsByOfferingId,
    primaryOfferingId,
    referenceNow,
    sourcesById,
  );

  const insufficientEvidence = evaluations
    .filter((evaluation) => evaluation.classification === 'insufficient_evidence')
    .sort(compareOfferingEvaluations)
    .map((evaluation) =>
      toRecommendationCandidate(
        evaluation,
        'insufficient_evidence',
        evaluationsByProvider.get(evaluation.provider.id) ?? [],
      ),
    );

  const ineligible = evaluations
    .filter(
      (evaluation) =>
        evaluation.classification === 'ineligible' ||
        evaluation.classification === 'critical_blocked',
    )
    .sort(compareOfferingEvaluations)
    .map((evaluation) =>
      toRecommendationCandidate(
        evaluation,
        'ineligible',
        evaluationsByProvider.get(evaluation.provider.id) ?? [],
      ),
    );

  return ProviderRecommendationResultSchema.parse({
    algorithmVersion: PROVIDER_RECOMMENDATION_ALGORITHM_VERSION,
    origin: PROVIDER_RECOMMENDATION_ORIGIN,
    isAiGenerated: false,
    isPersisted: false,
    recommendationStatus: decision.recommendationStatus,
    primaryRecommendation: decision.primaryRecommendation,
    leadingAlternatives: decision.leadingAlternatives,
    alternatives: decision.alternatives,
    supportingServices,
    insufficientEvidence,
    ineligible,
    requestedNeeds: needs,
    catalogueFreshness: buildCatalogueFreshnessSummary(evaluations, referenceNow),
  });
}

export function isOfferingLifecycleEligible(
  lifecycleStatus: string,
  apiAccessStatus: string,
  recommendationEligible: boolean,
): boolean {
  return (
    recommendationEligible &&
    isLifecycleEligible(lifecycleStatus) &&
    isApiAccessEligible(apiAccessStatus)
  );
}

export function supportLevelToPoints(weight: number, supportLevel: SupportLevel | 'unknown'): number {
  if (supportLevel === 'supported') {
    return weight;
  }

  if (supportLevel === 'limited') {
    return limitedPoints(weight);
  }

  return 0;
}
