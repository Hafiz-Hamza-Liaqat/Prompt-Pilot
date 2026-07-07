import type { JobFailure } from '@/domain/canonical/job';
import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type {
  OrchestrationContext,
  OrchestrationOutcome,
  OrchestrationResult,
} from '@/domain/orchestration';
import type { IsoDateTime } from '@/domain/common';
import { resolveProgressPercentForState } from '@/domain/job';
import type { JobOrchestrator } from '@/server/orchestration';
import type { CoreAnalysisCoordinator } from './core-analysis-coordinator.js';
import type { CoreAnalysisCoordinatorRequest, CoreAnalysisStageInput } from './types.js';

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
  input: CoreAnalysisStageInput,
): { fingerprintId: EntityId; fingerprintAlgorithmVersion: MonotonicVersion } | null {
  const fingerprintId = input.fingerprintId ?? context.fingerprintId;
  const fingerprintAlgorithmVersion =
    input.fingerprintAlgorithmVersion ?? context.fingerprintAlgorithmVersion;

  if (!fingerprintId || fingerprintAlgorithmVersion === undefined) {
    return null;
  }

  return { fingerprintId, fingerprintAlgorithmVersion };
}

function buildCoordinatorRequest(
  context: OrchestrationContext,
  input: CoreAnalysisStageInput,
  fingerprint: { fingerprintId: EntityId; fingerprintAlgorithmVersion: MonotonicVersion },
): CoreAnalysisCoordinatorRequest {
  return {
    jobId: context.job.jobId,
    referenceId: context.referenceId,
    projectId: context.projectId,
    ownerId: context.ownerId,
    referenceKind: context.plan.referenceKind,
    fingerprintId: fingerprint.fingerprintId,
    fingerprintAlgorithmVersion: fingerprint.fingerprintAlgorithmVersion,
    occurredAt: input.occurredAt,
    intake: {},
    intakeOverride: input.intakeOverride,
  };
}

/**
 * Executes core analysis via coordinator, then advances orchestrator workflow.
 * JobOrchestrator remains the single workflow authority.
 */
export async function executeCoreAnalysisStage(
  orchestrator: JobOrchestrator,
  coordinator: CoreAnalysisCoordinator,
  context: OrchestrationContext,
  input: CoreAnalysisStageInput,
): Promise<OrchestrationResult<OrchestrationOutcome>> {
  if (context.analysisId) {
    return orchestrator.propagateFailure({
      context,
      failure: {
        code: 'analysis_failed',
        category: 'processing',
        message: 'Core analysis must not run when analysisId is already bound',
        retryable: false,
        occurredAt: input.occurredAt,
      },
      occurredAt: input.occurredAt,
      stageId: 'core_analysis',
    });
  }

  const fingerprint = resolveFingerprintContext(context, input);
  if (!fingerprint) {
    return orchestrator.propagateFailure({
      context,
      failure: {
        code: 'analysis_failed',
        category: 'processing',
        message: 'Fingerprint context required before core analysis',
        retryable: false,
        occurredAt: input.occurredAt,
      },
      occurredAt: input.occurredAt,
      stageId: 'core_analysis',
    });
  }

  let workingContext = context;

  if (workingContext.job.state !== 'analyzing') {
    const transitioned = orchestrator.applyJobTransitions(workingContext, [
      {
        nextState: 'analyzing',
        progressPercent: resolveProgressPercentForState('analyzing'),
        occurredAt: input.occurredAt,
      },
    ]);
    if (!transitioned.ok) {
      return transitioned;
    }
    workingContext = transitioned.data.context;
  }

  const analyzed = await coordinator.analyzeReference(
    buildCoordinatorRequest(workingContext, input, fingerprint),
  );

  if (!analyzed.ok) {
    return orchestrator.propagateFailure({
      context: workingContext,
      failure: mapCoordinatorErrorToFailure(
        analyzed.code,
        analyzed.message,
        analyzed.retryable,
        input.occurredAt,
      ),
      occurredAt: input.occurredAt,
      stageId: 'core_analysis',
    });
  }

  const completed = orchestrator.completeStage(workingContext, {
    stageId: 'core_analysis',
    jobId: workingContext.job.jobId,
    completedAt: input.occurredAt,
    outcome: 'success',
    message: 'Reference analysis completed',
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
        analysisId: analyzed.data.analysisId,
      },
    },
  };
}
