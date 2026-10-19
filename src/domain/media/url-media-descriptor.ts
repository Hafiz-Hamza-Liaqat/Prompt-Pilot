import { z } from 'zod';
import {
  AccessStatusSchema,
  MediaKindSchema,
  ReferenceKindSchema,
  ReferencePlatformSchema,
} from '../canonical/constants.js';
import { EntityIdSchema } from '../canonical/primitives.js';
import { IsoDateTimeSchema, NonEmptyTrimmedStringSchema, OptionalHttpHttpsUrlSchema } from '../common.js';

/** URL reference media descriptor — no StorageLocator (G-29). */
export const UrlMediaIntakeDescriptorSchema = z.object({
  descriptorId: EntityIdSchema,
  referenceId: EntityIdSchema,
  projectId: EntityIdSchema,
  ownerId: EntityIdSchema,
  jobId: EntityIdSchema.optional(),
  referenceKind: ReferenceKindSchema,
  platform: ReferencePlatformSchema,
  platformContentId: NonEmptyTrimmedStringSchema,
  canonicalUrl: NonEmptyTrimmedStringSchema,
  title: NonEmptyTrimmedStringSchema.optional(),
  authorLabel: NonEmptyTrimmedStringSchema.optional(),
  durationSeconds: z.number().int().positive().optional(),
  mimeType: NonEmptyTrimmedStringSchema,
  mediaKind: MediaKindSchema,
  thumbnailUrl: OptionalHttpHttpsUrlSchema,
  accessStatus: AccessStatusSchema,
  linkMetadataId: EntityIdSchema,
  resolvedAt: IsoDateTimeSchema,
});

export type UrlMediaIntakeDescriptor = z.infer<typeof UrlMediaIntakeDescriptorSchema>;
