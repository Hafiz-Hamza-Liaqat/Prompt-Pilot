import { randomUUID } from 'node:crypto';
import type { Reference } from '@/domain/canonical';
import type { JobFailure, JobRecord } from '@/domain/canonical/job';
import { JOB_FAILURE_CODE_CATEGORY } from '@/domain/canonical/job';
import type { JobState, ReferenceKind } from '@/domain/canonical/constants';
import { JOB_TERMINAL_STATES } from '@/domain/canonical/constants';
import type { EntityId, MonotonicVersion } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import {
  requiresLinkIntelligence,
  type OrchestrationContext,
  type OrchestrationError,
  type OrchestrationResult,
} from '@/domain/orchestration';
import { JOB_STATE_TRANSITIONS } from '@/domain/job';
import { resolveProgressPercentForState } from '@/domain/job';
import type { ReferenceIntakeView } from '@/server/analysis/types';
import { executeCoreAnalysisStage } from '@/server/analysis/core-analysis-stage-runner';
import type { CoreAnalysisCoordinator } from '@/server/analysis/core-analysis-coordinator';
import { executeCacheLookupStage } from '@/server/cache/cache-lookup-stage-runner';
import type { CacheCoordinator } from '@/server/cache/cache-coordinator';
import { executeLinkIntelligenceStage } from '@/server/link/link-intelligence-stage-runner';
import type { LinkIntelligenceCoordinator } from '@/server/link/link-intelligence-coordinator';
import type { JobOrchestrator } from '@/server/orchestration';
import type {
  JobRepository,
  OwnerScope,
  PersistenceResult,
  ReferenceIntakePayloadRepository,
  ReferenceRepository,
} from '@/server/persistence';

const NON_TERMINAL_JOB_STATES: readonly JobState[] = [
  'created',
  'validated',
  'queued',
  'preparing',
  'uploading',
  'fingerprinting',
  'analyzing',
  'generating_packages',
  'saving',
  'retry_pending',
];

const MVP_TAIL_STAGE_IDS = ['package_generation', 'persistence', 'workspace_refresh'] as const;

export type RunReferenceAnalysisInput = {
  scope: OwnerScope;
  referenceId: EntityId;
  referenceKind: ReferenceKind;
  occurredAt: IsoDateTime;
};

export type PipelineTriggerOutcome =
  | {
      ok: true;
      jobId: EntityId;
      analysisId?: EntityId;
      terminalState: JobState;
    }
  | {
      ok: false;
      code:
        | 'not_found'
        | 'validation_error'
        | 'conflict'
        | 'persistence_error'
        | 'pipeline_error';
      message: string;
      jobId?: EntityId;
      failure?: JobFailure;
    };

type PipelineTriggerFailure = Extract<PipelineTriggerOutcome, { ok: false }>;

type AdvanceStepSuccess = {
  ok: true;
  context: OrchestrationContext;
  persisted: JobRecord;
};

type AdvanceStepResult = AdvanceStepSuccess | PipelineTriggerFailure;

type PreflightSuccess = {
  ok: true;
  data: { reference: Reference; intakeOverride: Partial<ReferenceIntakeView> };
};

type PreflightResult = PreflightSuccess | PipelineTriggerFailure;

export type PipelineTriggerServiceDeps = {
  orchestrator: JobOrchestrator;
  jobRepository: JobRepository;
  referenceRepository: ReferenceRepository;
  referenceIntakePayloadRepository: ReferenceIntakePayloadRepository;
  linkCoordinator: LinkIntelligenceCoordinator;
  cacheCoordinator: CacheCoordinator;
  analysisCoordinator: CoreAnalysisCoordinator;
  idGenerator?: () => EntityId;
  fingerprintStub?: {
    fingerprintId: EntityId;
    fingerprintAlgorithmVersion: MonotonicVersion;
  };
};

