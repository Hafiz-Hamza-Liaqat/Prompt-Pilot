import type { JobFailure } from '@/domain/canonical/job';
import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import { orchestrationErr, orchestrationOk } from '@/domain/orchestration';
import type {
  AnalysisProviderPort,
  AnalysisProviderRequest,
  AnalysisProviderResult,
} from '@/server/orchestration/ports';
import type { CoreAnalysisCoordinator } from './core-analysis-coordinator.js';
import type { CoreAnalysisCoordinatorRequest } from './types.js';

export type AnalysisPortInputResolver = (
  request: AnalysisProviderRequest,
) => Pick<
  CoreAnalysisCoordinatorRequest,
  'referenceKind' | 'fingerprintId' | 'fingerprintAlgorithmVersion' | 'intake' | 'intakeOverride'
>;

export type CreateAnalysisProviderPortOptions = {
  providerId: string;
  resolveInput: AnalysisPortInputResolver;
};

function isJobFailureCode(code: string): code is JobFailure['code'] {
  return code in JOB_FAILURE_CODE_CATEGORY;
}

function mapCoordinatorCodeToJobFailure(code: string): JobFailure['code'] {
  if (isJobFailureCode(code)) {
    return code;
  }
  return 'analysis_failed';
}

/** Adapts CoreAnalysisCoordinator to the orchestrator delegate port (DI only). */
export function createAnalysisProviderPort(
  coordinator: CoreAnalysisCoordinator,
  options: CreateAnalysisProviderPortOptions,
): AnalysisProviderPort {
  return {
    providerId: options.providerId,

    async analyze(request: AnalysisProviderRequest): Promise<AnalysisProviderResult> {
      const resolved = options.resolveInput(request);
      const result = await coordinator.analyzeReference({
        jobId: request.jobId,
        referenceId: request.referenceId,
        projectId: request.projectId,
        ownerId: request.ownerId,
        occurredAt: request.requestedAt,
        referenceKind: resolved.referenceKind,
        fingerprintId: resolved.fingerprintId,
        fingerprintAlgorithmVersion: resolved.fingerprintAlgorithmVersion,
        intake: resolved.intake ?? {},
        intakeOverride: resolved.intakeOverride,
      });

      if (!result.ok) {
        return orchestrationErr('validation_error', result.message, {
          stageId: 'core_analysis',
          jobFailureCode: mapCoordinatorCodeToJobFailure(result.code),
        });
      }

      return orchestrationOk({
        analysisId: result.data.analysisId,
        completedAt: result.data.completedAt,
      });
    },
  };
}
