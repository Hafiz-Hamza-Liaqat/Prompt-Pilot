import type { JobFailure } from '@/domain/canonical/job';
import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type {
  OrchestrationContext,
  OrchestrationOutcome,
  OrchestrationResult,
} from '@/domain/orchestration';
import type { IsoDateTime } from '@/domain/common';
import type { JobOrchestrator } from '@/server/orchestration';
import type { CacheCoordinator } from './cache-coordinator.js';

export type CacheLookupStageInput = {
  occurredAt: IsoDateTime;
  /** Test-double override when fingerprint stage is not implemented. */
  fingerprintId?: EntityId;
  fingerprintAlgorithmVersion?: MonotonicVersion;
};

function isJobFailureCode(code: string): code is JobFailure['code'] {
  return code in JOB_FAILURE_CODE_CATEGORY;
}

function mapCoordinatorErrorToFailure(
  code: string,
  message: string,
  retryable: boolean | undefined,
  occurredAt: IsoDateTime,
): JobFailure {
  const failureCode = isJobFailureCode(code) ? code : 'storage_error';
  return {
    code: failureCode,
    category: JOB_FAILURE_CODE_CATEGORY[failureCode],
    message,
    retryable: retryable ?? false,
    occurredAt,
  };
}

function resolveFingerprintContext(
  context: OrchestrationContext,
  input: CacheLookupStageInput,
): { fingerprintId: EntityId; fingerprintAlgorithmVersion: MonotonicVersion } | null {
  const fingerprintId = input.fingerprintId ?? context.fingerprintId;
  const fingerprintAlgorithmVersion =
    input.fingerprintAlgorithmVersion ?? context.fingerprintAlgorithmVersion;

  if (!fingerprintId || fingerprintAlgorithmVersion === undefined) {
    return null;
  }

  return { fingerprintId, fingerprintAlgorithmVersion };
}

/**
 * Executes cache lookup then advances orchestrator workflow.
 * JobOrchestrator remains the single workflow authority.
 */
export async function executeCacheLookupStage(
  orchestrator: JobOrchestrator,
  coordinator: CacheCoordinator,
  context: OrchestrationContext,
  input: CacheLookupStageInput,
): Promise<OrchestrationResult<OrchestrationOutcome>> {
  const fingerprint = resolveFingerprintContext(context, input);
  if (!fingerprint) {
    const failed = orchestrator.propagateFailure({
      context,
      failure: {
        code: 'invalid_url',
        category: 'validation',
        message: 'Fingerprint context required before cache lookup',
        retryable: false,
        occurredAt: input.occurredAt,
      },
      occurredAt: input.occurredAt,
      stageId: 'cache_lookup',
    });
    return failed;
  }

  const lookedUp = await coordinator.lookupByFingerprint({
    scope: { ownerId: context.ownerId, projectId: context.projectId },
    fingerprintId: fingerprint.fingerprintId,
    fingerprintAlgorithmVersion: fingerprint.fingerprintAlgorithmVersion,
  });

  if (!lookedUp.ok) {
    return orchestrator.propagateFailure({
      context,
      failure: mapCoordinatorErrorToFailure(
        lookedUp.code,
        lookedUp.message,
        lookedUp.retryable,
        input.occurredAt,
      ),
      occurredAt: input.occurredAt,
      stageId: 'cache_lookup',
    });
  }

  const completed = orchestrator.completeStage(context, {
    stageId: 'cache_lookup',
    jobId: context.job.jobId,
    completedAt: input.occurredAt,
    outcome: 'success',
    cacheHit: lookedUp.data.hit,
    message: lookedUp.data.hit
      ? 'Analysis cache hit'
      : lookedUp.data.corrupt
        ? 'Corrupt cache entry invalidated — continuing to analysis'
        : 'Analysis cache miss',
  });

  if (!completed.ok) {
    return completed;
  }

  return {
    ok: true,
    data: {
      ...completed.data,
      context: {
        ...completed.data.context,
        fingerprintId: fingerprint.fingerprintId,
        fingerprintAlgorithmVersion: fingerprint.fingerprintAlgorithmVersion,
        ...(lookedUp.data.analysisId ? { analysisId: lookedUp.data.analysisId } : {}),
      },
    },
  };
}
