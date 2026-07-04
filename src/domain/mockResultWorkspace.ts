import { z } from 'zod';
import { ComplexityRiskAssessmentSchema } from './complexityRiskAssessment';
import { IsoDateTimeSchema } from './common';
import { SceneDecompositionSchema } from './sceneDecomposition';
import { projectIdSchema } from './project';
import type { ProductionRequirementKey } from './productionRequirements';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  PRODUCTION_REQUIREMENT_LABELS,
  ProductionRequirementsSchema,
} from './productionRequirements';

export const WORKSPACE_MODES = ['hybrid_preview'] as const;
export const DATA_ORIGINS = ['mixed'] as const;
export const SECTION_DATA_ORIGINS = [
  'persisted_input',
  'catalogue_snapshot',
  'deterministic_rule_engine',
  'static_fixture',
] as const;

export const WORKSPACE_SECTIONS = [
  'overview',
  'providers',
  'scenes',
  'prompts',
  'continuity',
  'audio-editing',
  'quality',
] as const;

export const PROVIDER_REFERENCE_STATES = ['catalogue_reference'] as const;

export const EVALUATION_STATES = [
  'not_evaluated',
  'future_evaluation',
  'brief_available',
  'relevant',
  'not_requested',
] as const;

export const MOCK_PROMPT_SECTION_KEYS = [
  'scene_objective',
  'visual_direction',
  'subject_and_action',
  'camera_direction',
  'environment',
  'continuity_constraints',
  'audio_notes',
  'negative_constraints',
] as const;

export const WORKSPACE_FIXTURE_VERSION = 'workspace-v3' as const;

export const WORKSPACE_SECTION_ORIGINS: Record<
  (typeof WORKSPACE_SECTIONS)[number],
  (typeof SECTION_DATA_ORIGINS)[number]
> = {
  overview: 'persisted_input',
  providers: 'catalogue_snapshot',
  scenes: 'deterministic_rule_engine',
  prompts: 'static_fixture',
  continuity: 'static_fixture',
  'audio-editing': 'static_fixture',
  quality: 'deterministic_rule_engine',
};

export const WORKSPACE_SAMPLE_DISCLAIMER =
  'Prompt, continuity, and audio/editing sections still use static demonstration data. No AI model or provider has generated or recommended this plan.';

export const WORKSPACE_PREVIEW_TITLE = 'Planning workspace preview';

const SampleRecordSchema = z.object({
  isSample: z.literal(true),
});

export const WorkspaceModeSchema = z.enum(WORKSPACE_MODES);
export const DataOriginSchema = z.enum(DATA_ORIGINS);
export const SectionDataOriginSchema = z.enum(SECTION_DATA_ORIGINS);
export const WorkspaceSectionSchema = z.enum(WORKSPACE_SECTIONS);
export const ProviderReferenceStateSchema = z.enum(PROVIDER_REFERENCE_STATES);
export const EvaluationStateSchema = z.enum(EVALUATION_STATES);
export const MockPromptSectionKeySchema = z.enum(MOCK_PROMPT_SECTION_KEYS);

export const WorkspaceSectionOriginsSchema = z.object({
  overview: z.literal('persisted_input'),
  providers: z.literal('catalogue_snapshot'),
  scenes: z.literal('deterministic_rule_engine'),
  prompts: z.literal('static_fixture'),
  continuity: z.literal('static_fixture'),
  'audio-editing': z.literal('static_fixture'),
  quality: z.literal('deterministic_rule_engine'),
});

export const MockPromptSectionSchema = SampleRecordSchema.extend({
  key: MockPromptSectionKeySchema,
  label: z.string().trim().min(1),
  sampleContent: z.string().trim().min(1),
});

export const MockContinuityItemSchema = SampleRecordSchema.extend({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  evaluationState: EvaluationStateSchema,
  sampleNote: z.string().trim().min(1),
});

export const MockAudioEditingItemSchema = SampleRecordSchema.extend({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  evaluationState: EvaluationStateSchema,
  sampleNote: z.string().trim().min(1),
});

export const WorkspaceProjectSummarySchema = z.object({
  id: projectIdSchema,
  title: z.string().trim().min(1),
  description: z.string().nullable(),
  status: z.enum(['active', 'archived']),
});

export const WorkspaceBriefSummarySchema = z.object({
  id: z.string().uuid(),
  projectId: projectIdSchema,
  workingTitle: z.string().trim().min(1),
  objective: z.string().trim().min(1),
  targetAudience: z.string().trim().min(1),
  publishingDestination: z.string().trim().min(1),
  aspectRatio: z.string().trim().min(1),
  videoCategory: z.string().trim().min(1),
  durationSeconds: z.number().int().positive(),
  visualStyle: z.string().trim().min(1),
  tone: z.string().trim().min(1),
  budgetPriority: z.string().trim().min(1),
  qualityPriority: z.string().trim().min(1),
  enabledRequirementLabels: z.array(z.string().trim().min(1)),
  sourceType: z.string().trim().min(1),
  sourcePreview: z.string().trim().min(1),
  sourceCharacterCount: z.number().int().nonnegative(),
  sourceUrl: z.string().nullable(),
  completedAt: IsoDateTimeSchema,
});

