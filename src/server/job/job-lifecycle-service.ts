import type {
  Job,
  JobLifecycleResult,
  JobRegistration,
  JobTransitionRequest,
  JobTransitionResult,
} from '@/domain/job';
import type {
  JobResumeCheckpointRecord,
  JobResumeDecision,
  RetryDecision,
  RetryPolicy,
  UploadResumeRequest,
} from '@/domain/job';
import type { JobRecord } from '@/domain/canonical';
import type { AppendJobLifecycleEventInput, JobLifecycleEvent } from '@/domain/job';

/**
 * Pure lifecycle validation and transition planning.
 * Implementations must remain persistence-agnostic (PP-06).
 */
export interface JobTransitionService {
  createInitialJob(registration: JobRegistration): JobRecord;
  validateTransition(job: Job, request: JobTransitionRequest): JobLifecycleResult<JobTransitionResult>;
  applyTransition(job: Job, request: JobTransitionRequest): JobRecord;
}

/**
 * Cancellation and expiry contracts for orchestrator coordination.
 */
export interface JobCancellationService {
  canCancel(job: JobRecord): boolean;
  cancel(job: JobRecord, requestedAt: string): JobLifecycleResult<JobRecord>;
  expire(job: JobRecord, expiredAt: string): JobLifecycleResult<JobRecord>;
}

/**
 * Retry planning — creates new job identity; does not persist.
 */
export interface JobRetryService {
  evaluateRetry(job: JobRecord, attemptNumber: number, policy?: RetryPolicy): RetryDecision;
  resolveBackoffMs(attemptNumber: number, policy?: RetryPolicy): number;
}

/**
 * Resume eligibility for worker crash and upload interruption paths.
 */
export interface JobResumeService {
  evaluateResume(job: JobRecord, checkpoint: JobResumeCheckpointRecord): JobResumeDecision;
  canResumeUpload(job: JobRecord): boolean;
  planUploadResume(job: JobRecord, request: UploadResumeRequest): JobLifecycleResult<JobRecord>;
}

/**
 * Append-only lifecycle event stream (interface only — no storage).
 */
export interface JobEventStreamService {
  append(jobId: string, event: AppendJobLifecycleEventInput): Promise<JobLifecycleEvent>;
  list(filter: { jobId: string }): Promise<JobLifecycleEvent[]>;
}

/**
 * Facade consumed by orchestrator (PP-08).
 */
export interface JobLifecycleService
  extends JobTransitionService,
    JobCancellationService,
    JobRetryService,
    JobResumeService {}

export const JOB_LIFECYCLE_TOKENS = {
  transitionService: Symbol.for('prompt-pilot.job.JobTransitionService'),
  cancellationService: Symbol.for('prompt-pilot.job.JobCancellationService'),
  retryService: Symbol.for('prompt-pilot.job.JobRetryService'),
  resumeService: Symbol.for('prompt-pilot.job.JobResumeService'),
  eventStreamService: Symbol.for('prompt-pilot.job.JobEventStreamService'),
  lifecycleService: Symbol.for('prompt-pilot.job.JobLifecycleService'),
} as const;
