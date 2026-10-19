import type { JobRecord } from '@/domain/canonical';
import {
  applyJobTransition,
  buildExpirationTransition,
  canCancelJob,
  cancelJob,
  createInitialJobRecord,
  evaluateJobRetry,
  evaluateResume,
  isJobExpirableState,
  resolveRetryBackoffMs,
  validateJobTransition,
  canResumeUpload as canResumeUploadJob,
  type Job,
  type JobLifecycleResult,
  type JobRegistration,
  type JobResumeCheckpointRecord,
  type JobResumeDecision,
  type JobTransitionRequest,
  type JobTransitionResult,
  type RetryDecision,
  type RetryPolicy,
  type UploadResumeRequest,
} from '@/domain/job';
import type {
  JobCancellationService,
  JobLifecycleService,
  JobResumeService,
  JobRetryService,
  JobTransitionService,
} from './job-lifecycle-service';

/**
 * Default in-memory lifecycle implementation.
 * Persistence and workers are wired in later phases.
 */
export class DefaultJobLifecycleService
  implements JobLifecycleService, JobTransitionService, JobCancellationService, JobRetryService, JobResumeService
{
  createInitialJob(registration: JobRegistration): JobRecord {
    return createInitialJobRecord(registration);
  }

  validateTransition(job: Job, request: JobTransitionRequest): JobLifecycleResult<JobTransitionResult> {
    return validateJobTransition(job, request);
  }

  applyTransition(job: Job, request: JobTransitionRequest): JobRecord {
    return applyJobTransition(job, request);
  }

  canCancel(job: JobRecord): boolean {
    return canCancelJob(job);
  }

  cancel(job: JobRecord, requestedAt: string): JobLifecycleResult<JobRecord> {
    return cancelJob(job, requestedAt);
  }

  expire(job: JobRecord, expiredAt: string): JobLifecycleResult<JobRecord> {
    if (!isJobExpirableState(job.state)) {
      return {
        ok: false,
        error: {
          code: 'invalid_transition',
          message: `Job in state "${job.state}" cannot expire`,
          fromState: job.state,
          toState: 'expired',
        },
      };
    }

    return { ok: true, data: buildExpirationTransition(job, expiredAt) };
  }

  evaluateRetry(job: JobRecord, attemptNumber: number, policy?: RetryPolicy): RetryDecision {
    return evaluateJobRetry(job, attemptNumber, policy);
  }

  resolveBackoffMs(attemptNumber: number, policy?: RetryPolicy): number {
    return resolveRetryBackoffMs(attemptNumber, policy);
  }

  evaluateResume(job: JobRecord, checkpoint: JobResumeCheckpointRecord): JobResumeDecision {
    return evaluateResume(job, checkpoint);
  }

  canResumeUpload(job: JobRecord): boolean {
    return canResumeUploadJob(job);
  }

  planUploadResume(job: JobRecord, request: UploadResumeRequest): JobLifecycleResult<JobRecord> {
    if (!canResumeUploadJob(job)) {
      return {
        ok: false,
        error: {
          code: 'resume_not_allowed',
          message: `Upload resume is not allowed in state "${job.state}"`,
          fromState: job.state,
        },
      };
    }

    return {
      ok: true,
      data: {
        ...job,
        state: 'uploading',
        updatedAt: request.requestedAt,
      },
    };
  }
}

export function createDefaultJobLifecycleService(): JobLifecycleService {
  return new DefaultJobLifecycleService();
}
