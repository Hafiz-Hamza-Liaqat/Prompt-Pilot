import { z } from 'zod';
import {
  AccessStatusSchema,
  MediaKindSchema,
  ReferenceKindSchema,
  ReferencePlatformSchema,
} from '../canonical/constants.js';
import { EntityIdSchema } from '../canonical/primitives.js';
import {
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
  OptionalHttpHttpsUrlSchema,
} from '../common.js';

export const LinkMetadataSchema = z.object({
  linkMetadataId: EntityIdSchema,
  referenceId: EntityIdSchema,
  projectId: EntityIdSchema,
  ownerId: EntityIdSchema,
  referenceKind: ReferenceKindSchema,
  platform: ReferencePlatformSchema,
  platformContentId: NonEmptyTrimmedStringSchema,
  canonicalUrl: NonEmptyTrimmedStringSchema,
  originalUrl: NonEmptyTrimmedStringSchema,
  title: NonEmptyTrimmedStringSchema.optional(),
  authorLabel: NonEmptyTrimmedStringSchema.optional(),
  channelId: NonEmptyTrimmedStringSchema.optional(),
  durationSeconds: z.number().int().positive().optional(),
  publishedAt: IsoDateTimeSchema.optional(),
  language: NonEmptyTrimmedStringSchema.optional(),
  thumbnailUrl: OptionalHttpHttpsUrlSchema,
  aspectRatio: NonEmptyTrimmedStringSchema.optional(),
  mediaKind: MediaKindSchema.optional(),
  accessStatus: AccessStatusSchema,
  embedAllowed: z.boolean().optional(),
  providerId: z.enum(['youtube', 'vimeo', 'mock']),
  extractionMethod: z.enum(['oembed', 'api', 'mock']),
  extractedAt: IsoDateTimeSchema,
  linkMetadataVersion: NonEmptyTrimmedStringSchema,
});
