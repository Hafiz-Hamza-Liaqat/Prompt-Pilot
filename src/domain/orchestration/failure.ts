import type { JobFailure } from '../canonical/job.js';
import type { JobState } from '../canonical/constants.js';
import { JOB_FAILURE_CODE_CATEGORY } from '../canonical/job.js';
import type { IsoDateTime } from '../common.js';
import type { PipelineStageId } from './stages.js';
import { STAGE_DEFINITIONS } from './stages.js';
import { resolveProgressPercentForState } from '../job/progress.js';

export type StageTimeoutPolicy = {
  stageId: PipelineStageId;
  timeoutMs: number;
};

export const DEFAULT_STAGE_TIMEOUT_POLICIES: readonly StageTimeoutPolicy[] = [
  { stageId: 'link_intelligence', timeoutMs: 30_000 },
  { stageId: 'media_intake', timeoutMs: 3_600_000 },
  { stageId: 'core_analysis', timeoutMs: 600_000 },
  { stageId: 'package_generation', timeoutMs: 300_000 },
  { stageId: 'persistence', timeoutMs: 120_000 },
];

export type TimeoutEvaluation = {
  exceeded: boolean;
  stageId: PipelineStageId;
  deadlineAt: IsoDateTime;
};

export function resolveStageTimeoutMs(
  stageId: PipelineStageId,
  policies: readonly StageTimeoutPolicy[] = DEFAULT_STAGE_TIMEOUT_POLICIES,
): number | null {
  return policies.find((policy) => policy.stageId === stageId)?.timeoutMs ?? null;
}

export function evaluateStageTimeout(
  stageId: PipelineStageId,
  stageStartedAt: IsoDateTime,
  now: IsoDateTime,
  policies?: readonly StageTimeoutPolicy[],
): TimeoutEvaluation | null {
  const timeoutMs = resolveStageTimeoutMs(stageId, policies);
  if (timeoutMs === null) {
    return null;
  }

  const deadlineMs = Date.parse(stageStartedAt) + timeoutMs;
  const deadlineAt = new Date(deadlineMs).toISOString();

  return {
    stageId,
    deadlineAt,
    exceeded: Date.parse(now) >= deadlineMs,
  };
}

export function buildTimeoutFailure(
  stageId: PipelineStageId,
  occurredAt: IsoDateTime,
): JobFailure {
  return {
    code: 'timeout',
    category: JOB_FAILURE_CODE_CATEGORY.timeout,
    message: `Stage "${stageId}" exceeded timeout budget`,
    retryable: true,
    occurredAt,
  };
}

/** Maps a completed pipeline stage to the target job state for lifecycle transition. */
export function resolveJobStateForStage(stageId: PipelineStageId): JobState {
  const definition = STAGE_DEFINITIONS[stageId];
  return definition.jobStates.at(-1) ?? 'queued';
}

export function resolveProgressForStage(stageId: PipelineStageId): number {
  const state = resolveJobStateForStage(stageId);
  if (state === 'completed') {
    return 100;
  }
  return resolveProgressPercentForState(state);
}

export type PropagatedFailure = {
  stageId: PipelineStageId;
  targetState: 'failed' | 'retry_pending';
  failure: JobFailure;
};

export function classifyStageFailure(
  failure: JobFailure,
  retryable: boolean,
): PropagatedFailure['targetState'] {
  if (retryable && failure.retryable) {
    return 'retry_pending';
  }
  return 'failed';
}
