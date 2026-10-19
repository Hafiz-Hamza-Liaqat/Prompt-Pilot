import type { ReferenceKind } from '../canonical/constants.js';
import type { JobFailure } from '../canonical/job.js';
import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';
import type { DependencyGraph, PipelineStageId, StageDefinition } from './stages.js';

export type StageCompletionOutcome = 'success' | 'skipped' | 'failed';

export type StageCompletion = {
  stageId: PipelineStageId;
  jobId: EntityId;
  completedAt: IsoDateTime;
  outcome: StageCompletionOutcome;
  cacheHit?: boolean;
  failure?: JobFailure;
  message?: string;
};

export type ExecutionPlan = {
  planId: EntityId;
  jobId: EntityId;
  referenceId: EntityId;
  referenceKind: ReferenceKind;
  stages: readonly StageDefinition[];
  dependencyGraph: DependencyGraph;
  /** When true, core_analysis may be skipped after cache_lookup. */
  allowCacheShortCircuit: boolean;
  completedStageIds: readonly PipelineStageId[];
  skippedStageIds: readonly PipelineStageId[];
};

export function isStageComplete(plan: ExecutionPlan, stageId: PipelineStageId): boolean {
  return plan.completedStageIds.includes(stageId) || plan.skippedStageIds.includes(stageId);
}

export function getNextPendingStage(plan: ExecutionPlan): StageDefinition | null {
  for (const stage of plan.stages) {
    if (!isStageComplete(plan, stage.stageId)) {
      const depsSatisfied = stage.dependsOn.every((dep) => isStageComplete(plan, dep));
      if (depsSatisfied) {
        return stage;
      }
    }
  }
  return null;
}

export function markStageCompleted(
  plan: ExecutionPlan,
  completion: StageCompletion,
): ExecutionPlan {
  if (completion.outcome === 'skipped') {
    return {
      ...plan,
      skippedStageIds: [...plan.skippedStageIds, completion.stageId],
    };
  }
  return {
    ...plan,
    completedStageIds: [...plan.completedStageIds, completion.stageId],
  };
}

export function isPlanTerminal(plan: ExecutionPlan): boolean {
  return plan.stages.every((stage) => isStageComplete(plan, stage.stageId));
}
