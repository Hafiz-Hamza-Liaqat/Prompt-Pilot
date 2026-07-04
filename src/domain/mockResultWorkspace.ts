import { z } from 'zod';
import { IsoDateTimeSchema } from './common';
import { projectIdSchema } from './project';
import type { ProductionRequirementKey } from './productionRequirements';
import {
  PRODUCTION_REQUIREMENT_KEYS,
  PRODUCTION_REQUIREMENT_LABELS,
  ProductionRequirementsSchema,
} from './productionRequirements';

export const WORKSPACE_MODES = ['mock_preview'] as const;
export const DATA_ORIGINS = ['static_fixture'] as const;
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

export const MOCK_SCENE_IDS = [
  'sample-scene-opening-hook',
  'sample-scene-context-problem',
  'sample-scene-core-message',
  'sample-scene-closing-direction',
] as const;

export const WORKSPACE_FIXTURE_VERSION = 'mock-v1' as const;

export const WORKSPACE_SAMPLE_DISCLAIMER =
  'The result sections below use static demonstration data. They have not been generated, calculated, or recommended for this project.';

export const WORKSPACE_PREVIEW_TITLE = 'Sample workspace preview';

const SampleRecordSchema = z.object({
  isSample: z.literal(true),
});

export const WorkspaceModeSchema = z.enum(WORKSPACE_MODES);
export const DataOriginSchema = z.enum(DATA_ORIGINS);
export const WorkspaceSectionSchema = z.enum(WORKSPACE_SECTIONS);
export const ProviderReferenceStateSchema = z.enum(PROVIDER_REFERENCE_STATES);
export const EvaluationStateSchema = z.enum(EVALUATION_STATES);
export const MockPromptSectionKeySchema = z.enum(MOCK_PROMPT_SECTION_KEYS);

export const MockSceneSchema = SampleRecordSchema.extend({
  id: z.enum(MOCK_SCENE_IDS),
  order: z.number().int().min(1).max(4),
  label: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  sampleContent: z.string().trim().min(1),
}).superRefine((value, ctx) => {
  if (value.id.includes('provider')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sample scenes must not include provider identifiers',
      path: ['id'],
    });
  }
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

export const MockQualityItemSchema = SampleRecordSchema.extend({
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
  sampleScenes: z.array(MockSceneSchema).length(4),
  samplePromptSections: z.array(MockPromptSectionSchema).min(8),
  continuityItems: z.array(MockContinuityItemSchema).min(1),
  audioEditingItems: z.array(MockAudioEditingItemSchema).min(1),
  qualityItems: z.array(MockQualityItemSchema).min(1),
});

export const MockResultWorkspaceViewModelSchema = z
  .object({
    mode: WorkspaceModeSchema,
    dataOrigin: DataOriginSchema,
    isDecisionReady: z.literal(false),
    fixtureVersion: z.literal(WORKSPACE_FIXTURE_VERSION),
    sampleDisclaimer: z.string().trim().min(1),
    previewTitle: z.literal(WORKSPACE_PREVIEW_TITLE),
    activeSection: WorkspaceSectionSchema,
    project: WorkspaceProjectSummarySchema,
    brief: WorkspaceBriefSummarySchema,
    providers: z.array(WorkspaceProviderReferenceSchema).length(5),
    sampleScenes: z.array(MockSceneSchema).length(4),
    samplePromptSections: z.array(MockPromptSectionSchema).min(8),
    continuityItems: z.array(MockContinuityItemSchema).min(1),
    audioEditingItems: z.array(MockAudioEditingItemSchema).min(1),
    qualityItems: z.array(MockQualityItemSchema).min(1),
  })
  .strict();

export type WorkspaceMode = z.infer<typeof WorkspaceModeSchema>;
export type DataOrigin = z.infer<typeof DataOriginSchema>;
export type WorkspaceSection = z.infer<typeof WorkspaceSectionSchema>;
export type ProviderReferenceState = z.infer<typeof ProviderReferenceStateSchema>;
export type EvaluationState = z.infer<typeof EvaluationStateSchema>;
export type MockScene = z.infer<typeof MockSceneSchema>;
export type MockPromptSection = z.infer<typeof MockPromptSectionSchema>;
export type MockContinuityItem = z.infer<typeof MockContinuityItemSchema>;
export type MockAudioEditingItem = z.infer<typeof MockAudioEditingItemSchema>;
export type MockQualityItem = z.infer<typeof MockQualityItemSchema>;
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
