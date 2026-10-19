import type { JobRecord } from '@/domain/canonical';
import type { EntityId } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import {
  applyCacheShortCircuit,
  classifyStageFailure,
  getNextPendingStage,
  markStageCompleted,
  orchestrationErr,
  orchestrationOk,
  type CancelOrchestrationRequest,
  type FailurePropagationRequest,
  type OrchestrationContext,
  type OrchestrationOutcome,
  type OrchestrationResult,
  type ResumeOrchestrationRequest,
  type RetryOrchestrationRequest,
  type StageCompletion,
  type StagePlanner,
  type StartOrchestrationRequest,
} from '@/domain/orchestration';
import type { PipelineStageId } from '@/domain/orchestration';
import type { AppendOrchestrationEventInput, OrchestrationEventType } from '@/domain/orchestration';
import type { JobRegistration, JobTransitionRequest, RetryDecision } from '@/domain/job';
import { DEFAULT_JOB_RETRY_POLICY, isRetryableFailure, isMonotonicProgress, resolveProgressPercentForState } from '@/domain/job';
import type { JobLifecycleService } from '@/server/job';
import type { MediaIntakeService } from '@/server/media';
import type { JobOrchestrator } from './job-orchestrator.js';
import type { OrchestrationEventPublisher } from './orchestration-events.js';
import { InMemoryOrchestrationEventPublisher } from './orchestration-events.js';
import type { PipelineCoordinator } from './pipeline-coordinator.js';
import { pipelineCoordinator as defaultPipelineCoordinator } from './pipeline-coordinator.js';
import { stagePlanner as defaultStagePlanner } from '@/domain/orchestration';

export type DefaultJobOrchestratorDeps = {
  lifecycle: JobLifecycleService;
  mediaIntake?: MediaIntakeService;
  coordinator?: PipelineCoordinator;
  planner?: StagePlanner;
  publisher?: OrchestrationEventPublisher;
};

function applyTransitionChain(
  lifecycle: JobLifecycleService,
  job: JobRecord,
  transitions: readonly JobTransitionRequest[],
): OrchestrationResult<JobRecord> {
  let current = job;

  for (const transition of transitions) {
    const validated = lifecycle.validateTransition(current, transition);
    if (!validated.ok) {
      return orchestrationErr('lifecycle_rejected', validated.error.message, {
        stageId: undefined,
      });
    }
    current = lifecycle.applyTransition(current, transition);
  }

  return orchestrationOk(current);
}

type PublishContext = Pick<
  AppendOrchestrationEventInput,
  'jobId' | 'projectId' | 'ownerId' | 'occurredAt'
>;

function publishStageHandoff(
  publisher: OrchestrationEventPublisher,
  ctx: PublishContext,
  stageId: PipelineStageId,
  message?: string,
): readonly OrchestrationEventType[] {
  void publisher.publish({
    eventType: 'stage_planned',
    ...ctx,
    stageId,
    message,
  });
  void publisher.publish({
    eventType: 'stage_delegated',
    ...ctx,
    stageId,
    message: message ?? `Stage "${stageId}" delegated to worker`,
  });
  return ['stage_planned', 'stage_delegated'];
}

const CHECKPOINT_STAGE_MAP: Record<string, PipelineStageId> = {
  upload_bytes: 'media_intake',
  post_fingerprinting: 'fingerprint',
  post_analyzing: 'core_analysis',
  post_package_type: 'package_generation',
};

export class DefaultJobOrchestrator implements JobOrchestrator {
  private readonly lifecycle: JobLifecycleService;
  private readonly mediaIntake?: MediaIntakeService;
  private readonly coordinator: PipelineCoordinator;
  private readonly planner: StagePlanner;
  private readonly publisher: OrchestrationEventPublisher;

