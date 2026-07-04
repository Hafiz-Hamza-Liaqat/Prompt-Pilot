import { z } from 'zod';
import { MAX_DURATION_SECONDS, MIN_DURATION_SECONDS } from './constants.js';

export const NonEmptyTrimmedStringSchema = z
  .string()
  .trim()
  .min(1, 'Value must not be empty');

export const OptionalNonEmptyStringSchema = z
  .string()
  .trim()
  .min(1)
  .optional();

export const PercentageScoreSchema = z
  .number()
  .int('Score must be a whole number')
  .min(0, 'Score must be at least 0')
  .max(100, 'Score must be at most 100');

export const PositiveIntegerSchema = z
  .number()
  .int('Value must be a whole number')
  .positive('Value must be greater than zero');

export const DurationSecondsSchema = z
  .number()
  .int('Duration must be a whole number of seconds')
  .min(MIN_DURATION_SECONDS, `Duration must be at least ${MIN_DURATION_SECONDS} seconds`)
  .max(MAX_DURATION_SECONDS, `Duration must be at most ${MAX_DURATION_SECONDS} seconds`);

export const IsoDateTimeSchema = z
  .string()
  .datetime({ offset: true, message: 'Must be a valid ISO 8601 date-time string' });

export const VersionStringSchema = NonEmptyTrimmedStringSchema.regex(
  /^[\d]+(?:\.[\d]+)*$/,
  'Version must use dotted numeric segments (e.g. 1.0.0)',
);

export const HttpHttpsUrlSchema = z
  .string()
  .url('Must be a valid URL')
  .refine(
    (value) => value.startsWith('http://') || value.startsWith('https://'),
    'URL must use HTTP or HTTPS',
  );

export const OptionalHttpHttpsUrlSchema = HttpHttpsUrlSchema.optional();

export const SourceReferenceSchema = z.object({
  label: NonEmptyTrimmedStringSchema,
  url: OptionalHttpHttpsUrlSchema,
});

export const WarningRecordSchema = z.object({
  code: NonEmptyTrimmedStringSchema,
  severity: z.enum(['info', 'warning', 'error']),
  message: NonEmptyTrimmedStringSchema,
  sceneId: NonEmptyTrimmedStringSchema.optional(),
});

export type NonEmptyTrimmedString = z.infer<typeof NonEmptyTrimmedStringSchema>;
export type OptionalNonEmptyString = z.infer<typeof OptionalNonEmptyStringSchema>;
export type PercentageScore = z.infer<typeof PercentageScoreSchema>;
export type PositiveInteger = z.infer<typeof PositiveIntegerSchema>;
export type DurationSeconds = z.infer<typeof DurationSecondsSchema>;
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;
export type VersionString = z.infer<typeof VersionStringSchema>;
export type SourceReference = z.infer<typeof SourceReferenceSchema>;
export type WarningRecord = z.infer<typeof WarningRecordSchema>;
