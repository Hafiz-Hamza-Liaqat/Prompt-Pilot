import type { JobFailure } from '../canonical/job.js';
import type { IsoDateTime } from '../common.js';
import type { EntityId } from '../canonical/primitives.js';
import type { PipelineStageId } from './stages.js';

/** All orchestration event types — emitted and deferred. */
export const ORCHESTRATION_EVENT_TYPES = [
  'orchestration_started',
  'stage_planned',
  'stage_delegated',
  'stage_completed',
  'stage_skipped',
  'stage_failed',
  'failure_propagated',
  'retry_planned',
  'cancellation_requested',
  'resume_planned',
  'orchestration_completed',
  'timeout_scheduled',
] as const;

export type OrchestrationEventType = (typeof ORCHESTRATION_EVENT_TYPES)[number];

/** Emitted by {@link DefaultJobOrchestrator} in PP-08 / PP-08.1. */
export const ORCHESTRATION_EMITTED_EVENT_TYPES = [
  'orchestration_started',
  'stage_planned',
  'stage_delegated',
  'stage_completed',
  'stage_skipped',
  'stage_failed',
  'failure_propagated',
  'retry_planned',
  'cancellation_requested',
  'resume_planned',
  'orchestration_completed',
] as const satisfies readonly OrchestrationEventType[];

export type OrchestrationEmittedEventType = (typeof ORCHESTRATION_EMITTED_EVENT_TYPES)[number];

/**
 * Reserved for worker/scheduler boundary — not emitted by the orchestrator in PP-08.
 * Workers publish `timeout_scheduled` when arming stage deadlines; orchestrator only
 * defines timeout policy contracts in `failure.ts`.
 */
export const ORCHESTRATION_DEFERRED_EVENT_TYPES = ['timeout_scheduled'] as const satisfies readonly OrchestrationEventType[];

export type OrchestrationDeferredEventType = (typeof ORCHESTRATION_DEFERRED_EVENT_TYPES)[number];

export type OrchestrationEvent = {
  eventId: EntityId;
  eventType: OrchestrationEventType;
  jobId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  stageId?: PipelineStageId;
  message?: string;
  failure?: JobFailure;
  occurredAt: IsoDateTime;
};

export type AppendOrchestrationEventInput = Omit<OrchestrationEvent, 'eventId'>;

export function buildStageCompletedEvent(
  input: Omit<AppendOrchestrationEventInput, 'eventType'>,
): AppendOrchestrationEventInput {
  return { ...input, eventType: 'stage_completed' };
}

export function buildFailurePropagatedEvent(
  input: Omit<AppendOrchestrationEventInput, 'eventType'>,
): AppendOrchestrationEventInput {
  return { ...input, eventType: 'failure_propagated' };
}
