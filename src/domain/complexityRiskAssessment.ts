import { z } from 'zod';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  PRODUCTION_REQUIREMENT_LABELS,
  ProductionRequirementsSchema,
  type ProductionRequirementKey,
  type ProductionRequirements,
} from './productionRequirements';

export const COMPLEXITY_RISK_ALGORITHM_VERSION = 'complexity-risk-v1' as const;
export const COMPLEXITY_RISK_ORIGIN = 'deterministic_rule_engine' as const;

export const ASSESSMENT_LEVELS = ['low', 'moderate', 'high', 'very_high'] as const;

export const ASSESSMENT_LEVEL_LABELS: Record<(typeof ASSESSMENT_LEVELS)[number], string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very high',
};

export const COMPLEXITY_REQUIREMENT_WEIGHTS = {
  characterConsistency: 6,
  productConsistency: 5,
  logoAccuracy: 4,
  exactTextVisibility: 5,
  nativeAudio: 4,
  dialogue: 4,
  voiceover: 2,
  lipSync: 6,
  multipleLocations: 5,
  cameraControl: 4,
  firstLastFrameControl: 4,
  videoExtension: 4,
  referenceImages: 2,
  commercialUse: 1,
} as const satisfies Record<ProductionRequirementKey, number>;

export const EXECUTION_RISK_REQUIREMENT_WEIGHTS = {
  characterConsistency: 5,
  productConsistency: 5,
  logoAccuracy: 5,
  exactTextVisibility: 8,
  nativeAudio: 3,
  dialogue: 4,
  voiceover: 1,
  lipSync: 8,
  multipleLocations: 4,
  cameraControl: 3,
  firstLastFrameControl: 4,
  videoExtension: 6,
  referenceImages: 2,
  commercialUse: 2,
} as const satisfies Record<ProductionRequirementKey, number>;

export const COMPLEXITY_SOURCE_TYPE_POINTS = {
  idea: 0,
  script: 4,
  product_url: 6,
  article_url: 8,
} as const;

export const APPROVED_SOURCE_TYPES = ['idea', 'script', 'product_url', 'article_url'] as const;

export const EXECUTION_RISK_INTERACTIONS = [
  {
    key: 'exact_text_and_logo_fidelity',
    points: 8,
    label: 'Exact text and logo fidelity',
    rationale:
      'Exact on-screen text and logo accuracy are both requested, increasing fidelity coordination demands.',
    sourceFields: ['exactTextVisibility', 'logoAccuracy'] as const,
    matches: (requirements: ProductionRequirements) =>
      requirements.exactTextVisibility && requirements.logoAccuracy,
  },
  {
    key: 'dialogue_lip_sync_coordination',
    points: 10,
    label: 'Dialogue and lip sync coordination',
    rationale:
      'Spoken dialogue and lip sync are both requested, increasing performance coordination demands.',
    sourceFields: ['dialogue', 'lipSync'] as const,
    matches: (requirements: ProductionRequirements) => requirements.dialogue && requirements.lipSync,
  },
  {
    key: 'character_across_locations',
    points: 8,
    label: 'Character consistency across locations',
    rationale:
      'Character consistency and multiple locations are both requested, increasing continuity coordination.',
    sourceFields: ['characterConsistency', 'multipleLocations'] as const,
    matches: (requirements: ProductionRequirements) =>
      requirements.characterConsistency && requirements.multipleLocations,
  },
  {
    key: 'product_across_locations',
    points: 6,
    label: 'Product consistency across locations',
    rationale:
      'Product consistency and multiple locations are both requested, increasing continuity coordination.',
    sourceFields: ['productConsistency', 'multipleLocations'] as const,
    matches: (requirements: ProductionRequirements) =>
      requirements.productConsistency && requirements.multipleLocations,
  },
  {
    key: 'extension_frame_boundary_control',
    points: 6,
    label: 'Extension and frame boundary control',
    rationale:
      'Video extension and first/last frame control are both requested, increasing boundary coordination.',
    sourceFields: ['videoExtension', 'firstLastFrameControl'] as const,
    matches: (requirements: ProductionRequirements) =>
      requirements.videoExtension && requirements.firstLastFrameControl,
  },
  {
    key: 'native_audio_dialogue_coordination',
    points: 4,
    label: 'Native audio and dialogue coordination',
    rationale:
      'Native audio and spoken dialogue are both requested, increasing audio coordination demands.',
    sourceFields: ['nativeAudio', 'dialogue'] as const,
    matches: (requirements: ProductionRequirements) =>
      requirements.nativeAudio && requirements.dialogue,
  },
  {
    key: 'long_form_multi_location',
    points: 6,
    label: 'Long-form multi-location coordination',
    rationale:
      'Duration exceeds 90 seconds with multiple locations requested, increasing long-form coordination.',
    sourceFields: ['durationSeconds', 'multipleLocations'] as const,
    matches: (
      requirements: ProductionRequirements,
      durationSeconds: number,
    ) => durationSeconds > 90 && requirements.multipleLocations,
  },
  {
    key: 'dense_scene_camera_control',
    points: 4,
    label: 'Dense scene camera control',
    rationale:
      'Ten or more scenes with camera control requested increases coordination across a dense roadmap.',
    sourceFields: ['sceneCount', 'cameraControl'] as const,
    matches: (
      requirements: ProductionRequirements,
      _durationSeconds: number,
      sceneCount: number,
    ) => sceneCount >= 10 && requirements.cameraControl,
  },
] as const satisfies ReadonlyArray<{
  key: string;
  points: number;
  label: string;
  rationale: string;
  sourceFields: readonly string[];
  matches: (
    requirements: ProductionRequirements,
    durationSeconds: number,
    sceneCount: number,
  ) => boolean;
}>;