function findShortestStatePath(from: JobState, to: JobState): readonly JobState[] | null {
  if (from === to) {
    return [];
  }

  const queue: { state: JobState; path: JobState[] }[] = [{ state: from, path: [] }];
  const visited = new Set<JobState>([from]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const next of JOB_STATE_TRANSITIONS[current.state]) {
      if (visited.has(next)) {
        continue;
      }
      const path = [...current.path, next];
      if (next === to) {
        return path;
      }
      visited.add(next);
      queue.push({ state: next, path });
    }
  }

  return null;
}

function stubFingerprintForReference(
  referenceId: EntityId,
  override?: PipelineTriggerServiceDeps['fingerprintStub'],
): { fingerprintId: EntityId; fingerprintAlgorithmVersion: MonotonicVersion } {
  if (override) {
    return override;
  }

  const suffix = referenceId.replace(/-/g, '').slice(-12).padStart(12, '0');
  return {
    fingerprintId: `00000000-0000-4000-8000-${suffix}` as EntityId,
    fingerprintAlgorithmVersion: 1 as MonotonicVersion,
  };
}

function isAcceptablePipelineExitState(state: JobState): boolean {
  return (JOB_TERMINAL_STATES as readonly JobState[]).includes(state) || state === 'retry_pending';
}

function mapOrchestrationErrorToJobFailure(
  error: OrchestrationError,
  occurredAt: IsoDateTime,
): JobFailure {
  const code = error.jobFailureCode ?? mapOrchestrationErrorCode(error);
  return {
    code,
    category: JOB_FAILURE_CODE_CATEGORY[code],
    message: error.message,
    retryable: error.code === 'timeout_exceeded',
    occurredAt,
  };
}

function mapOrchestrationErrorCode(error: OrchestrationError): JobFailure['code'] {
  if (error.stageId === 'link_intelligence' && error.code === 'validation_error') {
    return 'invalid_url';
  }

  switch (error.code) {
    case 'timeout_exceeded':
      return 'timeout';
    case 'port_unavailable':
      return 'worker_unavailable';
    case 'validation_error':
      return 'analysis_failed';
    default:
      return 'analysis_failed';
  }
}

export class PipelineTriggerService {
  private readonly idGenerator: () => EntityId;

  constructor(private readonly deps: PipelineTriggerServiceDeps) {
    this.idGenerator = deps.idGenerator ?? (() => randomUUID());
  }

