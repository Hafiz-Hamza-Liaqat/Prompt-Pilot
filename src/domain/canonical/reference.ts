import { z } from 'zod';
import {
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  OptionalHttpHttpsUrlSchema,
} from '../common.js';
import {
  AccessStatusSchema,
  ReferenceKindSchema,
  ReferencePlatformSchema,
} from './constants.js';
import { EntityIdSchema } from './primitives.js';

/**
 * User-submitted intake artifact attached to a Project.
 * PP-02 Part A — Reference.
 */
export const ReferenceSchema = z.object({
  referenceId: EntityIdSchema,
  projectId: EntityIdSchema,
  referenceKind: ReferenceKindSchema,
  platform: ReferencePlatformSchema.optional(),
  canonicalUrl: OptionalHttpHttpsUrlSchema,
  platformContentId: NonEmptyTrimmedStringSchema.optional(),
  title: NonEmptyTrimmedStringSchema.optional(),
  submittedAt: IsoDateTimeSchema,
  accessStatus: AccessStatusSchema,
  rightsAttestationId: EntityIdSchema.optional(),
});

export type Reference = z.infer<typeof ReferenceSchema>;
