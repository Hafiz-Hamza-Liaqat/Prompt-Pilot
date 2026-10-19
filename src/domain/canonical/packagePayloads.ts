import { z } from 'zod';
import { NonEmptyTrimmedStringSchema } from '../common.js';
import { CompiledPromptSchema } from '../compiledPrompt.js';
import { ContinuityBibleSchema } from '../continuityBible.js';
import { SceneTimelineSchema } from '../scenePlan.js';

/** Blueprint Package payload — prescriptive production plan derived from analysis */
export const BlueprintPackagePayloadSchema = z.object({
  storyboardSummary: NonEmptyTrimmedStringSchema.optional(),
  sceneTimeline: SceneTimelineSchema.optional(),
  continuityBible: ContinuityBibleSchema.optional(),
  cameraNotes: z.array(NonEmptyTrimmedStringSchema),
  lightingNotes: z.array(NonEmptyTrimmedStringSchema),
  voiceoverStructure: z.array(NonEmptyTrimmedStringSchema),
  audioMoodNotes: z.array(NonEmptyTrimmedStringSchema),
});

/** Prompt Package payload — provider-ready compiled prompts */
export const PromptPackagePayloadSchema = z.object({
  masterPrompt: NonEmptyTrimmedStringSchema,
  compiledPrompts: z.array(CompiledPromptSchema),
});

/** SEO Package payload — discoverability artifacts from SEO Seeds */
export const SeoPackagePayloadSchema = z.object({
  titleCandidates: z.array(NonEmptyTrimmedStringSchema),
  metaDescriptionCandidates: z.array(NonEmptyTrimmedStringSchema),
  keywords: z.array(NonEmptyTrimmedStringSchema),
  semanticKeywords: z.array(NonEmptyTrimmedStringSchema),
  longTailKeywords: z.array(NonEmptyTrimmedStringSchema),
  tags: z.array(NonEmptyTrimmedStringSchema),
  hashtags: z.array(NonEmptyTrimmedStringSchema),
  publishingChecklist: z.array(NonEmptyTrimmedStringSchema),
});

/** Marketing Package payload — audience and performance-oriented copy */
export const MarketingPackagePayloadSchema = z.object({
  hookAnalysis: NonEmptyTrimmedStringSchema.optional(),
  retentionNotes: z.array(NonEmptyTrimmedStringSchema),
  audiencePersona: NonEmptyTrimmedStringSchema.optional(),
  viralPatternNotes: z.array(NonEmptyTrimmedStringSchema),
});

/** Repurposing format section within one Repurposing Package */
export const RepurposingFormatSectionSchema = z.object({
  formatKey: NonEmptyTrimmedStringSchema,
  title: NonEmptyTrimmedStringSchema,
  body: NonEmptyTrimmedStringSchema,
});

/** Repurposing Package payload — cross-format text outputs */
export const RepurposingPackagePayloadSchema = z.object({
  formats: z.array(RepurposingFormatSectionSchema).min(1),
});

export type BlueprintPackagePayload = z.infer<typeof BlueprintPackagePayloadSchema>;
export type PromptPackagePayload = z.infer<typeof PromptPackagePayloadSchema>;
export type SeoPackagePayload = z.infer<typeof SeoPackagePayloadSchema>;
export type MarketingPackagePayload = z.infer<typeof MarketingPackagePayloadSchema>;
export type RepurposingPackagePayload = z.infer<typeof RepurposingPackagePayloadSchema>;
