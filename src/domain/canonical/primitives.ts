import { z } from 'zod';
import {
  NonEmptyTrimmedStringSchema,
  PositiveIntegerSchema,
  VersionStringSchema,
} from '../common.js';
import { ConfidenceClassificationSchema } from './constants.js';

/** Opaque entity identifier — format not prescribed in PP-02 */
export const EntityIdSchema = NonEmptyTrimmedStringSchema;

/** Monotonic integer version (analysis, package, fingerprint algorithm) */
export const MonotonicVersionSchema = PositiveIntegerSchema;

/** Pipeline or generator semantic version string */
export const SemanticVersionSchema = VersionStringSchema;

/** Millisecond timestamp offset within media timeline */
export const TimelineMsSchema = z
  .number()
  .int('Timeline offset must be a whole number of milliseconds')
  .nonnegative('Timeline offset must not be negative');

/** Per-field or per-section confidence map */
export const ConfidenceMapSchema = z.record(
  NonEmptyTrimmedStringSchema,
  ConfidenceClassificationSchema,
);

/** Value paired with confidence classification for material fields */
export function withConfidence<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema,
    confidence: ConfidenceClassificationSchema,
  });
}

export type EntityId = z.infer<typeof EntityIdSchema>;
export type MonotonicVersion = z.infer<typeof MonotonicVersionSchema>;
export type SemanticVersion = z.infer<typeof SemanticVersionSchema>;
export type TimelineMs = z.infer<typeof TimelineMsSchema>;
export type ConfidenceMap = z.infer<typeof ConfidenceMapSchema>;
