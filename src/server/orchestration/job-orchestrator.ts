import type {
  CancelOrchestrationRequest,
  FailurePropagationRequest,
  OrchestrationContext,
  OrchestrationOutcome,
  OrchestrationResult,
  ResumeOrchestrationRequest,
  RetryOrchestrationRequest,
  StartOrchestrationRequest,
} from '@/domain/orchestration';
import type { StageCompletion } from '@/domain/orchestration';
import type { PipelineStageId } from '@/domain/orchestration';
import type { IsoDateTime } from '@/domain/common';
import type { RetryDecision } from '@/domain/job';
import type { JobRegistration } from '@/domain/job';
import type { JobTransitionRequest } from '@/domain/job';
import { ORCHESTRATION_EVENT_TOKENS } from './orchestration-events.js';
import { ORCHESTRATION_PORT_TOKENS } from './ports.js';

/**
 * Coordinates pipeline stages without executing domain work.
 * Delegates lifecycle transitions to PP-06 and media planning to PP-07 contracts.
 */
export type JobOrchestrator = {
  start(request: StartOrchestrationRequest): OrchestrationResult<OrchestrationOutcome>;
  completeStage(
    context: OrchestrationContext,
    completion: StageCompletion,
  ): OrchestrationResult<OrchestrationOutcome>;
  cancel(request: CancelOrchestrationRequest): OrchestrationResult<OrchestrationOutcome>;
  planRetry(request: RetryOrchestrationRequest): OrchestrationResult<{
    decision: RetryDecision;
    registration?: JobRegistration;
  }>;
  planResume(request: ResumeOrchestrationRequest): OrchestrationResult<OrchestrationOutcome>;
  propagateFailure(request: FailurePropagationRequest): OrchestrationResult<OrchestrationOutcome>;
  getNextStage(context: OrchestrationContext): PipelineStageId | null;
  /** Applies lifecycle transitions without completing a pipeline stage (e.g. preparing → uploading). */
  applyJobTransitions(
    context: OrchestrationContext,
    transitions: readonly JobTransitionRequest[],
  ): OrchestrationResult<OrchestrationOutcome>;
  /** Refines progress percent within the current job state during in-stage work (e.g. byte upload). */
  refineJobProgress(
    context: OrchestrationContext,
    request: { progressPercent: number; occurredAt: IsoDateTime },
  ): OrchestrationResult<OrchestrationOutcome>;
};

export const JOB_ORCHESTRATOR_TOKEN = Symbol.for('prompt-pilot.orchestration.JobOrchestrator');

export const ORCHESTRATION_TOKENS = {
  orchestrator: JOB_ORCHESTRATOR_TOKEN,
  pipelineCoordinator: Symbol.for('prompt-pilot.orchestration.PipelineCoordinator'),
  stagePlanner: Symbol.for('prompt-pilot.orchestration.StagePlanner'),
  eventPublisher: ORCHESTRATION_EVENT_TOKENS.publisher,
  jobPersistencePort: ORCHESTRATION_PORT_TOKENS.jobPersistence,
  linkIntelligencePort: ORCHESTRATION_PORT_TOKENS.linkIntelligence,
  cachePort: ORCHESTRATION_PORT_TOKENS.cache,
  analysisProviderPort: ORCHESTRATION_PORT_TOKENS.analysisProvider,
  packageEnginePort: ORCHESTRATION_PORT_TOKENS.packageEngine,
  persistenceCoordinatorPort: ORCHESTRATION_PORT_TOKENS.persistenceCoordinator,
} as const;
