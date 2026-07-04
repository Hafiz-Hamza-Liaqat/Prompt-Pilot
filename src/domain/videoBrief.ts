import { z } from 'zod';
import {
  DurationSecondsSchema,
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  PercentageScoreSchema,
  SourceReferenceSchema,
  VersionStringSchema,
} from './common.js';
import {
  AiVideoProviderSchema,
  AspectRatioSchema,
  BudgetPrioritySchema,
  QualityPrioritySchema,
  PublishingDestinationSchema,
  SourceTypeSchema,
  VideoCategorySchema,
} from './constants.js';
import { SourceAnalysisSchema } from './sourceAnalysis.js';

export const ProductionRequirementsSchema = z.object({
  characterConsistency: z.boolean(),
  productConsistency: z.boolean(),
  logoAccuracy: z.boolean(),
  exactTextVisibility: z.boolean(),
  nativeAudio: z.boolean(),
  dialogue: z.boolean(),
  voiceover: z.boolean(),
  lipSync: z.boolean(),
  multipleLocations: z.boolean(),
  cameraControl: z.boolean(),
  firstLastFrameControl: z.boolean(),
  videoExtension: z.boolean(),
  referenceImages: z.boolean(),
  commercialUse: z.boolean(),
});

export const VideoBriefSchema = z.object({
  briefId: NonEmptyTrimmedStringSchema,
  projectId: NonEmptyTrimmedStringSchema,
  sourceType: SourceTypeSchema,
  workingTitle: NonEmptyTrimmedStringSchema,
  userObjective: NonEmptyTrimmedStringSchema,
  targetAudience: NonEmptyTrimmedStringSchema,
  publishingDestination: PublishingDestinationSchema,
  videoCategory: VideoCategorySchema,
  durationSeconds: DurationSecondsSchema,
  aspectRatio: AspectRatioSchema,
  visualStyle: NonEmptyTrimmedStringSchema,
  tone: NonEmptyTrimmedStringSchema,
  budgetPriority: BudgetPrioritySchema,
  qualityPriority: QualityPrioritySchema,
  productionRequirements: ProductionRequirementsSchema,
  userConstraints: z.array(NonEmptyTrimmedStringSchema),
  sourceAnalysis: SourceAnalysisSchema,
  createdAt: IsoDateTimeSchema,
  contractVersion: VersionStringSchema,
});

export type ProductionRequirements = z.infer<typeof ProductionRequirementsSchema>;
export type VideoBrief = z.infer<typeof VideoBriefSchema>;