export const AssessmentLevelSchema = z.enum(ASSESSMENT_LEVELS);

export const AssessmentFactorSchema = z.object({
  key: z.string().trim().min(1),
  assessment: z.enum(['complexity', 'execution_risk']),
  category: z.enum([
    'duration',
    'scene_structure',
    'source_type',
    'production_requirement',
    'user_constraints',
    'interaction',
  ]),
  label: z.string().trim().min(1),
  points: z.number().int().positive(),
  rationale: z.string().trim().min(1),
  sourceFields: z.array(z.string().trim().min(1)).min(1),
});

export const ComplexityAssessmentSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    level: AssessmentLevelSchema,
    contributions: z.array(AssessmentFactorSchema),
  })
  .superRefine((value, ctx) => {
    const sum = value.contributions.reduce((total, factor) => total + factor.points, 0);
    if (sum !== value.score) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Complexity contributions must sum to score',
        path: ['contributions'],
      });
    }

    for (const factor of value.contributions) {
      if (factor.assessment !== 'complexity') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Complexity factor has wrong assessment type',
          path: ['contributions'],
        });
      }
    }
  });

export const ExecutionRiskAssessmentSchema = z
  .object({
    rawScore: z.number().int().min(0),
    score: z.number().int().min(0).max(100),
    level: AssessmentLevelSchema,
    wasCapped: z.boolean(),
    contributions: z.array(AssessmentFactorSchema),
  })
  .superRefine((value, ctx) => {
    const sum = value.contributions.reduce((total, factor) => total + factor.points, 0);
    if (sum !== value.rawScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Execution-risk contributions must sum to rawScore',
        path: ['contributions'],
      });
    }

    const expectedScore = Math.min(100, value.rawScore);
    if (value.score !== expectedScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Execution-risk score must equal min(100, rawScore)',
        path: ['score'],
      });
    }

    if (value.wasCapped !== value.rawScore > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'wasCapped must reflect whether rawScore exceeds 100',
        path: ['wasCapped'],
      });
    }

    for (const factor of value.contributions) {
      if (factor.assessment !== 'execution_risk') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Execution-risk factor has wrong assessment type',
          path: ['contributions'],
        });
      }
    }
  });

