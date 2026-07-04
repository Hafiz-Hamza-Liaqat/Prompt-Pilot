import { z } from 'zod';
import { NonEmptyTrimmedStringSchema, SourceReferenceSchema } from './common.js';
import { SourceTypeSchema } from './constants.js';

export const SourceAnalysisSchema = z.object({
  sourceType: SourceTypeSchema,
  originalInput: NonEmptyTrimmedStringSchema,
  sourceTitle: NonEmptyTrimmedStringSchema.optional(),
  sourceSummary: NonEmptyTrimmedStringSchema.optional(),
  keyFacts: z.array(NonEmptyTrimmedStringSchema),
  productFeatures: z.array(NonEmptyTrimmedStringSchema),
  audienceHints: z.array(NonEmptyTrimmedStringSchema),
  visualOpportunities: z.array(NonEmptyTrimmedStringSchema),
  factualClaims: z.array(NonEmptyTrimmedStringSchema),
  unverifiedClaims: z.array(NonEmptyTrimmedStringSchema),
  safetyWarnings: z.array(NonEmptyTrimmedStringSchema),
  sourceReferences: z.array(SourceReferenceSchema),
});

export type SourceAnalysis = z.infer<typeof SourceAnalysisSchema>;
