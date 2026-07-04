import { z } from 'zod';
import { NonEmptyTrimmedStringSchema, PositiveIntegerSchema } from './common.js';
import { AspectRatioSchema } from './constants.js';

export const ExportSettingsSchema = z.object({
  aspectRatio: AspectRatioSchema,
  resolutionLabel: NonEmptyTrimmedStringSchema,
  frameRateGuidance: NonEmptyTrimmedStringSchema,
  fileFormatGuidance: NonEmptyTrimmedStringSchema,
  audioGuidance: NonEmptyTrimmedStringSchema,
});

export const EditingRoadmapSchema = z.object({
  clipOrder: z.array(PositiveIntegerSchema).min(1),
  timelineInstructions: z.array(NonEmptyTrimmedStringSchema),
  trimInstructions: z.array(NonEmptyTrimmedStringSchema),
  transitionInstructions: z.array(NonEmptyTrimmedStringSchema),
  speedChangeInstructions: z.array(NonEmptyTrimmedStringSchema),
  captionInstructions: z.array(NonEmptyTrimmedStringSchema),
  onScreenTextInstructions: z.array(NonEmptyTrimmedStringSchema),
  logoPlacementGuidance: z.array(NonEmptyTrimmedStringSchema),
  musicTiming: z.array(NonEmptyTrimmedStringSchema),
  soundEffectTiming: z.array(NonEmptyTrimmedStringSchema),
  callToActionTiming: z.array(NonEmptyTrimmedStringSchema),
  exportSettings: ExportSettingsSchema,
  finalQualityChecklist: z.array(NonEmptyTrimmedStringSchema),
});

export type ExportSettings = z.infer<typeof ExportSettingsSchema>;
export type EditingRoadmap = z.infer<typeof EditingRoadmapSchema>;