export const ComplexityRiskAssessmentSchema = z
  .object({
    algorithmVersion: z.literal(COMPLEXITY_RISK_ALGORITHM_VERSION),
    origin: z.literal(COMPLEXITY_RISK_ORIGIN),
    isAiGenerated: z.literal(false),
    isPersisted: z.literal(false),
    complexity: ComplexityAssessmentSchema,
    executionRisk: ExecutionRiskAssessmentSchema,
  })
  .strict();

export const ComplexityRiskScoringInputSchema = z.object({
  durationSeconds: z.number().int().min(5).max(180),
  sceneCount: z.number().int().min(2).max(12),
  sourceType: z.enum(APPROVED_SOURCE_TYPES),
  userConstraints: z.string().nullable(),
  productionRequirements: ProductionRequirementsSchema,
});

export type AssessmentLevel = z.infer<typeof AssessmentLevelSchema>;
export type AssessmentFactor = z.infer<typeof AssessmentFactorSchema>;
export type ComplexityAssessment = z.infer<typeof ComplexityAssessmentSchema>;
export type ExecutionRiskAssessment = z.infer<typeof ExecutionRiskAssessmentSchema>;
export type ComplexityRiskAssessment = z.infer<typeof ComplexityRiskAssessmentSchema>;
export type ComplexityRiskScoringInput = z.infer<typeof ComplexityRiskScoringInputSchema>;

function sortContributions(contributions: AssessmentFactor[]): AssessmentFactor[] {
  return [...contributions].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    return left.key.localeCompare(right.key);
  });
}

function assertUniqueKeys(contributions: AssessmentFactor[]): void {
  const keys = contributions.map((factor) => factor.key);
  if (new Set(keys).size !== keys.length) {
    throw new Error('Duplicate assessment factor keys');
  }
}

export function deriveAssessmentLevel(score: number): AssessmentLevel {
  if (score < 0 || score > 100) {
    throw new Error('Score must be between 0 and 100 for level derivation');
  }

  if (score <= 24) {
    return 'low';
  }

  if (score <= 49) {
    return 'moderate';
  }

  if (score <= 74) {
    return 'high';
  }

  return 'very_high';
}

function complexityDurationPoints(durationSeconds: number): number {
  if (durationSeconds <= 20) {
    return 0;
  }

  if (durationSeconds <= 40) {
    return 5;
  }

  if (durationSeconds <= 60) {
    return 9;
  }

  if (durationSeconds <= 90) {
    return 13;
  }

  if (durationSeconds <= 120) {
    return 17;
  }

  return 20;
}

function complexityScenePoints(sceneCount: number): number {
  if (sceneCount <= 3) {
    return 0;
  }

  if (sceneCount <= 6) {
    return 3;
  }

  if (sceneCount <= 9) {
    return 6;
  }

  return 10;
}

function executionRiskDurationPoints(durationSeconds: number): number {
  if (durationSeconds <= 40) {
    return 0;
  }

  if (durationSeconds <= 60) {
    return 3;
  }

  if (durationSeconds <= 90) {
    return 6;
  }

  if (durationSeconds <= 120) {
    return 8;
  }

  return 10;
}

function executionRiskScenePoints(sceneCount: number): number {
  if (sceneCount <= 6) {
    return 0;
  }

  if (sceneCount <= 9) {
    return 3;
  }

  return 5;
}

function userConstraintCharacterCount(userConstraints: string | null): number {
  return userConstraints?.trim().length ?? 0;
}

function complexityConstraintPoints(userConstraints: string | null): number {
  const count = userConstraintCharacterCount(userConstraints);

  if (count === 0) {
    return 0;
  }

  if (count <= 250) {
    return 2;
  }

  if (count <= 750) {
    return 4;
  }

  return 6;
}

function complexityDurationLabel(durationSeconds: number): string {
  if (durationSeconds <= 20) {
    return '5–20 seconds';
  }

  if (durationSeconds <= 40) {
    return '21–40 seconds';
  }

  if (durationSeconds <= 60) {
    return '41–60 seconds';
  }

  if (durationSeconds <= 90) {
    return '61–90 seconds';
  }

  if (durationSeconds <= 120) {
    return '91–120 seconds';
  }

  return '121–180 seconds';
}

