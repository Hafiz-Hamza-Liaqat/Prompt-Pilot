import type { JobFailure } from '@/domain/canonical/job';
import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import type { MediaIntakeErrorCode } from '@/domain/media';
import type { OrchestrationContext, OrchestrationOutcome, OrchestrationResult } from '@/domain/orchestration';
import type { IsoDateTime } from '@/domain/common';
import type { MediaIntakeService } from '@/server/media/media-intake-service';
import type { JobOrchestrator } from '@/server/orchestration';
import type { AnalyzeLinkInput, LinkIntelligenceCoordinator } from './link-intelligence-coordinator.js';

export type LinkIntelligenceStageInput = Pick<AnalyzeLinkInput, 'rawUrl' | 'occurredAt'>;

export type LinkIntelligenceStageDeps = {
  /**
   * Production composition must always provide MediaIntakeService so URL handoff runs.
   * Omitting skips handoff (dev/test coordinator-only scenarios only).
   * @see docs/pp-05/05b2-documentation-composition-hardening.md
   */
  mediaIntake?: MediaIntakeService;
};

function mapCoordinatorErrorToFailure(
  code: string,
  message: string,
  retryable: boolean | undefined,
  occurredAt: IsoDateTime,
): JobFailure {
  const failureCode = isJobFailureCode(code) ? code : 'invalid_url';
  return {
    code: failureCode,
    category: JOB_FAILURE_CODE_CATEGORY[failureCode],
    message,
    retryable: retryable ?? false,
    occurredAt,
  };
}

function mapMediaIntakeErrorToFailure(
  code: MediaIntakeErrorCode,
  message: string,
  occurredAt: IsoDateTime,
): JobFailure {
  const failureCode = mapMediaIntakeCodeToJobFailure(code);
  return {
    code: failureCode,
    category: JOB_FAILURE_CODE_CATEGORY[failureCode],
    message,
    retryable: false,
    occurredAt,
  };
}

function mapMediaIntakeCodeToJobFailure(code: MediaIntakeErrorCode): JobFailure['code'] {
  switch (code) {
    case 'ownership_violation':
      return 'policy_blocked';
    case 'unsupported_reference_kind':
      return 'unsupported_platform';
    case 'validation_error':
      return 'invalid_url';
    default:
      return 'invalid_url';
  }
}

function isJobFailureCode(code: string): code is JobFailure['code'] {
  return code in JOB_FAILURE_CODE_CATEGORY;
}

/**
 * Executes link analysis, Media Intake URL handoff, then advances orchestrator workflow.
 * JobOrchestrator remains the single workflow authority.
 */
export async function executeLinkIntelligenceStage(
  orchestrator: JobOrchestrator,
  coordinator: LinkIntelligenceCoordinator,
  context: OrchestrationContext,
  input: LinkIntelligenceStageInput,
  deps: LinkIntelligenceStageDeps = {},
): Promise<OrchestrationResult<OrchestrationOutcome>> {
  const preparing = orchestrator.applyJobTransitions(context, [
    { nextState: 'preparing', progressPercent: 10, occurredAt: input.occurredAt },
  ]);
  if (!preparing.ok) {
    return preparing;
  }

  let workingContext = preparing.data.context;

  const analyzed = await coordinator.analyzeLink({
    jobId: workingContext.job.jobId,
    referenceId: workingContext.referenceId,
    projectId: workingContext.projectId,
    ownerId: workingContext.ownerId,
    referenceKind: workingContext.plan.referenceKind,
    rawUrl: input.rawUrl,
    occurredAt: input.occurredAt,
  });

  if (!analyzed.ok) {
    const failed = orchestrator.propagateFailure({
      context: workingContext,
      failure: mapCoordinatorErrorToFailure(
        analyzed.code,
        analyzed.message,
        analyzed.retryable,
        input.occurredAt,
      ),
      occurredAt: input.occurredAt,
      stageId: 'link_intelligence',
    });
    return failed;
  }

  if (deps.mediaIntake) {
    const resolved = deps.mediaIntake.resolveUrlReference(
      analyzed.data.linkMetadata,
      { ownerId: workingContext.ownerId, projectId: workingContext.projectId },
      workingContext.job.jobId,
    );

    if (!resolved.ok) {
      const failed = orchestrator.propagateFailure({
        context: workingContext,
        failure: mapMediaIntakeErrorToFailure(
          resolved.error.code,
          resolved.error.message,
          input.occurredAt,
        ),
        occurredAt: input.occurredAt,
        stageId: 'link_intelligence',
      });
      return failed;
    }

    workingContext = {
      ...workingContext,
      urlMediaDescriptorId: resolved.data.descriptorId,
    };
  }

  const completed = orchestrator.completeStage(workingContext, {
    stageId: 'link_intelligence',
    jobId: workingContext.job.jobId,
    completedAt: input.occurredAt,
    outcome: 'success',
    message: analyzed.cacheHit ? 'Link metadata cache hit' : 'Link metadata extracted',
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
        linkMetadataId: analyzed.data.linkMetadata.linkMetadataId,
        ...(workingContext.urlMediaDescriptorId
          ? { urlMediaDescriptorId: workingContext.urlMediaDescriptorId }
          : {}),
      },
    },
  };
}