export const WorkspaceProviderReferenceSchema = z.object({
  id: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  lifecycleStatus: z.string().trim().min(1),
  apiAccessStatus: z.string().trim().min(1),
  freshness: z.string().trim().min(1),
  catalogueNotice: z.string().nullable(),
  sunsetAt: IsoDateTimeSchema.nullable(),
  referenceState: ProviderReferenceStateSchema,
});

export const MockResultWorkspaceStaticFixtureSchema = z.object({
  fixtureVersion: z.literal(WORKSPACE_FIXTURE_VERSION),
  sampleDisclaimer: z.string().trim().min(1),
  samplePromptSections: z.array(MockPromptSectionSchema).min(8),
  continuityItems: z.array(MockContinuityItemSchema).min(1),
  audioEditingItems: z.array(MockAudioEditingItemSchema).min(1),
});

export const MockResultWorkspaceViewModelSchema = z
  .object({
    mode: WorkspaceModeSchema,
    dataOrigin: DataOriginSchema,
    isDecisionReady: z.literal(false),
    fixtureVersion: z.literal(WORKSPACE_FIXTURE_VERSION),
    sampleDisclaimer: z.string().trim().min(1),
    previewTitle: z.literal(WORKSPACE_PREVIEW_TITLE),
    sectionOrigins: WorkspaceSectionOriginsSchema,
    activeSection: WorkspaceSectionSchema,
    project: WorkspaceProjectSummarySchema,
    brief: WorkspaceBriefSummarySchema,
    providers: z.array(WorkspaceProviderReferenceSchema).length(5),
    sceneDecomposition: SceneDecompositionSchema,
    complexityRiskAssessment: ComplexityRiskAssessmentSchema,
    samplePromptSections: z.array(MockPromptSectionSchema).min(8),
    continuityItems: z.array(MockContinuityItemSchema).min(1),
    audioEditingItems: z.array(MockAudioEditingItemSchema).min(1),
  })
  .strict();

export type WorkspaceMode = z.infer<typeof WorkspaceModeSchema>;
export type DataOrigin = z.infer<typeof DataOriginSchema>;
export type SectionDataOrigin = z.infer<typeof SectionDataOriginSchema>;
export type WorkspaceSection = z.infer<typeof WorkspaceSectionSchema>;
export type ProviderReferenceState = z.infer<typeof ProviderReferenceStateSchema>;
export type EvaluationState = z.infer<typeof EvaluationStateSchema>;
export type MockPromptSection = z.infer<typeof MockPromptSectionSchema>;
export type MockContinuityItem = z.infer<typeof MockContinuityItemSchema>;
export type MockAudioEditingItem = z.infer<typeof MockAudioEditingItemSchema>;
export type WorkspaceProjectSummary = z.infer<typeof WorkspaceProjectSummarySchema>;
export type WorkspaceBriefSummary = z.infer<typeof WorkspaceBriefSummarySchema>;
export type WorkspaceProviderReference = z.infer<typeof WorkspaceProviderReferenceSchema>;
export type MockResultWorkspaceStaticFixture = z.infer<
  typeof MockResultWorkspaceStaticFixtureSchema
>;
export type MockResultWorkspaceViewModel = z.infer<typeof MockResultWorkspaceViewModelSchema>;

export function normalizeWorkspaceSection(value: unknown): WorkspaceSection {
  const parsed = WorkspaceSectionSchema.safeParse(value);
  return parsed.success ? parsed.data : 'overview';
}

export function createSourcePreview(
  sourceText: string | null | undefined,
  maxLength = 160,
): { preview: string; characterCount: number } {
  const normalized = sourceText?.trim() ?? '';
  const characterCount = normalized.length;

  if (characterCount === 0) {
    return { preview: 'No source text stored for this brief.', characterCount: 0 };
  }

  if (characterCount <= maxLength) {
    return { preview: normalized, characterCount };
  }

  return {
    preview: `${normalized.slice(0, maxLength).trimEnd()}…`,
    characterCount,
  };
}

export function mapEnabledRequirementLabels(
  requirements: Partial<z.infer<typeof ProductionRequirementsSchema>> | null | undefined,
): string[] {
  if (!requirements) {
    return [];
  }

  return PRODUCTION_REQUIREMENT_KEYS.filter((key) => Boolean(requirements[key])).map(
    (key) => PRODUCTION_REQUIREMENT_LABELS[key],
  );
}

export function deriveContinuityEvaluationState(
  requirementKey: ProductionRequirementKey,
  requirements: Partial<z.infer<typeof ProductionRequirementsSchema>> | null | undefined,
): EvaluationState {
  if (!requirements) {
    return 'not_requested';
  }

  return requirements[requirementKey] ? 'relevant' : 'not_requested';
}

export function assertWorkspaceTruthfulness(model: MockResultWorkspaceViewModel): void {
  const forbiddenKeys = [
    'recommendationScore',
    'matchPercentage',
    'riskScore',
    'qualityScore',
    'selectedProvider',
    'winningProvider',
    'generationJobId',
    'artifactId',
    'downloadUrl',
    'generatedAt',
    'estimatedCost',
  ] as const;

  for (const key of forbiddenKeys) {
    if (key in model) {
      throw new Error(`Forbidden workspace property: ${key}`);
    }
  }
}