function complexitySceneLabel(sceneCount: number): string {
  if (sceneCount <= 3) {
    return '2–3 scenes';
  }

  if (sceneCount <= 6) {
    return '4–6 scenes';
  }

  if (sceneCount <= 9) {
    return '7–9 scenes';
  }

  return '10–12 scenes';
}

function executionRiskDurationLabel(durationSeconds: number): string {
  if (durationSeconds <= 40) {
    return '5–40 seconds';
  }

  if (durationSeconds <= 60) {
    return '41–60 seconds';
  }

  if (durationSeconds <= 90) {
    return '61–90 seconds';
  }

  if (durationSeconds <= 120) {
    return '91–120 seconds';
  }

  return '121–180 seconds';
}

function executionRiskSceneLabel(sceneCount: number): string {
  if (sceneCount <= 6) {
    return '2–6 scenes';
  }

  if (sceneCount <= 9) {
    return '7–9 scenes';
  }

  return '10–12 scenes';
}

function complexitySourceLabel(sourceType: ComplexityRiskScoringInput['sourceType']): string {
  switch (sourceType) {
    case 'idea':
      return 'Idea source';
    case 'script':
      return 'Script source';
    case 'product_url':
      return 'Product page URL source';
    case 'article_url':
      return 'Article URL source';
  }
}

export function calculateComplexityAssessment(
  input: ComplexityRiskScoringInput,
): ComplexityAssessment {
  const parsed = ComplexityRiskScoringInputSchema.parse(input);
  const contributions: AssessmentFactor[] = [];

  const durationPoints = complexityDurationPoints(parsed.durationSeconds);
  if (durationPoints > 0) {
    contributions.push({
      key: 'duration',
      assessment: 'complexity',
      category: 'duration',
      label: 'Saved duration',
      points: durationPoints,
      rationale: `Saved duration falls in the ${complexityDurationLabel(parsed.durationSeconds)} bracket.`,
      sourceFields: ['durationSeconds'],
    });
  }

  const scenePoints = complexityScenePoints(parsed.sceneCount);
  if (scenePoints > 0) {
    contributions.push({
      key: 'scene_structure',
      assessment: 'complexity',
      category: 'scene_structure',
      label: 'Scene structure',
      points: scenePoints,
      rationale: `Deterministic scene count falls in the ${complexitySceneLabel(parsed.sceneCount)} bracket.`,
      sourceFields: ['sceneCount'],
    });
  }

  const sourcePoints = COMPLEXITY_SOURCE_TYPE_POINTS[parsed.sourceType];
  if (sourcePoints > 0) {
    contributions.push({
      key: `source_type_${parsed.sourceType}`,
      assessment: 'complexity',
      category: 'source_type',
      label: complexitySourceLabel(parsed.sourceType),
      points: sourcePoints,
      rationale: `${complexitySourceLabel(parsed.sourceType)} adds structural input demands.`,
      sourceFields: ['sourceType'],
    });
  }

  for (const key of PRODUCTION_REQUIREMENT_KEYS) {
    if (!parsed.productionRequirements[key]) {
      continue;
    }

    const points = COMPLEXITY_REQUIREMENT_WEIGHTS[key];
    contributions.push({
      key: `requirement_${key}`,
      assessment: 'complexity',
      category: 'production_requirement',
      label: PRODUCTION_REQUIREMENT_LABELS[key],
      points,
      rationale: `${PRODUCTION_REQUIREMENT_LABELS[key]} is enabled in the saved brief.`,
      sourceFields: ['productionRequirements', key],
    });
  }

  const constraintPoints = complexityConstraintPoints(parsed.userConstraints);
  if (constraintPoints > 0) {
    contributions.push({
      key: 'user_constraints',
      assessment: 'complexity',
      category: 'user_constraints',
      label: 'User constraints length',
      points: constraintPoints,
      rationale: 'Saved user constraints add additional planning demands by length.',
      sourceFields: ['userConstraints'],
    });
  }

  const sorted = sortContributions(contributions);
  assertUniqueKeys(sorted);
  const score = sorted.reduce((total, factor) => total + factor.points, 0);

  return ComplexityAssessmentSchema.parse({
    score,
    level: deriveAssessmentLevel(score),
    contributions: sorted,
  });
}

