import type { JobFailure } from '@/domain/canonical/job';

export const JOB_STATUS_POLL_INTERVAL_MS = 2500;

export const JOB_FAILURE_REMEDIATION_COPY: Partial<Record<JobFailure['code'], string>> = {
  invalid_url: 'Check the reference URL and submit the reference again.',
  unsupported_platform: 'This reference platform is not supported for analysis yet.',
  attestation_missing: 'Accept the rights attestation before starting analysis.',
  policy_blocked: 'Review the rights attestation and reference policy requirements.',
  analysis_failed: 'You can start analysis again from this project page.',
  transcription_failed: 'Verify the transcript or script content and try again.',
  timeout: 'Try again in a moment. Contact support if the problem continues.',
  worker_unavailable: 'Try again in a moment. Contact support if the problem continues.',
  storage_error: 'Try again in a moment. Contact support if the problem continues.',
  cache_corrupt: 'Start analysis again to rebuild persisted results.',
};

export function resolveJobFailureRemediationCopy(failure: JobFailure): string | null {
  return JOB_FAILURE_REMEDIATION_COPY[failure.code] ?? null;
}
