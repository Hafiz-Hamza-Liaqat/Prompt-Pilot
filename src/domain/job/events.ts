import type { JobState } from '../canonical/constants.js';
import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';

/** Lifecycle event types — persistence-agnostic audit stream. */
export const JOB_LIFECYCLE_EVENT_TYPES = [
  'stage_entered',
  'stage_completed',
  'checkpoint',
  'warning',
  'cancelled',
  'expired',
  'retry_scheduled',
  'failed',
  'completed',
] as const;

export type JobLifecycleEventType = (typeof JOB_LIFECYCLE_EVENT_TYPES)[number];

export type JobLifecycleEvent = {
  eventId: EntityId;
  jobId: EntityId;
  stage: JobState;
  eventType: JobLifecycleEventType;
  message?: string;
  occurredAt: IsoDateTime;
};

export type AppendJobLifecycleEventInput = Omit<JobLifecycleEvent, 'eventId' | 'jobId'>;

export type JobLifecycleEventFilter = {
  jobId: EntityId;
  eventTypes?: readonly JobLifecycleEventType[];
  since?: IsoDateTime;
};

/** Maps lifecycle events to PP-05B persistence event types where applicable. */
export const PERSISTABLE_JOB_EVENT_TYPES = [
  'stage_entered',
  'stage_completed',
  'checkpoint',
  'warning',
] as const satisfies readonly JobLifecycleEventType[];

export type PersistableJobEventType = (typeof PERSISTABLE_JOB_EVENT_TYPES)[number];

export function isPersistableJobEventType(
  eventType: JobLifecycleEventType,
): eventType is PersistableJobEventType {
  return (PERSISTABLE_JOB_EVENT_TYPES as readonly JobLifecycleEventType[]).includes(eventType);
}

export function buildStageEnteredEvent(
  stage: JobState,
  occurredAt: IsoDateTime,
  message?: string,
): AppendJobLifecycleEventInput {
  return { stage, eventType: 'stage_entered', occurredAt, message };
}

export function buildStageCompletedEvent(
  stage: JobState,
  occurredAt: IsoDateTime,
  message?: string,
): AppendJobLifecycleEventInput {
  return { stage, eventType: 'stage_completed', occurredAt, message };
}