export function calculateExecutionRiskAssessment(
  input: ComplexityRiskScoringInput,
): ExecutionRiskAssessment {
  const parsed = ComplexityRiskScoringInputSchema.parse(input);
  const contributions: AssessmentFactor[] = [];

  for (const key of PRODUCTION_REQUIREMENT_KEYS) {
    if (!parsed.productionRequirements[key]) {
      continue;
    }

    const points = EXECUTION_RISK_REQUIREMENT_WEIGHTS[key];
    contributions.push({
      key: `requirement_${key}`,
      assessment: 'execution_risk',
      category: 'production_requirement',
      label: PRODUCTION_REQUIREMENT_LABELS[key],
      points,
      rationale: `${PRODUCTION_REQUIREMENT_LABELS[key]} introduces fidelity or coordination demands.`,
      sourceFields: ['productionRequirements', key],
    });
  }

  const durationPoints = executionRiskDurationPoints(parsed.durationSeconds);
  if (durationPoints > 0) {
    contributions.push({
      key: 'duration',
      assessment: 'execution_risk',
      category: 'duration',
      label: 'Saved duration',
      points: durationPoints,
      rationale: `Saved duration falls in the ${executionRiskDurationLabel(parsed.durationSeconds)} risk bracket.`,
      sourceFields: ['durationSeconds'],
    });
  }

  const scenePoints = executionRiskScenePoints(parsed.sceneCount);
  if (scenePoints > 0) {
    contributions.push({
      key: 'scene_density',
      assessment: 'execution_risk',
      category: 'scene_structure',
      label: 'Scene density',
      points: scenePoints,
      rationale: `Deterministic scene count falls in the ${executionRiskSceneLabel(parsed.sceneCount)} density bracket.`,
      sourceFields: ['sceneCount'],
    });
  }

  for (const interaction of EXECUTION_RISK_INTERACTIONS) {
    if (
      !interaction.matches(
        parsed.productionRequirements,
        parsed.durationSeconds,
        parsed.sceneCount,
      )
    ) {
      continue;
    }

    contributions.push({
      key: interaction.key,
      assessment: 'execution_risk',
      category: 'interaction',
      label: interaction.label,
      points: interaction.points,
      rationale: interaction.rationale,
      sourceFields: [...interaction.sourceFields],
    });
  }

  const sorted = sortContributions(contributions);
  assertUniqueKeys(sorted);
  const rawScore = sorted.reduce((total, factor) => total + factor.points, 0);
  const score = Math.min(100, rawScore);

  return ExecutionRiskAssessmentSchema.parse({
    rawScore,
    score,
    level: deriveAssessmentLevel(score),
    wasCapped: rawScore > 100,
    contributions: sorted,
  });
}

export function calculateComplexityRiskAssessment(
  input: ComplexityRiskScoringInput,
): ComplexityRiskAssessment {
  return ComplexityRiskAssessmentSchema.parse({
    algorithmVersion: COMPLEXITY_RISK_ALGORITHM_VERSION,
    origin: COMPLEXITY_RISK_ORIGIN,
    isAiGenerated: false,
    isPersisted: false,
    complexity: calculateComplexityAssessment(input),
    executionRisk: calculateExecutionRiskAssessment(input),
  });
}

export function sumComplexityRequirementWeights(): number {
  return PRODUCTION_REQUIREMENT_KEYS.reduce(
    (total, key) => total + COMPLEXITY_REQUIREMENT_WEIGHTS[key],
    0,
  );
}

export function sumExecutionRiskRequirementWeights(): number {
  return PRODUCTION_REQUIREMENT_KEYS.reduce(
    (total, key) => total + EXECUTION_RISK_REQUIREMENT_WEIGHTS[key],
    0,
  );
}