  async runReferenceAnalysis(input: RunReferenceAnalysisInput): Promise<PipelineTriggerOutcome> {
    const preflight = await this.runPreflight(input);
    if (!preflight.ok) {
      return preflight;
    }

    const { reference, intakeOverride } = preflight.data;
    const jobId = this.idGenerator();
    const created = await this.deps.jobRepository.create(
      input.scope,
      { referenceId: input.referenceId },
      jobId,
    );

    if (!created.ok) {
      return {
        ok: false,
        code: 'persistence_error',
        message: 'Unable to create analysis job. Try again in a moment.',
      };
    }

    let persistedJob = created.data;

    const started = this.deps.orchestrator.start({
      jobId,
      projectId: input.scope.projectId,
      ownerId: input.scope.ownerId,
      referenceId: input.referenceId,
      referenceKind: input.referenceKind,
      occurredAt: input.occurredAt,
    });

    if (!started.ok) {
      return this.pipelineError(started, input.scope, persistedJob, null, input.occurredAt, jobId);
    }

    let context = started.data.context;
    const syncedStart = await this.syncPersistedJob(input.scope, persistedJob, context.job, input.occurredAt);
    if (!syncedStart.ok) {
      return this.persistenceSyncError(
        syncedStart,
        input.scope,
        persistedJob,
        context,
        input.occurredAt,
        jobId,
      );
    }
    persistedJob = syncedStart.data;

    const validationOwnershipResult = await this.completeValidationAndOwnership(context, input.occurredAt);
    const validationOwnership = await this.advanceOrchestrationStep(
      validationOwnershipResult,
      input.scope,
      persistedJob,
      context,
      input.occurredAt,
      jobId,
    );
    if (!validationOwnership.ok) {
      return validationOwnership;
    }
    context = validationOwnership.context;
    persistedJob = validationOwnership.persisted;

    if (requiresLinkIntelligence(input.referenceKind)) {
      const linkStageResult = await this.runLinkIntelligenceStage(context, reference, input.occurredAt);
      const linkAdvanceInput: OrchestrationResult<{ context: OrchestrationContext }> = linkStageResult.ok
        ? { ok: true, data: { context: linkStageResult.data.context } }
        : linkStageResult;
      const linkStage = await this.advanceOrchestrationStep(
        linkAdvanceInput,
        input.scope,
        persistedJob,
        context,
        input.occurredAt,
        jobId,
      );
      if (!linkStage.ok) {
        return linkStage;
      }
      context = linkStage.context;
      persistedJob = linkStage.persisted;
      if (linkStageResult.ok && linkStageResult.data.linkMetadata) {
        intakeOverride.linkMetadata = linkStageResult.data.linkMetadata;
      }
    }

    const fingerprintStageResult = await this.runFingerprintStub(context, input.referenceId, input.occurredAt);
    const fingerprintAdvanceInput: OrchestrationResult<{ context: OrchestrationContext }> =
      fingerprintStageResult.ok
        ? { ok: true, data: { context: fingerprintStageResult.data } }
        : fingerprintStageResult;
    const fingerprintStage = await this.advanceOrchestrationStep(
      fingerprintAdvanceInput,
      input.scope,
      persistedJob,
      context,
      input.occurredAt,
      jobId,
    );
    if (!fingerprintStage.ok) {
      return fingerprintStage;
    }
    context = fingerprintStage.context;
    persistedJob = fingerprintStage.persisted;

    const fingerprint = stubFingerprintForReference(input.referenceId, this.deps.fingerprintStub);
    const cacheStageResult = await executeCacheLookupStage(
      this.deps.orchestrator,
      this.deps.cacheCoordinator,
      context,
      {
        occurredAt: input.occurredAt,
        fingerprintId: context.fingerprintId ?? fingerprint.fingerprintId,
        fingerprintAlgorithmVersion:
          context.fingerprintAlgorithmVersion ?? fingerprint.fingerprintAlgorithmVersion,
      },
    );
    const cacheStage = await this.advanceOrchestrationStep(
      cacheStageResult,
      input.scope,
      persistedJob,
      context,
      input.occurredAt,
      jobId,
    );
    if (!cacheStage.ok) {
      return cacheStage;
    }
    context = cacheStage.context;
    persistedJob = cacheStage.persisted;

    const nextAfterCache = this.deps.orchestrator.getNextStage(context);
    if (nextAfterCache === 'core_analysis') {
      const coreStageResult = await executeCoreAnalysisStage(
        this.deps.orchestrator,
        this.deps.analysisCoordinator,
        context,
        {
          occurredAt: input.occurredAt,
          intakeOverride,
          fingerprintId: context.fingerprintId ?? fingerprint.fingerprintId,
          fingerprintAlgorithmVersion:
            context.fingerprintAlgorithmVersion ?? fingerprint.fingerprintAlgorithmVersion,
        },
      );
      const coreStage = await this.advanceOrchestrationStep(
        coreStageResult,
        input.scope,
        persistedJob,
        context,
        input.occurredAt,
        jobId,
      );
      if (!coreStage.ok) {
        return coreStage;
      }
      context = coreStage.context;
      persistedJob = coreStage.persisted;
    }

    const tailResult = await this.completeMvpTailStages(context, input.occurredAt);
    const tailAdvanceInput: OrchestrationResult<{ context: OrchestrationContext }> = tailResult.ok
      ? { ok: true, data: { context: tailResult.data } }
      : tailResult;
    const tail = await this.advanceOrchestrationStep(
      tailAdvanceInput,
      input.scope,
      persistedJob,
      context,
      input.occurredAt,
      jobId,
    );
    if (!tail.ok) {
      return tail;
    }
    context = tail.context;
    persistedJob = tail.persisted;

    if (context.job.state !== 'completed') {
      const failure =
        context.job.failure ??
        ({
          code: 'analysis_failed',
          category: 'processing',
          message: 'Analysis pipeline did not reach a completed state.',
          retryable: false,
          occurredAt: input.occurredAt,
        } satisfies JobFailure);

      return this.finalizeAbortedPipeline(
        input.scope,
        persistedJob,
        context,
        failure,
        input.occurredAt,
        jobId,
      );
    }

    return {
      ok: true,
      jobId,
      analysisId: context.analysisId,
      terminalState: context.job.state,
    };
  }

