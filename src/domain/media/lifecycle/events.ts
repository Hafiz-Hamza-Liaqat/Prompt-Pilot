import type { EntityId } from '../../canonical/primitives.js';
import type { IsoDateTime } from '../../common.js';
import type { AssetState } from '../constants.js';

export const MEDIA_LIFECYCLE_EVENT_TYPES = [
  'session_initiated',
  'upload_started',
  'upload_progress',
  'upload_paused',
  'upload_resumed',
  'upload_completed',
  'upload_cancelled',
  'upload_expired',
  'upload_failed',
  'asset_staged',
  'asset_activated',
  'asset_expired',
  'asset_deleted',
  'asset_quarantined',
  'cleanup_scheduled',
  'cleanup_completed',
] as const;

export type MediaLifecycleEventType = (typeof MEDIA_LIFECYCLE_EVENT_TYPES)[number];

export type MediaLifecycleEvent = {
  eventId: EntityId;
  eventType: MediaLifecycleEventType;
  sessionId?: EntityId;
  assetId?: EntityId;
  referenceId?: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  assetState?: AssetState;
  message?: string;
  occurredAt: IsoDateTime;
};

export type AppendMediaLifecycleEventInput = Omit<MediaLifecycleEvent, 'eventId'>;

export type MediaLifecycleEventFilter = {
  projectId: EntityId;
  ownerId: EntityId;
  sessionId?: EntityId;
  assetId?: EntityId;
  eventTypes?: readonly MediaLifecycleEventType[];
  since?: IsoDateTime;
};

export function buildUploadCompletedEvent(
  input: Omit<AppendMediaLifecycleEventInput, 'eventType'>,
): AppendMediaLifecycleEventInput {
  return { ...input, eventType: 'upload_completed' };
}

export function buildAssetExpiredEvent(
  input: Omit<AppendMediaLifecycleEventInput, 'eventType'>,
): AppendMediaLifecycleEventInput {
  return { ...input, eventType: 'asset_expired', assetState: 'expired' };
}
