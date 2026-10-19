import { describe, expect, it } from 'vitest';
import { parseJobStatusQuery } from '../../src/app/projects/[projectId]/reference/validation.js';
import { resolveJobFailureRemediationCopy } from '../../src/config/job-status.js';
import {
  isPollableJobState,
  mapJobRecordToStatusViewModel,
  mapStartAnalysisFormToSessionHint,
  resolveDisplayedJobStatus,
  resolveJobStatusPresentationState,
  shouldContinueJobStatusPolling,
} from '../../src/domain/workspace/job-status-display.js';
import { mapPersistedJobToStatusViewModel } from '../../src/server/workspace/job-status-view-model.js';
import type { JobRecord } from '../../src/domain/canonical/job';
import type { EntityId } from '../../src/domain/canonical/primitives';

const PROJECT_ID = '22222222-2222-2222-2222-222222222222' as EntityId;
const REFERENCE_ID = '33333333-3333-3333-3333-333333333333' as EntityId;
const JOB_ID = '44444444-4444-4444-4444-444444444444' as EntityId;
const TIMESTAMP = '2026-07-08T00:00:00.000Z';

function buildJob(overrides: Partial<JobRecord> = {}): JobRecord {
  return {
    jobId: JOB_ID,
    projectId: PROJECT_ID,
    referenceId: REFERENCE_ID,
    state: 'analyzing',
    progressPercent: 55,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

describe('job status query validation', () => {
  it('parses a valid project id', () => {
    const parsed = parseJobStatusQuery({ projectId: PROJECT_ID });
    expect(parsed.ok).toBe(true);
  });

  it('rejects an invalid project id', () => {
    const parsed = parseJobStatusQuery({ projectId: 'not-a-uuid' });
    expect(parsed.ok).toBe(false);
  });
});

describe('job status display helpers', () => {
  it('maps persisted jobs to a display view model with progress labels', () => {
    const viewModel = mapPersistedJobToStatusViewModel(buildJob());

    expect(viewModel.jobId).toBe(JOB_ID);
    expect(viewModel.progressLabel).toBe('Analyzing');
    expect(viewModel.progressPercent).toBe(55);
  });

  it('continues polling only for non-terminal running states', () => {
    expect(isPollableJobState('analyzing')).toBe(true);
    expect(isPollableJobState('failed')).toBe(false);
    expect(isPollableJobState('retry_pending')).toBe(false);

    const running = mapJobRecordToStatusViewModel(buildJob({ state: 'fingerprinting', progressPercent: 20 }));
    const failed = mapJobRecordToStatusViewModel(
      buildJob({
        state: 'failed',
        progressPercent: 0,
        failure: {
          code: 'analysis_failed',
          category: 'processing',
          message: 'Analysis failed.',
          retryable: false,
          occurredAt: TIMESTAMP,
        },
      }),
    );

    expect(shouldContinueJobStatusPolling(running)).toBe(true);
    expect(shouldContinueJobStatusPolling(failed)).toBe(false);
    expect(shouldContinueJobStatusPolling(null)).toBe(false);
  });

  it('prefers active polled jobs over session hints', () => {
    const activeJob = mapJobRecordToStatusViewModel(buildJob({ state: 'preparing', progressPercent: 10 }));
    const sessionHint = mapStartAnalysisFormToSessionHint({
      status: 'success',
      jobId: JOB_ID,
      referenceId: REFERENCE_ID,
      terminalState: 'completed',
      message: 'Completed in this browser session.',
    });

    expect(resolveJobStatusPresentationState(activeJob, sessionHint)).toBe('running');
    expect(resolveDisplayedJobStatus(activeJob, sessionHint)?.state).toBe('preparing');
  });

  it('uses session hints for completed and failed outcomes when no active job exists', () => {
    const completedHint = mapStartAnalysisFormToSessionHint({
      status: 'success',
      jobId: JOB_ID,
      referenceId: REFERENCE_ID,
      terminalState: 'completed',
      message: 'Reference analysis completed.',
    });
    const failedHint = mapStartAnalysisFormToSessionHint({
      status: 'error',
      jobId: JOB_ID,
      referenceId: REFERENCE_ID,
      failure: {
        code: 'analysis_failed',
        category: 'processing',
        message: 'Injected failure.',
        retryable: false,
        occurredAt: TIMESTAMP,
      },
      message: 'Analysis failed.',
    });

    expect(resolveJobStatusPresentationState(null, completedHint)).toBe('completed');
    expect(resolveJobStatusPresentationState(null, failedHint)).toBe('failed');
    expect(resolveDisplayedJobStatus(null, failedHint)?.failure?.code).toBe('analysis_failed');
  });

  it('maps failure codes to remediation copy without changing canonical codes', () => {
    const copy = resolveJobFailureRemediationCopy({
      code: 'invalid_url',
      category: 'validation',
      message: 'Invalid URL',
      retryable: false,
      occurredAt: TIMESTAMP,
    });

    expect(copy).toContain('URL');
  });
});