  private async runPreflight(
    input: RunReferenceAnalysisInput,
  ): Promise<PreflightResult> {
    const duplicate = await this.assertNoActiveJobForReference(input.scope, input.referenceId);
    if (!duplicate.ok) {
      return duplicate;
    }

    const referenceResult = await this.deps.referenceRepository.getById(input.scope, input.referenceId);
    if (!referenceResult.ok) {
      return {
        ok: false,
        code: referenceResult.code === 'not_found' ? 'not_found' : 'persistence_error',
        message:
          referenceResult.code === 'not_found'
            ? 'Reference was not found for this project.'
            : 'Unable to load the reference. Try again in a moment.',
      };
    }

    const reference = referenceResult.data;

    if (reference.referenceKind !== input.referenceKind) {
      return {
        ok: false,
        code: 'validation_error',
        message: 'Reference kind does not match the saved reference.',
      };
    }

    if (!reference.rightsAttestationId) {
      return {
        ok: false,
        code: 'validation_error',
        message: 'Rights attestation is required before analysis can start.',
      };
    }

    const intakeOverride: Partial<ReferenceIntakeView> = {
      rightsAttestationId: reference.rightsAttestationId,
    };

    if (input.referenceKind === 'transcript' || input.referenceKind === 'script') {
      const payloadResult = await this.deps.referenceIntakePayloadRepository.getByReferenceId(
        input.scope,
        input.referenceId,
      );

      if (!payloadResult.ok) {
        return {
          ok: false,
          code: 'persistence_error',
          message: 'Unable to load reference content. Try again in a moment.',
        };
      }

      if (!payloadResult.data) {
        return {
          ok: false,
          code: 'validation_error',
          message: 'Reference content was not found. Submit the reference again before starting analysis.',
        };
      }

      if (payloadResult.data.payloadKind !== input.referenceKind) {
        return {
          ok: false,
          code: 'validation_error',
          message: 'Reference content kind does not match the saved reference.',
        };
      }

      if (input.referenceKind === 'transcript') {
        intakeOverride.transcriptText = payloadResult.data.bodyText;
      } else {
        intakeOverride.scriptText = payloadResult.data.bodyText;
      }
    }

    if (input.referenceKind === 'youtube_url' && !reference.canonicalUrl) {
      return {
        ok: false,
        code: 'validation_error',
        message: 'YouTube references require a saved canonical URL before analysis can start.',
      };
    }

    return { ok: true, data: { reference, intakeOverride } };
  }