  constructor(deps: DefaultJobOrchestratorDeps) {
    this.lifecycle = deps.lifecycle;
    this.mediaIntake = deps.mediaIntake;
    this.coordinator = deps.coordinator ?? defaultPipelineCoordinator;
    this.planner = deps.planner ?? defaultStagePlanner;
    this.publisher = deps.publisher ?? new InMemoryOrchestrationEventPublisher();
  }

  start(request: StartOrchestrationRequest): OrchestrationResult<OrchestrationOutcome> {
    const registration: JobRegistration = {
      jobId: request.jobId,
      projectId: request.projectId,
      referenceId: request.referenceId,
      retryOfJobId: request.retryOfJobId,
      createdAt: request.occurredAt,
    };

    const job = this.lifecycle.createInitialJob(registration);
    const plan = this.planner.buildPlan({
      planId: `${request.jobId}-plan`,
      jobId: request.jobId,
      referenceId: request.referenceId,
      referenceKind: request.referenceKind,
    });

    const nextStage = getNextPendingStage(plan);
    const context: OrchestrationContext = {
      ownerId: request.ownerId,
      projectId: request.projectId,
      referenceId: request.referenceId,
      job,
      plan,
      attemptNumber: request.retryOfJobId ? 2 : 1,
      currentStageId: nextStage?.stageId ?? null,
    };

    void this.publisher.publish({
      eventType: 'orchestration_started',
      jobId: request.jobId,
      projectId: request.projectId,
      ownerId: request.ownerId,
      stageId: nextStage?.stageId,
      occurredAt: request.occurredAt,
    });

    const events: OrchestrationEventType[] = ['orchestration_started'];
    if (nextStage) {
      events.push(
        ...publishStageHandoff(
          this.publisher,
          {
            jobId: request.jobId,
            projectId: request.projectId,
            ownerId: request.ownerId,
            occurredAt: request.occurredAt,
          },
          nextStage.stageId,
        ),
      );
    }

    return orchestrationOk({ context, events });
  }

  completeStage(
    context: OrchestrationContext,
    completion: StageCompletion,
  ): OrchestrationResult<OrchestrationOutcome> {
    const expected = getNextPendingStage(context.plan);
    if (!expected || expected.stageId !== completion.stageId) {
      return orchestrationErr('stage_out_of_order', `Expected stage "${expected?.stageId ?? 'none'}", received "${completion.stageId}"`, {
        stageId: completion.stageId,
      });
    }

    if (completion.outcome === 'failed') {
      if (!completion.failure) {
        return orchestrationErr('validation_error', 'Failed stage completion requires a failure record', {
          stageId: completion.stageId,
        });
      }
      return this.propagateFailure({
        context,
        failure: completion.failure,
        occurredAt: completion.completedAt,
        stageId: completion.stageId,
      });
    }

    const transitionPlan = this.coordinator.planStageTransitions(context.job, completion);
    let job = context.job;

    if (transitionPlan && transitionPlan.transitions.length > 0) {
      const applied = applyTransitionChain(this.lifecycle, job, transitionPlan.transitions);
      if (!applied.ok) {
        return applied;
      }
      job = applied.data;
    }

    let plan = markStageCompleted(context.plan, completion);

    if (completion.stageId === 'cache_lookup' && completion.cacheHit) {
      plan = applyCacheShortCircuit(plan);
    }

    const nextStage = getNextPendingStage(plan);
    const updatedContext: OrchestrationContext = {
      ...context,
      job,
      plan,
      currentStageId: nextStage?.stageId ?? null,
    };

    const eventType = completion.outcome === 'skipped' ? 'stage_skipped' : 'stage_completed';
    void this.publisher.publish({
      eventType,
      jobId: context.job.jobId,
      projectId: context.projectId,
      ownerId: context.ownerId,
      stageId: completion.stageId,
      occurredAt: completion.completedAt,
      message: completion.message,
    });

    const events: OrchestrationEventType[] = [eventType];
    const publishCtx: PublishContext = {
      jobId: context.job.jobId,
      projectId: context.projectId,
      ownerId: context.ownerId,
      occurredAt: completion.completedAt,
    };

    if (nextStage) {
      events.push(...publishStageHandoff(this.publisher, publishCtx, nextStage.stageId));
    } else {
      void this.publisher.publish({
        eventType: 'orchestration_completed',
        ...publishCtx,
      });
      events.push('orchestration_completed');
    }

    return orchestrationOk({
      context: updatedContext,
      events,
    });
  }

