import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import type { PersistenceErrorCode } from '@/server/persistence';

function isJobFailureCode(code: string): code is keyof typeof JOB_FAILURE_CODE_CATEGORY {
  return code in JOB_FAILURE_CODE_CATEGORY;
}

/** Maps provider-layer errors to coordinator/job failure codes. */
export function mapProviderErrorToCoordinatorCode(code: string): {
  code: string;
  retryable: boolean;
} {
  if (isJobFailureCode(code)) {
    return {
      code,
      retryable: code === 'storage_error' || code === 'worker_unavailable',
    };
  }

  return { code: 'analysis_failed', retryable: false };
}

/** Maps persistence errors — scope_violation must not fall through to storage_error. */
export function mapPersistenceErrorToCoordinatorCode(code: PersistenceErrorCode): {
  code: string;
  retryable: boolean;
} {
  switch (code) {
    case 'scope_violation':
      return { code: 'policy_blocked', retryable: false };
    case 'persistence_error':
      return { code: 'storage_error', retryable: true };
    case 'forbidden':
      return { code: 'policy_blocked', retryable: false };
    default:
      return { code: 'storage_error', retryable: true };
  }
}

/** Cache coordinator failures already use job-layer storage_error. */
export function mapCacheErrorToCoordinatorCode(code: string, retryable?: boolean): {
  code: string;
  retryable: boolean;
} {
  if (code === 'storage_error') {
    return { code: 'storage_error', retryable: retryable ?? true };
  }

  if (isJobFailureCode(code)) {
    return { code, retryable: retryable ?? false };
  }

  return { code: 'storage_error', retryable: retryable ?? true };
}