  private async assertNoActiveJobForReference(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<{ ok: true } | PipelineTriggerFailure> {
    const listed = await this.deps.jobRepository.listByReference(scope, referenceId, { limit: 20 });
    if (!listed.ok) {
      return {
        ok: false,
        code: 'persistence_error',
        message: 'Unable to verify existing analysis jobs. Try again in a moment.',
      };
    }

    const active = listed.data.items.find((job) => NON_TERMINAL_JOB_STATES.includes(job.state));
    if (active) {
      return {
        ok: false,
        code: 'conflict',
        message: 'An analysis job is already in progress for this reference.',
        jobId: active.jobId,
      };
    }

    return { ok: true };
  }

  private async advanceOrchestrationStep(
    result: OrchestrationResult<{ context: OrchestrationContext }>,
    scope: OwnerScope,
    persisted: JobRecord,
    stepContext: OrchestrationContext,
    occurredAt: IsoDateTime,
    jobId: EntityId,
  ): Promise<AdvanceStepResult> {
    if (!result.ok) {
      return this.pipelineError(result, scope, persisted, stepContext, occurredAt, jobId);
    }

    const synced = await this.syncPersistedJob(scope, persisted, result.data.context.job, occurredAt);
    if (!synced.ok) {
      return this.persistenceSyncError(
        synced,
        scope,
        persisted,
        result.data.context,
        occurredAt,
        jobId,
      );
    }

    const context = result.data.context;
    const failureOutcome = this.failureOutcomeIfTerminal(context, jobId);
    if (failureOutcome) {
      return failureOutcome;
    }

    return { ok: true, context, persisted: synced.data };
  }

  private failureOutcomeIfTerminal(
    context: OrchestrationContext,
    jobId: EntityId,
  ): PipelineTriggerFailure | null {
    if (context.job.state === 'failed' || context.job.state === 'retry_pending') {
      return this.buildPipelineFailure(jobId, context.job.failure, 'pipeline_error');
    }

    return null;
  }

  private async finalizeAbortedPipeline(
    scope: OwnerScope,
    persisted: JobRecord,
    context: OrchestrationContext | null,
    failure: JobFailure,
    occurredAt: IsoDateTime,
    jobId: EntityId,
    options?: { outcomeCode?: PipelineTriggerFailure['code'] },
  ): Promise<PipelineTriggerFailure> {
    if (isAcceptablePipelineExitState(persisted.state)) {
      return this.buildPipelineFailure(
        jobId,
        persisted.failure ?? failure,
        options?.outcomeCode ?? 'pipeline_error',
      );
    }

    let workingPersisted = persisted;

    if (context) {
      const propagated = this.deps.orchestrator.propagateFailure({
        context,
        failure,
        occurredAt,
        stageId: context.currentStageId ?? 'validation',
      });

      if (propagated.ok) {
        const synced = await this.syncPersistedJob(
          scope,
          workingPersisted,
          propagated.data.context.job,
          occurredAt,
        );

        if (synced.ok && isAcceptablePipelineExitState(synced.data.state)) {
          return this.buildPipelineFailure(
            jobId,
            synced.data.failure ?? propagated.data.context.job.failure ?? failure,
            options?.outcomeCode ?? 'pipeline_error',
          );
        }

        if (synced.ok) {
          workingPersisted = synced.data;
        }
      }
    }

    if (isAcceptablePipelineExitState(workingPersisted.state)) {
      return this.buildPipelineFailure(
        jobId,
        workingPersisted.failure ?? failure,
        options?.outcomeCode ?? 'pipeline_error',
      );
    }

    const forcedTarget: JobRecord = {
      ...workingPersisted,
      state: 'failed',
      progressPercent: resolveProgressPercentForState('failed'),
      failure,
      completedAt: occurredAt,
    };

    const forcedSync = await this.syncPersistedJob(scope, workingPersisted, forcedTarget, occurredAt);
    const resolvedFailure = forcedSync.ok
      ? (forcedSync.data.failure ?? failure)
      : failure;

    return this.buildPipelineFailure(jobId, resolvedFailure, options?.outcomeCode ?? 'pipeline_error');
  }

  private buildPipelineFailure(
    jobId: EntityId,
    failure: JobFailure | undefined,
    code: PipelineTriggerFailure['code'],
  ): PipelineTriggerFailure {
    const resolvedFailure =
      failure ??
      ({
        code: 'analysis_failed',
        category: 'processing',
        message: 'Analysis pipeline failed.',
        retryable: false,
        occurredAt: new Date().toISOString(),
      } satisfies JobFailure);

    return {
      ok: false,
      code,
      message: resolvedFailure.message,
      jobId,
      failure: resolvedFailure,
    };
  }

  private async completeValidationAndOwnership(
    context: OrchestrationContext,
    occurredAt: IsoDateTime,
  ): Promise<OrchestrationResult<{ context: OrchestrationContext }>> {
    let current = context;

    for (const stageId of ['validation', 'ownership'] as const) {
      const step = this.deps.orchestrator.completeStage(current, {
        stageId,
        jobId: current.job.jobId,
        completedAt: occurredAt,
        outcome: 'success',
      });

      if (!step.ok) {
        return step;
      }

      current = step.data.context;
    }

    return { ok: true, data: { context: current } };
  }

  private async runLinkIntelligenceStage(
    context: OrchestrationContext,
    reference: Reference,
    occurredAt: IsoDateTime,
  ): Promise<
    OrchestrationResult<{ context: OrchestrationContext; linkMetadata?: ReferenceIntakeView['linkMetadata'] }>
  > {
    const rawUrl = reference.canonicalUrl;
    if (!rawUrl) {
      return {
        ok: false,
        error: {
          code: 'validation_error',
          message: 'YouTube references require a canonical URL.',
          stageId: 'link_intelligence',
        },
      };
    }

    const executed = await executeLinkIntelligenceStage(
      this.deps.orchestrator,
      this.deps.linkCoordinator,
      context,
      { rawUrl, occurredAt },
    );

    if (!executed.ok) {
      return executed;
    }

    const resolved = await this.deps.linkCoordinator.analyzeLink({
      jobId: context.job.jobId,
      referenceId: context.referenceId,
      projectId: context.projectId,
      ownerId: context.ownerId,
      referenceKind: context.plan.referenceKind,
      rawUrl,
      occurredAt,
    });

    return {
      ok: true,
      data: {
        context: executed.data.context,
        linkMetadata: resolved.ok ? resolved.data.linkMetadata : undefined,
      },
    };
  }

  private async runFingerprintStub(
    context: OrchestrationContext,
    referenceId: EntityId,
    occurredAt: IsoDateTime,
  ): Promise<OrchestrationResult<OrchestrationContext>> {
    const stub = stubFingerprintForReference(referenceId, this.deps.fingerprintStub);
    const completed = this.deps.orchestrator.completeStage(context, {
      stageId: 'fingerprint',
      jobId: context.job.jobId,
      completedAt: occurredAt,
      outcome: 'success',
      message: 'Fingerprint stub bound for mock pipeline',
    });

    if (!completed.ok) {
      return completed;
    }

    return {
      ok: true,
      data: {
        ...completed.data.context,
        fingerprintId: stub.fingerprintId,
        fingerprintAlgorithmVersion: stub.fingerprintAlgorithmVersion,
      },
    };
  }

  private async completeMvpTailStages(
    context: OrchestrationContext,
    occurredAt: IsoDateTime,
  ): Promise<OrchestrationResult<OrchestrationContext>> {
    let current = context;

    while (true) {
      const nextStageId = this.deps.orchestrator.getNextStage(current);
      if (!nextStageId) {
        break;
      }

      if (!MVP_TAIL_STAGE_IDS.includes(nextStageId as (typeof MVP_TAIL_STAGE_IDS)[number])) {
        return {
          ok: false,
          error: {
            code: 'invalid_stage',
            message: `Unexpected pending stage "${nextStageId}" after analysis pipeline`,
            stageId: nextStageId,
          },
        };
      }

      const step = this.deps.orchestrator.completeStage(current, {
        stageId: nextStageId,
        jobId: current.job.jobId,
        completedAt: occurredAt,
        outcome: 'success',
        message: `MVP stub completed ${nextStageId}`,
      });

      if (!step.ok) {
        return step;
      }

      current = step.data.context;
    }

    return { ok: true, data: current };
  }

  private async syncPersistedJob(
    scope: OwnerScope,
    persisted: JobRecord,
    target: JobRecord,
    _occurredAt: IsoDateTime,
  ): Promise<PersistenceResult<JobRecord>> {
    if (
      persisted.state === target.state &&
      persisted.progressPercent === target.progressPercent &&
      persisted.failure?.code === target.failure?.code &&
      persisted.cacheHit === target.cacheHit &&
      persisted.completedAt === target.completedAt
    ) {
      return { ok: true, data: persisted };
    }

    const path = findShortestStatePath(persisted.state, target.state);
    if (path === null) {
      return {
        ok: false,
        code: 'validation_error',
        message: `Unable to sync job state from ${persisted.state} to ${target.state}`,
      };
    }

    let current = persisted;

    for (const nextState of path) {
      const isFinal = nextState === target.state;
      const transition = {
        jobId: current.jobId,
        expectedState: current.state,
        nextState,
        progressPercent: isFinal
          ? target.progressPercent
          : resolveProgressPercentForState(nextState),
        ...(isFinal && target.failure ? { failure: target.failure } : {}),
        ...(isFinal && target.completedAt ? { completedAt: target.completedAt } : {}),
        ...(isFinal && target.cacheHit !== undefined ? { cacheHit: target.cacheHit } : {}),
      };

      const result = await this.deps.jobRepository.transitionState(scope, transition);
      if (!result.ok) {
        return result;
      }
      current = result.data;
    }

    return { ok: true, data: current };
  }

  private async pipelineError(
    result: OrchestrationResult<unknown>,
    scope: OwnerScope,
    persisted: JobRecord,
    context: OrchestrationContext | null,
    occurredAt: IsoDateTime,
    jobId: EntityId,
  ): Promise<PipelineTriggerFailure> {
    if (result.ok) {
      return this.finalizeAbortedPipeline(
        scope,
        persisted,
        context,
        {
          code: 'analysis_failed',
          category: 'processing',
          message: 'Unexpected orchestration success during pipeline abort.',
          retryable: false,
          occurredAt,
        },
        occurredAt,
        jobId,
      );
    }

    const failure = mapOrchestrationErrorToJobFailure(result.error, occurredAt);
    return this.finalizeAbortedPipeline(scope, persisted, context, failure, occurredAt, jobId);
  }

  private async persistenceSyncError(
    result: PersistenceResult<JobRecord>,
    scope: OwnerScope,
    persisted: JobRecord,
    context: OrchestrationContext | null,
    occurredAt: IsoDateTime,
    jobId: EntityId,
  ): Promise<PipelineTriggerFailure> {
    const syncMessage =
      !result.ok && result.code === 'conflict'
        ? 'Analysis job state changed unexpectedly during persistence sync.'
        : 'Unable to persist analysis job progress.';

    const failure: JobFailure = {
      code: 'storage_error',
      category: 'infrastructure',
      message: !result.ok && result.message ? result.message : syncMessage,
      retryable: true,
      occurredAt,
    };

    const outcomeCode: PipelineTriggerFailure['code'] =
      !result.ok && result.code === 'conflict' ? 'conflict' : 'persistence_error';

    const finalized = await this.finalizeAbortedPipeline(
      scope,
      persisted,
      context,
      failure,
      occurredAt,
      jobId,
      { outcomeCode },
    );

    if (outcomeCode === 'conflict') {
      return {
        ...finalized,
        code: 'conflict',
        message: 'Analysis job state changed unexpectedly. Refresh and try again.',
      };
    }

    if (outcomeCode === 'persistence_error') {
      return {
        ...finalized,
        code: 'persistence_error',
        message: 'Unable to persist analysis job progress. Try again in a moment.',
      };
    }

    return finalized;
  }
}

export function createPipelineTriggerService(
  deps: PipelineTriggerServiceDeps,
): PipelineTriggerService {
  return new PipelineTriggerService(deps);
}
