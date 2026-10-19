import { z } from 'zod';
import {
  IsoDateTimeSchema,
  NonEmptyTrimmedStringSchema,
} from '../common.js';
import { JobFailureCategorySchema, JobFailureCodeSchema, JobStateSchema } from './constants.js';
import { EntityIdSchema } from './primitives.js';

/**
 * Structured job failure attached to Failed or RetryPending states.
 * PP-02 Job State Machine §3–§4.
 */
export const JobFailureSchema = z.object({
  code: JobFailureCodeSchema,
  category: JobFailureCategorySchema,
  message: NonEmptyTrimmedStringSchema,
  retryable: z.boolean(),
  occurredAt: IsoDateTimeSchema,
});

export type JobFailure = z.infer<typeof JobFailureSchema>;

/**
 * Maps failure codes to their canonical category for validation.
 * Runtime services may use this map; PP-03 defines the contract only.
 */
export const JOB_FAILURE_CODE_CATEGORY: Record<
  z.infer<typeof JobFailureCodeSchema>,
  z.infer<typeof JobFailureCategorySchema>
> = {
  invalid_url: 'validation',
  unsupported_platform: 'validation',
  file_too_large: 'validation',
  duration_exceeded: 'validation',
  private_content: 'access',
  geo_blocked: 'access',
  content_removed: 'access',
  attestation_missing: 'rights',
  policy_blocked: 'rights',
  transcription_failed: 'processing',
  analysis_failed: 'processing',
  package_generation_failed: 'processing',
  timeout: 'infrastructure',
  worker_unavailable: 'infrastructure',
  storage_error: 'infrastructure',
  cache_corrupt: 'cache',
};

export const JobFailureSchemaWithCategory = JobFailureSchema.superRefine((value, ctx) => {
  const expected = JOB_FAILURE_CODE_CATEGORY[value.code];
  if (expected !== value.category) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Failure code "${value.code}" requires category "${expected}", received "${value.category}"`,
      path: ['category'],
    });
  }
});

/**
 * Domain error envelope for pipeline and contract validation failures.
 * Safe for user-visible messaging when `exposeToUser` is true.
 */
export const DomainErrorSchema = z.object({
  errorId: EntityIdSchema,
  code: NonEmptyTrimmedStringSchema,
  category: z.enum([
    'validation',
    'access',
    'rights',
    'processing',
    'infrastructure',
    'cache',
    'contract',
  ]),
  message: NonEmptyTrimmedStringSchema,
  exposeToUser: z.boolean(),
  retryable: z.boolean(),
  occurredAt: IsoDateTimeSchema,
  jobId: EntityIdSchema.optional(),
  referenceId: EntityIdSchema.optional(),
});

export type DomainError = z.infer<typeof DomainErrorSchema>;

/** Validates that job state and failure attachment are consistent */
export const JobRecordSchema = z
  .object({
    jobId: EntityIdSchema,
    projectId: EntityIdSchema,
    referenceId: EntityIdSchema,
    state: JobStateSchema,
    progressPercent: z.number().int().min(0).max(100),
    retryOfJobId: EntityIdSchema.optional(),
    cacheHit: z.boolean().optional(),
    failure: JobFailureSchemaWithCategory.optional(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    completedAt: IsoDateTimeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const terminalWithFailure = ['failed', 'retry_pending'] as const;
    const terminalWithoutFailure = ['completed', 'cancelled', 'expired'] as const;

    if (terminalWithFailure.includes(value.state as (typeof terminalWithFailure)[number])) {
      if (!value.failure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `State "${value.state}" requires a failure record`,
          path: ['failure'],
        });
      }
    }

    if (terminalWithoutFailure.includes(value.state as (typeof terminalWithoutFailure)[number])) {
      if (value.failure) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `State "${value.state}" must not include a failure record`,
          path: ['failure'],
        });
      }
    }

    if (value.state === 'completed' && value.progressPercent !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Completed jobs must report 100% progress',
        path: ['progressPercent'],
      });
    }
  });

export type JobRecord = z.infer<typeof JobRecordSchema>;

/** Weighted progress stage labels exposed to UI — PP-02 Job State Machine §6 */
export const JOB_PROGRESS_STAGE_WEIGHTS = {
  validated: 5,
  preparing: 10,
  uploading: 15,
  fingerprinting: 20,
  analyzing: 55,
  generating_packages: 85,
  saving: 95,
  completed: 100,
} as const;

export type JobProgressStage = keyof typeof JOB_PROGRESS_STAGE_WEIGHTS;
