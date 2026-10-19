import { z } from 'zod';
import { IsoDateTimeSchema, NonEmptyTrimmedStringSchema } from '../common.js';
import { FingerprintStateSchema, ReferenceKindSchema } from './constants.js';
import { EntityIdSchema, MonotonicVersionSchema } from './primitives.js';

/** Descriptive label for an input factor included in fingerprint identity */
export const FingerprintInputDescriptorSchema = z.object({
  factor: NonEmptyTrimmedStringSchema,
  descriptor: NonEmptyTrimmedStringSchema,
});

/**
 * Stable content identity for cache lookup and deduplication.
 * PP-02 Content Fingerprint — not analysis, not a Package.
 */
export const ContentFingerprintSchema = z.object({
  fingerprintId: EntityIdSchema,
  referenceKind: ReferenceKindSchema,
  fingerprintAlgorithmVersion: MonotonicVersionSchema,
  fingerprintInputs: z.array(FingerprintInputDescriptorSchema).min(1),
  state: FingerprintStateSchema,
  createdAt: IsoDateTimeSchema,
  invalidatedAt: IsoDateTimeSchema.optional(),
  expiredAt: IsoDateTimeSchema.optional(),
});

export type FingerprintInputDescriptor = z.infer<typeof FingerprintInputDescriptorSchema>;
export type ContentFingerprint = z.infer<typeof ContentFingerprintSchema>;
