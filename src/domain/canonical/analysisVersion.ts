import { z } from 'zod';
import { AnalysisChangeReasonSchema } from './constants.js';
import { EntityIdSchema, MonotonicVersionSchema } from './primitives.js';

/**
 * Version metadata for an immutable ReferenceVideoAnalysis snapshot.
 * PP-02 Analysis Version section.
 */
export const AnalysisVersionSchema = z.object({
  analysisVersion: MonotonicVersionSchema,
  isLatest: z.boolean(),
  changeReason: AnalysisChangeReasonSchema,
  supersedesAnalysisId: EntityIdSchema.optional(),
});

export type AnalysisVersion = z.infer<typeof AnalysisVersionSchema>;