  cancel(request: CancelOrchestrationRequest): OrchestrationResult<OrchestrationOutcome> {
    const { context, requestedAt, reason } = request;

    if (!this.lifecycle.canCancel(context.job)) {
      return orchestrationErr('not_cancellable', `Job in state "${context.job.state}" cannot be cancelled`);
    }

    const cancelled = this.lifecycle.cancel(context.job, requestedAt);
    if (!cancelled.ok) {
      return orchestrationErr('lifecycle_rejected', cancelled.error.message);
    }

    /** PP-07 coordination is event-only until context carries upload session handles. */
    if (
      this.mediaIntake &&
      this.coordinator.requiresMediaIntakeStage(context.plan) &&
      context.currentStageId === 'media_intake'
    ) {
      void this.publisher.publish({
        eventType: 'cancellation_requested',
        jobId: context.job.jobId,
        projectId: context.projectId,
        ownerId: context.ownerId,
        stageId: 'media_intake',
        message: reason ?? 'Upload session cancellation delegated to media intake worker',
        occurredAt: requestedAt,
      });
    } else {
      void this.publisher.publish({
        eventType: 'cancellation_requested',
        jobId: context.job.jobId,
        projectId: context.projectId,
        ownerId: context.ownerId,
        occurredAt: requestedAt,
        message: reason,
      });
    }

    return orchestrationOk({
      context: { ...context, job: cancelled.data, currentStageId: null },
      events: ['cancellation_requested'],
    });
  }

  planRetry(request: RetryOrchestrationRequest): OrchestrationResult<{
    decision: RetryDecision;
    registration?: JobRegistration;
  }> {
    const decision = this.lifecycle.evaluateRetry(request.context.job, request.attemptNumber);
    if (!decision.allowed) {
      return orchestrationErr('retry_not_allowed', `Retry denied: ${decision.reason}`);
    }

    void this.publisher.publish({
      eventType: 'retry_planned',
      jobId: request.context.job.jobId,
      projectId: request.context.projectId,
      ownerId: request.context.ownerId,
      occurredAt: new Date().toISOString(),
    });

    const newJobId = `${request.context.job.jobId}-retry-${request.attemptNumber}` as EntityId;
    const registration: JobRegistration = {
      jobId: newJobId,
      projectId: request.context.projectId,
      referenceId: request.context.referenceId,
      retryOfJobId: request.context.job.jobId,
      createdAt: decision.nextAttempt.scheduledAt,
    };

    return orchestrationOk({ decision, registration });
  }

  planResume(request: ResumeOrchestrationRequest): OrchestrationResult<OrchestrationOutcome> {
    const checkpointRecord = {
      checkpoint: mapStageToCheckpoint(request.checkpointStageId),
      jobId: request.context.job.jobId,
      stateAtCheckpoint: request.context.job.state,
      recordedAt: request.requestedAt,
    };

    const decision = this.lifecycle.evaluateResume(request.context.job, checkpointRecord);
    if (!decision.allowed) {
      return orchestrationErr('resume_not_allowed', `Resume denied: ${decision.reason}`);
    }

    const resumeStageId = CHECKPOINT_STAGE_MAP[checkpointRecord.checkpoint] ?? request.checkpointStageId;

    void this.publisher.publish({
      eventType: 'resume_planned',
      jobId: request.context.job.jobId,
      projectId: request.context.projectId,
      ownerId: request.context.ownerId,
      stageId: resumeStageId,
      occurredAt: request.requestedAt,
    });

    return orchestrationOk({
      context: {
        ...request.context,
        currentStageId: resumeStageId,
      },
      events: ['resume_planned'],
    });
  }

