import type { ReferenceKind } from '../canonical/constants.js';
import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';
import type { StorageLocator } from './constants.js';
import type { MediaIntakeContext, MediaOwnerScope } from './models.js';
import type { UploadSession } from './upload-session.js';

/** Request to open a new upload session — no bytes transferred. */
export type UploadRequest = MediaIntakeContext & {
  sessionId: EntityId;
  referenceKind: Extract<ReferenceKind, 'video_upload' | 'audio_upload'>;
  expectedBytes: number;
  mimeType: string;
  chunkSizeBytes?: number;
  requestedAt: IsoDateTime;
};

/** Confirms successful upload and binds storage descriptor to session. */
export type UploadCompletion = {
  sessionId: EntityId;
  scope: MediaOwnerScope;
  uploadedBytes: number;
  contentHash: string;
  contentHashAlgorithm: 'sha256';
  durationSeconds?: number;
  storageLocator: StorageLocator;
  completedAt: IsoDateTime;
};

/** User or system cancellation before completion. */
export type UploadCancellation = {
  sessionId: EntityId;
  scope: MediaOwnerScope;
  reason?: string;
  cancelledAt: IsoDateTime;
};

/** Resume interrupted upload — aligns with PP-06 upload resume boundary. */
export type UploadResume = {
  sessionId: EntityId;
  scope: MediaOwnerScope;
  uploadedBytes: number;
  nextChunkIndex: number;
  requestedAt: IsoDateTime;
};

export type UploadSessionRegistration = {
  request: UploadRequest;
  expiresAt: IsoDateTime;
};

export type UploadSessionSnapshot = UploadSession;

export type UploadProgressUpdate = {
  sessionId: EntityId;
  scope: MediaOwnerScope;
  uploadedBytes: number;
  occurredAt: IsoDateTime;
};

export type UploadSessionTransition =
  | { kind: 'start_upload'; occurredAt: IsoDateTime }
  | { kind: 'pause'; occurredAt: IsoDateTime }
  | { kind: 'resume'; occurredAt: IsoDateTime; uploadedBytes: number }
  | { kind: 'complete'; completion: UploadCompletion }
  | { kind: 'cancel'; cancellation: UploadCancellation }
  | { kind: 'expire'; expiredAt: IsoDateTime }
  | { kind: 'fail'; message: string; occurredAt: IsoDateTime };
