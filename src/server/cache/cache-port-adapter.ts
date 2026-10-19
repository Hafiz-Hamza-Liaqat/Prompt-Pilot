import type { JobFailure } from '@/domain/canonical/job';
import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import { orchestrationErr, orchestrationOk } from '@/domain/orchestration';
import type {
  CacheLookupOutcome,
  CacheLookupRequest,
  CachePort,
  CachePortResult,
} from '@/server/orchestration/ports';
import type { CacheCoordinator } from './cache-coordinator.js';

function isJobFailureCode(code: string): code is JobFailure['code'] {
  return code in JOB_FAILURE_CODE_CATEGORY;
}

function mapCoordinatorCodeToJobFailure(code: string): JobFailure['code'] {
  if (isJobFailureCode(code)) {
    return code;
  }
  return 'storage_error';
}

/** Adapts CacheCoordinator to the orchestrator delegate port. */
export function createCachePort(coordinator: CacheCoordinator): CachePort {
  return {
    async lookup(request: CacheLookupRequest): Promise<CachePortResult> {
      const result = await coordinator.lookupByFingerprint({
        scope: { ownerId: request.ownerId, projectId: request.projectId },
        fingerprintId: request.fingerprintId,
        fingerprintAlgorithmVersion: request.fingerprintAlgorithmVersion,
      });

      if (!result.ok) {
        return orchestrationErr('validation_error', result.message, {
          stageId: 'cache_lookup',
          jobFailureCode: mapCoordinatorCodeToJobFailure(result.code),
        });
      }

      const outcome: CacheLookupOutcome = {
        hit: result.data.hit,
        analysisId: result.data.analysisId,
        cacheKey: result.data.cacheKey,
        corrupt: result.data.corrupt,
      };

      return orchestrationOk(outcome);
    },
  };
}
