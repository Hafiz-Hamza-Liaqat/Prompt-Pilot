import { z } from 'zod';
import {
  DurationSecondsSchema,
  IsoDateTimeSchema,
  PositiveIntegerSchema,
} from '../../common.js';
import { CONTENT_HASH_ALGORITHMS } from '../constants.js';

export const ContentHashSchema = z.object({
  algorithm: z.enum(CONTENT_HASH_ALGORITHMS),
  digest: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/i, 'SHA-256 digest must be 64 hexadecimal characters'),
});

export type ContentHash = z.infer<typeof ContentHashSchema>;

export const FileMetadataSchema = z.object({
  fileName: z.string().trim().min(1).max(255).optional(),
  mimeType: z.string().trim().min(1),
  byteSize: PositiveIntegerSchema,
  durationSeconds: DurationSecondsSchema.optional(),
  contentHash: ContentHashSchema.optional(),
  lastModifiedAt: IsoDateTimeSchema.optional(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export type FileMetadataInput = z.input<typeof FileMetadataSchema>;