  propagateFailure(request: FailurePropagationRequest): OrchestrationResult<OrchestrationOutcome> {
    const { context, failure, occurredAt, stageId } = request;
    const retryAllowed =
      isRetryableFailure(failure) && context.attemptNumber < DEFAULT_JOB_RETRY_POLICY.maxAttempts;
    const targetState = classifyStageFailure(failure, retryAllowed);

    const transitionPlan = this.coordinator.planFailureTransitions(
      context.job,
      failure,
      targetState,
      occurredAt,
    );

    if (!transitionPlan) {
      return orchestrationErr('failure_propagation_error', `Cannot propagate failure from state "${context.job.state}"`, {
        stageId,
      });
    }

    const applied = applyTransitionChain(this.lifecycle, context.job, transitionPlan.transitions);
    if (!applied.ok) {
      return applied;
    }

    const plan = markStageCompleted(context.plan, {
      stageId,
      jobId: context.job.jobId,
      completedAt: occurredAt,
      outcome: 'failed',
      failure,
    });

    void this.publisher.publish({
      eventType: 'stage_failed',
      jobId: context.job.jobId,
      projectId: context.projectId,
      ownerId: context.ownerId,
      stageId,
      failure,
      occurredAt,
    });

    void this.publisher.publish({
      eventType: 'failure_propagated',
      jobId: context.job.jobId,
      projectId: context.projectId,
      ownerId: context.ownerId,
      stageId,
      failure,
      occurredAt,
    });

    return orchestrationOk({
      context: {
        ...context,
        job: applied.data,
        plan,
        currentStageId: null,
      },
      events: ['stage_failed', 'failure_propagated'],
    });
  }

  getNextStage(context: OrchestrationContext): PipelineStageId | null {
    return getNextPendingStage(context.plan)?.stageId ?? null;
  }

  applyJobTransitions(
    context: OrchestrationContext,
    transitions: readonly JobTransitionRequest[],
  ): OrchestrationResult<OrchestrationOutcome> {
    let job = context.job;

    for (const transition of transitions) {
      if (job.state === transition.nextState) {
        continue;
      }

      const validated = this.lifecycle.validateTransition(job, transition);
      if (!validated.ok) {
        continue;
      }

      job = this.lifecycle.applyTransition(job, transition);
    }

    return orchestrationOk({
      context: { ...context, job },
      events: [],
    });
  }

  refineJobProgress(
    context: OrchestrationContext,
    request: { progressPercent: number; occurredAt: IsoDateTime },
  ): OrchestrationResult<OrchestrationOutcome> {
    const job = context.job;

    if (job.progressPercent >= request.progressPercent) {
      return orchestrationOk({ context, events: [] });
    }

    if (!isMonotonicProgress(job.progressPercent, request.progressPercent)) {
      return orchestrationErr('validation_error', 'Progress percent cannot decrease');
    }

    const floor = resolveProgressPercentForState(job.state);
    if (request.progressPercent < floor) {
      return orchestrationErr(
        'validation_error',
        `Progress ${request.progressPercent}% is below minimum ${floor}% for state "${job.state}"`,
      );
    }

    return orchestrationOk({
      context: {
        ...context,
        job: {
          ...job,
          progressPercent: request.progressPercent,
          updatedAt: request.occurredAt,
        },
      },
      events: [],
    });
  }
}

function mapStageToCheckpoint(stageId: PipelineStageId) {
  const entry = Object.entries(CHECKPOINT_STAGE_MAP).find(([, mappedStage]) => mappedStage === stageId);
  return (entry?.[0] ?? 'post_fingerprinting') as 'upload_bytes' | 'post_fingerprinting' | 'post_analyzing' | 'post_package_type';
}

export function createDefaultJobOrchestrator(deps: DefaultJobOrchestratorDeps): JobOrchestrator {
  return new DefaultJobOrchestrator(deps);
}
