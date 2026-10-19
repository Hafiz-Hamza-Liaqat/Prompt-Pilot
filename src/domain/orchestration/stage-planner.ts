import type { ReferenceKind } from '../canonical/constants.js';
import type { EntityId } from '../canonical/primitives.js';
import type { ExecutionPlan } from './execution-plan.js';
import {
  buildDependencyGraph,
  PIPELINE_STAGE_IDS,
  requiresLinkIntelligence,
  requiresMediaIntake,
  resolveFingerprintDependencies,
  STAGE_DEFINITIONS,
  type PipelineStageId,
  type StageDefinition,
} from './stages.js';

export type StagePlannerInput = {
  planId: EntityId;
  jobId: EntityId;
  referenceId: EntityId;
  referenceKind: ReferenceKind;
  allowCacheShortCircuit?: boolean;
};

export type StagePlanner = {
  buildPlan(input: StagePlannerInput): ExecutionPlan;
  resolveStagesForReferenceKind(referenceKind: ReferenceKind): readonly StageDefinition[];
};

function resolveStagesForReferenceKind(referenceKind: ReferenceKind): readonly StageDefinition[] {
  const stageIds = PIPELINE_STAGE_IDS.filter((stageId) => {
    if (stageId === 'media_intake' && !requiresMediaIntake(referenceKind)) {
      return false;
    }
    if (stageId === 'link_intelligence' && !requiresLinkIntelligence(referenceKind)) {
      return false;
    }
    return true;
  });

  return stageIds.map((stageId) => {
    const base = STAGE_DEFINITIONS[stageId];
    let dependsOn = base.dependsOn.filter((dep) => (stageIds as readonly PipelineStageId[]).includes(dep));

    if (stageId === 'fingerprint') {
      dependsOn = [...resolveFingerprintDependencies(referenceKind, stageIds)];
    }

    return {
      ...base,
      dependsOn,
    };
  });
}

export function buildExecutionPlan(input: StagePlannerInput): ExecutionPlan {
  const stages = resolveStagesForReferenceKind(input.referenceKind);

  return {
    planId: input.planId,
    jobId: input.jobId,
    referenceId: input.referenceId,
    referenceKind: input.referenceKind,
    stages,
    dependencyGraph: buildDependencyGraph(),
    allowCacheShortCircuit: input.allowCacheShortCircuit ?? true,
    completedStageIds: [],
    skippedStageIds: [],
  };
}

export function applyCacheShortCircuit(plan: ExecutionPlan): ExecutionPlan {
  if (!plan.allowCacheShortCircuit) {
    return plan;
  }

  const skipIds: PipelineStageId[] = ['core_analysis'];
  return {
    ...plan,
    skippedStageIds: [...plan.skippedStageIds, ...skipIds.filter((id) => !plan.skippedStageIds.includes(id))],
  };
}

export const stagePlanner: StagePlanner = {
  buildPlan: buildExecutionPlan,
  resolveStagesForReferenceKind,
};
