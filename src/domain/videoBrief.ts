import { z } from 'zod';
import {
  DurationSecondsSchema,
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  VersionStringSchema,
} from './common.js';
import {
  AspectRatioSchema,
  BudgetPrioritySchema,
  QualityPrioritySchema,
  PublishingDestinationSchema,
  SourceTypeSchema,
  VideoCategorySchema,
} from './constants.js';
import { SourceAnalysisSchema } from './sourceAnalysis.js';
import {
  ProductionRequirementsSchema,
  type ProductionRequirements,
} from './productionRequirements.js';

export { ProductionRequirementsSchema, type ProductionRequirements };

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

export type VideoBrief = z.infer<typeof VideoBriefSchema>;
