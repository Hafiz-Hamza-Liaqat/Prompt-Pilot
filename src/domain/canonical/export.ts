import { z } from 'zod';
import { IsoDateTimeSchema, NonEmptyTrimmedStringSchema } from '../common.js';
import { ExportFormatSchema } from './constants.js';
import { EntityIdSchema } from './primitives.js';

/**
 * User-facing delivery action serializing one or more Packages.
 * PP-02 Part A — Export.
 */
export const ExportRecordSchema = z.object({
  exportId: EntityIdSchema,
  projectId: EntityIdSchema,
  referenceId: EntityIdSchema,
  packageIds: z.array(EntityIdSchema).min(1),
  format: ExportFormatSchema,
  title: NonEmptyTrimmedStringSchema,
  createdAt: IsoDateTimeSchema,
  createdByUserId: EntityIdSchema,
  transformationNotice: NonEmptyTrimmedStringSchema,
});

export type ExportRecord = z.infer<typeof ExportRecordSchema>;
