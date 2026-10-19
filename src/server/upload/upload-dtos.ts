import type { UploadReferenceKind } from '@/domain/media';
import type { EntityId } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';

/** Public upload target — no StorageLocator (G-29). */
export type UploadTargetDto = {
  method: 'single_put' | 'multipart';
  expiresAt: IsoDateTime;
  providerPayload: Record<string, unknown>;
};

export type InitiateUploadRequestDto = {
  referenceId: EntityId;
  referenceKind: UploadReferenceKind;
  expectedBytes: number;
  mimeType: string;
  chunkSizeBytes?: number;
  clientRequestId?: string;
  durationSeconds?: number;
};

export type InitiateUploadResponseDto = {
  sessionId: EntityId;
  jobId: EntityId;
  state: string;
  expectedBytes: number;
  chunkSizeBytes: number;
  uploadMethod: 'single_put' | 'multipart';
  expiresAt: IsoDateTime;
  uploadTarget: UploadTargetDto;
};

export type UploadChunkResponseDto = {
  sessionId: EntityId;
  chunkIndex: number;
  uploadedBytes: number;
  expectedBytes: number;
  progressPercent: number;
  jobProgressPercent: number;
  complete: boolean;
};

export type UploadStatusResponseDto = {
  sessionId: EntityId;
  jobId?: EntityId;
  state: string;
  uploadedBytes: number;
  expectedBytes: number;
  progressPercent: number;
  jobProgressPercent?: number;
  expiresAt: IsoDateTime;
  uploadMethod: 'single_put' | 'multipart';
};

export type CompleteUploadRequestDto = {
  contentHash: string;
  durationSeconds?: number;
};

export type CompleteUploadResponseDto = {
  sessionId: EntityId;
  jobId: EntityId;
  jobState: string;
  jobProgressPercent: number;
  assetId: EntityId;
};

export type ResumeUploadResponseDto = {
  sessionId: EntityId;
  uploadedBytes: number;
  nextChunkIndex: number;
  uploadTarget: UploadTargetDto;
};

export type CancelUploadResponseDto = {
  sessionId: EntityId;
  jobId?: EntityId;
  state: string;
};

export type UploadApiErrorDto = {
  code: string;
  message: string;
};
