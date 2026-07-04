import { z } from 'zod';
import {
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  PercentageScoreSchema,
  VersionStringSchema,
  WarningRecordSchema,
} from './common.js';

export const QualityAuditSchema = z.object({
  overallReadinessScore: PercentageScoreSchema,
  missingSubjectWarnings: z.array(WarningRecordSchema),
  missingActionWarnings: z.array(WarningRecordSchema),
  contradictionWarnings: z.array(WarningRecordSchema),
  timingWarnings: z.array(WarningRecordSchema),
  unsupportedFeatureWarnings: z.array(WarningRecordSchema),
  continuityWarnings: z.array(WarningRecordSchema),
  cameraWarnings: z.array(WarningRecordSchema),
  exactTextWarnings: z.array(WarningRecordSchema),
  dialogueDurationWarnings: z.array(WarningRecordSchema),
  safetyWarnings: z.array(WarningRecordSchema),
  generalRecommendations: z.array(NonEmptyTrimmedStringSchema),
  auditedAt: IsoDateTimeSchema,
  auditorVersion: VersionStringSchema,
});

export type QualityAudit = z.infer<typeof QualityAuditSchema>;
