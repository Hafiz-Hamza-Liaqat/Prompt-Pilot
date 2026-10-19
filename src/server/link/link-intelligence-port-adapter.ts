import type { JobFailure } from '@/domain/canonical/job';
import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import type { LinkIntelligencePort, LinkIntelligenceRequest, LinkIntelligencePortResult } from '@/server/orchestration/ports';
import { orchestrationErr, orchestrationOk } from '@/domain/orchestration';
import type { LinkIntelligenceCoordinator } from './link-intelligence-coordinator.js';

function isJobFailureCode(code: string): code is JobFailure['code'] {
  return code in JOB_FAILURE_CODE_CATEGORY;
}

function mapCoordinatorCodeToJobFailure(code: string): JobFailure['code'] {
  if (isJobFailureCode(code)) {
    return code;
  }
  return 'invalid_url';
}

/** Adapts LinkIntelligenceCoordinator to the orchestrator delegate port. */
export function createLinkIntelligencePort(
  coordinator: LinkIntelligenceCoordinator,
): LinkIntelligencePort {
  return {
    async analyze(request: LinkIntelligenceRequest): Promise<LinkIntelligencePortResult> {
      const result = await coordinator.analyzeLink({
        jobId: request.jobId,
        referenceId: request.referenceId,
        projectId: request.projectId,
        ownerId: request.ownerId,
        referenceKind: request.referenceKind,
        rawUrl: request.rawUrl,
        occurredAt: request.requestedAt,
      });

      if (!result.ok) {
        return orchestrationErr('validation_error', result.message, {
          stageId: 'link_intelligence',
          jobFailureCode: mapCoordinatorCodeToJobFailure(result.code),
        });
      }

      return orchestrationOk({
        linkMetadata: result.data.linkMetadata,
        cacheHit: result.data.cacheHit,
      });
    },
  };
}
