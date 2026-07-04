import { z } from 'zod';
import {
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  VersionStringSchema,
} from './common.js';
import { AiVideoProviderSchema } from './constants.js';

export const SuggestedSettingSchema = z.object({
  key: NonEmptyTrimmedStringSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
  explanation: NonEmptyTrimmedStringSchema.optional(),
});

export const CompiledPromptSchema = z.object({
  promptId: NonEmptyTrimmedStringSchema,
  sceneId: NonEmptyTrimmedStringSchema,
  provider: AiVideoProviderSchema,
  providerModel: NonEmptyTrimmedStringSchema,
  compilerVersion: VersionStringSchema,
  mainPrompt: NonEmptyTrimmedStringSchema,
  shortPrompt: NonEmptyTrimmedStringSchema,
  detailedPrompt: NonEmptyTrimmedStringSchema,
  negativeConstraints: z.array(NonEmptyTrimmedStringSchema),
  referenceAssetInstructions: z.array(NonEmptyTrimmedStringSchema),
  suggestedSettings: z.array(SuggestedSettingSchema),
  expectedWeaknesses: z.array(NonEmptyTrimmedStringSchema),
  retryVariation: NonEmptyTrimmedStringSchema,
  fallbackProviderPrompt: NonEmptyTrimmedStringSchema.optional(),
  createdAt: IsoDateTimeSchema,
});

export type SuggestedSetting = z.infer<typeof SuggestedSettingSchema>;
export type CompiledPrompt = z.infer<typeof CompiledPromptSchema>;
