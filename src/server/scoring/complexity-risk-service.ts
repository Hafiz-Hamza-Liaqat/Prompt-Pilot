import type { SceneDecomposition } from '@/domain/sceneDecomposition';
import {
  APPROVED_SOURCE_TYPES,
  calculateComplexityRiskAssessment,
  ComplexityRiskScoringInputSchema,
  type ComplexityRiskAssessment,
} from '@/domain/complexityRiskAssessment';
import {
  createDefaultProductionRequirements,
  ProductionRequirementsSchema,
} from '@/domain/productionRequirements';
import type { PartialVideoBriefDraft } from '@/domain/videoBriefDraft';

export type ComplexityRiskServiceErrorCode =
  | 'brief_required'
  | 'duration_mismatch'
  | 'invalid_input'
  | 'assessment_error';

export type ComplexityRiskServiceResult =
  | { ok: true; data: ComplexityRiskAssessment }
  | { ok: false; code: ComplexityRiskServiceErrorCode };

export type ComplexityRiskBriefInput = {
  completedAt: string | null | undefined;
  durationSeconds: number | null | undefined;
  sourceType: string | null | undefined;
  userConstraints: string | null | undefined;
  productionRequirements: PartialVideoBriefDraft['productionRequirements'];
};

function mapSourceType(sourceType: string | null | undefined) {
  const parsed = APPROVED_SOURCE_TYPES.find((value) => value === sourceType);
  return parsed ?? null;
}

function buildScoringInput(
  brief: ComplexityRiskBriefInput,
  sceneDecomposition: SceneDecomposition,
) {
  const sourceType = mapSourceType(brief.sourceType);
  if (!sourceType) {
    return null;
  }

  const requirements = ProductionRequirementsSchema.safeParse(
    brief.productionRequirements ?? createDefaultProductionRequirements(),
  );

  if (!requirements.success) {
    return null;
  }

  return ComplexityRiskScoringInputSchema.parse({
    durationSeconds: brief.durationSeconds,
    sceneCount: sceneDecomposition.sceneCount,
    sourceType,
    userConstraints: brief.userConstraints ?? null,
    productionRequirements: requirements.data,
  });
}

export function assessComplexityRisk(
  brief: ComplexityRiskBriefInput,
  sceneDecomposition: SceneDecomposition,
): ComplexityRiskServiceResult {
  if (!brief.completedAt) {
    return { ok: false, code: 'brief_required' };
  }

  if (
    brief.durationSeconds == null ||
    sceneDecomposition.totalDurationSeconds !== brief.durationSeconds
  ) {
    return { ok: false, code: 'duration_mismatch' };
  }

  const scoringInput = buildScoringInput(brief, sceneDecomposition);
  if (!scoringInput) {
    return { ok: false, code: 'invalid_input' };
  }

  try {
    return { ok: true, data: calculateComplexityRiskAssessment(scoringInput) };
  } catch {
    return { ok: false, code: 'assessment_error' };
  }
}

export function assessCompletedBriefComplexityRisk(
  brief: PartialVideoBriefDraft,
  sceneDecomposition: SceneDecomposition,
): ComplexityRiskServiceResult {
  return assessComplexityRisk(
    {
      completedAt: brief.completedAt,
      durationSeconds: brief.durationSeconds,
      sourceType: brief.sourceType,
      userConstraints: brief.userConstraints ?? null,
      productionRequirements: brief.productionRequirements,
    },
    sceneDecomposition,
  );
}

export function createComplexityRiskService() {
  return {
    assessComplexityRisk,
    assessCompletedBriefComplexityRisk,
  };
}

export type ComplexityRiskService = ReturnType<typeof createComplexityRiskService>;
