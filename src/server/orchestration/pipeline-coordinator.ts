import type { JobState } from '@/domain/canonical/constants';
import type { JobRecord } from '@/domain/canonical';
import type { JobFailure } from '@/domain/canonical/job';
import type {
  ExecutionPlan,
  StageCompletion,
  StageDefinition,
} from '@/domain/orchestration';
import {
  resolveProgressPercentForState,
} from '@/domain/job';
import { JOB_STATE_TRANSITIONS } from '@/domain/job';
import type { JobTransitionRequest } from '@/domain/job';
import type { PipelineStageId } from '@/domain/orchestration';
import { STAGE_DEFINITIONS } from '@/domain/orchestration';

export type StageTransitionPlan = {
  targetState: JobState;
  transitions: readonly JobTransitionRequest[];
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

export function resolveTargetStateForStage(
  stageId: PipelineStageId,
  completion: StageCompletion,
): JobState | null {
  if (completion.outcome === 'failed' || completion.outcome === 'skipped') {
    return null;
  }

  switch (stageId) {
    case 'validation':
      return 'validated';
    case 'ownership':
      return 'queued';
    case 'link_intelligence':
      return 'fingerprinting';
    case 'media_intake':
      return 'fingerprinting';
    case 'fingerprint':
      return 'fingerprinting';
    case 'cache_lookup':
      return completion.cacheHit ? 'generating_packages' : null;
    case 'core_analysis':
      return 'analyzing';
    case 'package_generation':
      return 'generating_packages';
    case 'persistence':
      return 'saving';
    case 'workspace_refresh':
      return 'completed';
    default:
      return null;
  }
}

export function buildTransitionPlan(
  job: JobRecord,
  stageId: PipelineStageId,
  completion: StageCompletion,
  occurredAt: string,
): StageTransitionPlan | null {
  const targetState = resolveTargetStateForStage(stageId, completion);
  if (targetState === null) {
    return null;
  }

  const path = findShortestStatePath(job.state, targetState);
  if (path === null) {
    return null;
  }

  const transitions: JobTransitionRequest[] = path.map((nextState) => ({
    nextState,
    progressPercent: resolveProgressPercentForState(nextState),
    occurredAt,
    ...(nextState === 'completed' ? { completedAt: occurredAt } : {}),
    ...(stageId === 'cache_lookup' && completion.cacheHit && nextState === 'generating_packages'
      ? { cacheHit: true }
      : {}),
  }));

  return { targetState, transitions };
}

export function buildFailureTransition(
  job: JobRecord,
  failure: JobFailure,
  targetState: 'failed' | 'retry_pending',
  occurredAt: string,
): StageTransitionPlan | null {
  const path = findShortestStatePath(job.state, targetState);
  if (path === null) {
    return null;
  }

  const transitions: JobTransitionRequest[] = path.map((nextState) => {
    const needsFailure = nextState === 'failed' || nextState === 'retry_pending';
    return {
      nextState,
      progressPercent: job.progressPercent,
      occurredAt,
      ...(needsFailure ? { failure } : {}),
    };
  });

  return { targetState, transitions };
}

export type PipelineCoordinator = {
  resolveStageDefinition(stageId: PipelineStageId): StageDefinition;
  planStageTransitions(
    job: JobRecord,
    completion: StageCompletion,
  ): StageTransitionPlan | null;
  planFailureTransitions(
    job: JobRecord,
    failure: JobFailure,
    targetState: 'failed' | 'retry_pending',
    occurredAt: string,
  ): StageTransitionPlan | null;
  delegatePortForStage(stageId: PipelineStageId): StageDefinition['delegatePort'];
  requiresMediaIntakeStage(plan: ExecutionPlan): boolean;
};

export const pipelineCoordinator: PipelineCoordinator = {
  resolveStageDefinition(stageId) {
    return STAGE_DEFINITIONS[stageId];
  },

  planStageTransitions(job, completion) {
    return buildTransitionPlan(job, completion.stageId, completion, completion.completedAt);
  },

  planFailureTransitions(job, failure, targetState, occurredAt) {
    return buildFailureTransition(job, failure, targetState, occurredAt);
  },

  delegatePortForStage(stageId) {
    return STAGE_DEFINITIONS[stageId].delegatePort;
  },

  requiresMediaIntakeStage(plan) {
    return plan.stages.some((stage) => stage.stageId === 'media_intake');
  },
};
