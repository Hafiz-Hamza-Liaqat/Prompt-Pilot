import { randomUUID } from 'node:crypto';
import type { EntityId } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type {
  MediaOwnerScope,
  StorageLocator,
  UploadReferenceKind,
} from '@/domain/media';
import { DEFAULT_EXPIRATION_POLICY } from '@/domain/media';
import type { MediaIntakeService } from '@/server/media/media-intake-service';
import type { OrchestrationContext } from '@/domain/orchestration';
import type { JobOrchestrator } from '@/server/orchestration';
import type { OwnerScope } from '@/server/persistence/contracts/ownership';
import type { UploadSessionRepository } from '@/server/persistence/repositories/upload-session-repository';
import type {
  WorkspaceAssetRecord,
  WorkspaceAssetRepository,
} from '@/server/persistence/repositories/workspace-asset-repository';
import {
  mapUploadBytesToJobProgress,
  resolveChunkSizeBytes,
  resolveUploadMethod,
} from './config.js';
import {
  computeChunkByteSize,
  computeUploadedBytes,
  validateChunkIndex,
} from './chunk-utils.js';
import { sanitizeProviderPayloadForClient } from './provider-payload.js';
import type { UploadStoragePort } from './upload-storage-port.js';
import type {
  CancelUploadResponseDto,
  CompleteUploadRequestDto,
  CompleteUploadResponseDto,
  InitiateUploadRequestDto,
  InitiateUploadResponseDto,
  ResumeUploadResponseDto,
  UploadChunkResponseDto,
  UploadStatusResponseDto,
} from './upload-dtos.js';

export type UploadCoordinatorResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

function uploadOk<T>(data: T): UploadCoordinatorResult<T> {
  return { ok: true, data };
}

function uploadErr<T>(code: string, message: string): UploadCoordinatorResult<T> {
  return { ok: false, code, message };
}

type SessionRuntime = {
  assetId: EntityId;
  storageLocator: StorageLocator;
  uploadMethod: 'single_put' | 'multipart';
  uploadTargetExpiresAt: IsoDateTime;
  providerPayload: Record<string, unknown>;
  orchestrationContext?: OrchestrationContext;
  completedChunkIndices: Set<number>;
};

export type UploadCoordinatorDeps = {
  mediaIntake: MediaIntakeService;
  storage: UploadStoragePort;
  sessionRepository: UploadSessionRepository;
  assetRepository: WorkspaceAssetRepository;
  orchestrator: JobOrchestrator;
};

export type InitiateUploadInput = InitiateUploadRequestDto & {
  projectId: EntityId;
  ownerId: EntityId;
  occurredAt: IsoDateTime;
};

/**
 * Coordinates upload mechanics — session, storage, intake, and orchestrator workflow.
 * Does not implement HTTP or business rules in controllers.
 */
export class UploadCoordinator {
  private readonly runtime = new Map<string, SessionRuntime>();

  constructor(private readonly deps: UploadCoordinatorDeps) {}

  async initiateUpload(input: InitiateUploadInput): Promise<UploadCoordinatorResult<InitiateUploadResponseDto>> {
    const scope: MediaOwnerScope = { ownerId: input.ownerId, projectId: input.projectId };
    const ownerScope: OwnerScope = { ownerId: input.ownerId, projectId: input.projectId };
    const sessionId = randomUUID() as EntityId;
    const jobId = randomUUID() as EntityId;
    const assetId = randomUUID() as EntityId;
    const chunkSizeBytes = resolveChunkSizeBytes(input.chunkSizeBytes);
    const uploadMethod = resolveUploadMethod(input.expectedBytes);

    const uploadRequest = {
      sessionId,
      projectId: input.projectId,
      ownerId: input.ownerId,
      referenceId: input.referenceId,
      jobId,
      referenceKind: input.referenceKind as UploadReferenceKind,
      expectedBytes: input.expectedBytes,
      mimeType: input.mimeType,
      chunkSizeBytes,
      requestedAt: input.occurredAt,
    };

    const planned = this.deps.mediaIntake.planUploadRequest(uploadRequest);
    if (!planned.ok) {
      return uploadErr(planned.error.code, planned.error.message);
    }

    const registered = this.deps.mediaIntake.registerSession(planned.data);
    if (!registered.ok) {
      return uploadErr(registered.error.code, registered.error.message);
    }

    const started = this.deps.orchestrator.start({
      jobId,
      projectId: input.projectId,
      ownerId: input.ownerId,
      referenceId: input.referenceId,
      referenceKind: input.referenceKind,
      occurredAt: input.occurredAt,
    });
    if (!started.ok) {
      return uploadErr(started.error.code, started.error.message);
    }

    let orchestrationContext = await this.advanceToMediaIntakeStage(started.data.context, input.occurredAt);
    if (!orchestrationContext) {
      this.rollbackOrchestration(started.data.context, input.occurredAt, 'Failed to advance job to media intake stage');
      return uploadErr('lifecycle_rejected', 'Failed to advance job to media intake stage');
    }

    const expiresAt = new Date(
      Date.parse(input.occurredAt) + DEFAULT_EXPIRATION_POLICY.tempAssetTtlHours * 3_600_000,
    ).toISOString();

    const prepared = await this.deps.storage.prepareUpload({
      scope,
      assetId,
      mimeType: input.mimeType,
      byteSize: input.expectedBytes,
      classification: 'temporary',
      expiresAt,
    });
    if (!prepared.ok) {
      this.rollbackOrchestration(orchestrationContext, input.occurredAt, 'Storage prepare failed');
      return uploadErr('storage_unavailable', prepared.message ?? 'Storage prepare failed');
    }

    const saved = await this.deps.sessionRepository.save(ownerScope, registered.data);
    if (!saved.ok) {
      await this.deps.storage.deleteObject({ scope, locator: prepared.descriptor.locator });
      this.rollbackOrchestration(orchestrationContext, input.occurredAt, 'Failed to persist session');
      return uploadErr(saved.code, saved.message ?? 'Failed to persist session');
    }

    orchestrationContext = {
      ...orchestrationContext,
      uploadSessionId: sessionId,
    };

    const clientProviderPayload = sanitizeProviderPayloadForClient(prepared.uploadTarget.providerPayload);

    this.runtime.set(sessionId, {
      assetId,
      storageLocator: prepared.descriptor.locator,
      uploadMethod,
      uploadTargetExpiresAt: prepared.uploadTarget.expiresAt,
      providerPayload: clientProviderPayload,
      orchestrationContext,
      completedChunkIndices: new Set(),
    });

    return uploadOk({
      sessionId,
      jobId,
      state: registered.data.state,
      expectedBytes: input.expectedBytes,
      chunkSizeBytes,
      uploadMethod,
      expiresAt: registered.data.expiresAt,
      uploadTarget: {
        method: uploadMethod,
        expiresAt: prepared.uploadTarget.expiresAt,
        providerPayload: clientProviderPayload,
      },
    });
  }

  async uploadChunk(
    scope: OwnerScope,
    sessionId: EntityId,
    chunkIndex: number,
    data: Buffer,
    occurredAt: IsoDateTime,
  ): Promise<UploadCoordinatorResult<UploadChunkResponseDto>> {
    const mediaScope: MediaOwnerScope = { ownerId: scope.ownerId, projectId: scope.projectId };
    const loaded = await this.deps.sessionRepository.findById(scope, sessionId);
    if (!loaded.ok) {
      return uploadErr('session_not_found', loaded.message ?? 'Session not found');
    }

    const runtime = this.runtime.get(sessionId);
    if (!runtime) {
      return uploadErr('session_not_found', 'Upload runtime not found');
    }

    let session = loaded.data;
    const expectedBytes = session.expectedBytes ?? 0;
    const chunkSizeBytes = session.chunkSizeBytes ?? resolveChunkSizeBytes();

    const chunkValidation = validateChunkIndex(chunkIndex, expectedBytes, chunkSizeBytes);
    if (!chunkValidation.ok) {
      return uploadErr('validation_error', chunkValidation.message);
    }

    if (runtime.completedChunkIndices.has(chunkIndex) && data.length === chunkValidation.chunkSize) {
      return uploadOk(this.buildChunkResponse(session, runtime, chunkIndex, expectedBytes));
    }

    if (session.state === 'initiated') {
      const started = this.deps.mediaIntake.startSession(session, mediaScope, occurredAt);
      if (!started.ok) {
        return uploadErr(started.error.code, started.error.message);
      }
      session = started.data;
      await this.syncJobToUploading(runtime, occurredAt);
    }

    if (session.state !== 'uploading') {
      return uploadErr('session_terminal', `Cannot upload chunk in state "${session.state}"`);
    }

    if (data.length !== chunkValidation.chunkSize) {
      return uploadErr('validation_error', `Expected ${chunkValidation.chunkSize} bytes, received ${data.length}`);
    }

    const written = await this.deps.storage.writePart({
      locator: runtime.storageLocator,
      chunkIndex,
      data,
      expectedChunkSize: chunkValidation.chunkSize,
    });
    if (!written.ok) {
      return uploadErr('storage_unavailable', written.message ?? 'Chunk write failed');
    }

    runtime.completedChunkIndices.add(chunkIndex);
    const uploadedBytes = computeUploadedBytes(chunkIndex, chunkSizeBytes, expectedBytes);

    const progressed = this.deps.mediaIntake.recordProgress(session, mediaScope, uploadedBytes, occurredAt);
    if (!progressed.ok) {
      return uploadErr(progressed.error.code, progressed.error.message);
    }

    session = progressed.data;
    await this.deps.sessionRepository.update(scope, session);
    await this.updateJobUploadProgress(runtime, uploadedBytes, expectedBytes, occurredAt);

    return uploadOk(this.buildChunkResponse(session, runtime, chunkIndex, expectedBytes));
  }

  async completeUpload(
    scope: OwnerScope,
    sessionId: EntityId,
    body: CompleteUploadRequestDto,
    occurredAt: IsoDateTime,
  ): Promise<UploadCoordinatorResult<CompleteUploadResponseDto>> {
    const mediaScope: MediaOwnerScope = { ownerId: scope.ownerId, projectId: scope.projectId };
    const loaded = await this.deps.sessionRepository.findById(scope, sessionId);
    if (!loaded.ok) {
      return uploadErr('session_not_found', loaded.message ?? 'Session not found');
    }

    const runtime = this.runtime.get(sessionId);
    if (!runtime?.orchestrationContext) {
      return uploadErr('session_not_found', 'Upload runtime not found');
    }

    const session = loaded.data;
    const expectedBytes = session.expectedBytes ?? 0;

    if (session.uploadedBytes !== expectedBytes) {
      return uploadErr('validation_error', 'Upload is incomplete');
    }

    const confirmed = await this.deps.storage.confirmUpload({
      scope: mediaScope,
      locator: runtime.storageLocator,
    });
    if (!confirmed.ok) {
      return uploadErr('storage_unavailable', confirmed.message ?? 'Storage confirm failed');
    }

    if (!this.deps.storage.verifyContentHash(runtime.storageLocator, body.contentHash)) {
      return uploadErr('invalid_content_hash', 'Content hash does not match uploaded bytes');
    }

    const completion = {
      sessionId,
      scope: mediaScope,
      uploadedBytes: expectedBytes,
      contentHash: body.contentHash.toLowerCase(),
      contentHashAlgorithm: 'sha256' as const,
      durationSeconds: body.durationSeconds,
      storageLocator: runtime.storageLocator,
      completedAt: occurredAt,
    };

    const completed = this.deps.mediaIntake.completeSession(session, completion);
    if (!completed.ok) {
      return uploadErr(completed.error.code, completed.error.message);
    }

    const assetRecord: WorkspaceAssetRecord = {
      assetId: runtime.assetId,
      projectId: scope.projectId,
      ownerId: scope.ownerId,
      referenceId: session.referenceId,
      storageLocator: runtime.storageLocator,
      assetKind: 'temporary',
      state: 'staging',
      mimeType: session.mimeType ?? 'application/octet-stream',
      byteSize: expectedBytes,
      contentHash: body.contentHash.toLowerCase(),
      jobId: session.jobId,
      expiresAt: new Date(
        Date.parse(occurredAt) + DEFAULT_EXPIRATION_POLICY.tempAssetTtlHours * 3_600_000,
      ).toISOString(),
      createdAt: occurredAt,
    };

    const inserted = await this.deps.assetRepository.insert(scope, assetRecord);
    if (!inserted.ok) {
      return uploadErr(inserted.code, inserted.message ?? 'Failed to persist asset');
    }

    await this.deps.sessionRepository.update(scope, completed.data);

    const stageResult = this.deps.orchestrator.completeStage(runtime.orchestrationContext, {
      stageId: 'media_intake',
      jobId: runtime.orchestrationContext.job.jobId,
      completedAt: occurredAt,
      outcome: 'success',
    });
    if (!stageResult.ok) {
      return uploadErr(stageResult.error.code, stageResult.error.message);
    }

    this.runtime.delete(sessionId);

    return uploadOk({
      sessionId,
      jobId: runtime.orchestrationContext.job.jobId,
      jobState: stageResult.data.context.job.state,
      jobProgressPercent: stageResult.data.context.job.progressPercent,
      assetId: runtime.assetId,
    });
  }

  async cancelUpload(
    scope: OwnerScope,
    sessionId: EntityId,
    occurredAt: IsoDateTime,
    reason?: string,
  ): Promise<UploadCoordinatorResult<CancelUploadResponseDto>> {
    const mediaScope: MediaOwnerScope = { ownerId: scope.ownerId, projectId: scope.projectId };
    const loaded = await this.deps.sessionRepository.findById(scope, sessionId);
    if (!loaded.ok) {
      return uploadErr('session_not_found', loaded.message ?? 'Session not found');
    }

    const runtime = this.runtime.get(sessionId);
    const session = loaded.data;

    const cancelled = this.deps.mediaIntake.cancelSession(session, {
      sessionId,
      scope: mediaScope,
      reason,
      cancelledAt: occurredAt,
    });
    if (!cancelled.ok) {
      return uploadErr(cancelled.error.code, cancelled.error.message);
    }

    if (runtime) {
      await this.deps.storage.deleteObject({ scope: mediaScope, locator: runtime.storageLocator });
      if (runtime.orchestrationContext) {
        this.deps.orchestrator.cancel({
          context: runtime.orchestrationContext,
          requestedAt: occurredAt,
          reason,
        });
      }
      this.runtime.delete(sessionId);
    }

    await this.deps.sessionRepository.update(scope, cancelled.data);

    return uploadOk({
      sessionId,
      jobId: session.jobId,
      state: cancelled.data.state,
    });
  }

  async resumeUpload(
    scope: OwnerScope,
    sessionId: EntityId,
    occurredAt: IsoDateTime,
  ): Promise<UploadCoordinatorResult<ResumeUploadResponseDto>> {
    const mediaScope: MediaOwnerScope = { ownerId: scope.ownerId, projectId: scope.projectId };
    const loaded = await this.deps.sessionRepository.findById(scope, sessionId);
    if (!loaded.ok) {
      return uploadErr('session_not_found', loaded.message ?? 'Session not found');
    }

    const runtime = this.runtime.get(sessionId);
    if (!runtime) {
      return uploadErr('session_not_found', 'Upload runtime not found');
    }

    const storageBytes = this.deps.storage.getUploadedByteCount(runtime.storageLocator);
    const reconciledBytes = Math.max(storageBytes, loaded.data.uploadedBytes);
    const chunkSizeBytes = loaded.data.chunkSizeBytes ?? resolveChunkSizeBytes();
    const nextChunkIndex = runtime.completedChunkIndices.size > 0
      ? Math.max(...runtime.completedChunkIndices) + 1
      : Math.floor(reconciledBytes / chunkSizeBytes);

    const resumed = this.deps.mediaIntake.resumeSession(loaded.data, {
      sessionId,
      scope: mediaScope,
      uploadedBytes: reconciledBytes,
      nextChunkIndex,
      requestedAt: occurredAt,
    });
    if (!resumed.ok) {
      return uploadErr(resumed.error.code, resumed.error.message);
    }

    await this.deps.sessionRepository.update(scope, resumed.data);

    if (runtime.orchestrationContext) {
      this.deps.orchestrator.planResume({
        context: runtime.orchestrationContext,
        checkpointStageId: 'media_intake',
        requestedAt: occurredAt,
      });
    }

    return uploadOk({
      sessionId,
      uploadedBytes: reconciledBytes,
      nextChunkIndex,
      uploadTarget: {
        method: runtime.uploadMethod,
        expiresAt: runtime.uploadTargetExpiresAt,
        providerPayload: runtime.providerPayload,
      },
    });
  }

  async getStatus(scope: OwnerScope, sessionId: EntityId): Promise<UploadCoordinatorResult<UploadStatusResponseDto>> {
    const loaded = await this.deps.sessionRepository.findById(scope, sessionId);
    if (!loaded.ok) {
      return uploadErr('session_not_found', loaded.message ?? 'Session not found');
    }

    const runtime = this.runtime.get(sessionId);
    const session = loaded.data;
    const expectedBytes = session.expectedBytes ?? 0;
    const storageBytes = runtime ? this.deps.storage.getUploadedByteCount(runtime.storageLocator) : session.uploadedBytes;
    const uploadedBytes = Math.max(storageBytes, session.uploadedBytes);
    const progressPercent = expectedBytes > 0 ? Math.floor((uploadedBytes / expectedBytes) * 100) : 0;

    return uploadOk({
      sessionId,
      jobId: session.jobId,
      state: session.state,
      uploadedBytes,
      expectedBytes,
      progressPercent,
      jobProgressPercent: runtime?.orchestrationContext
        ? mapUploadBytesToJobProgress(uploadedBytes, expectedBytes)
        : undefined,
      expiresAt: session.expiresAt,
      uploadMethod: runtime?.uploadMethod ?? resolveUploadMethod(expectedBytes),
    });
  }

  private buildChunkResponse(
    session: { sessionId: EntityId; expectedBytes?: number; uploadedBytes: number },
    runtime: SessionRuntime,
    chunkIndex: number,
    expectedBytes: number,
  ): UploadChunkResponseDto {
    const uploadedBytes = session.uploadedBytes;
    return {
      sessionId: session.sessionId,
      chunkIndex,
      uploadedBytes,
      expectedBytes,
      progressPercent: expectedBytes > 0 ? Math.floor((uploadedBytes / expectedBytes) * 100) : 0,
      jobProgressPercent: mapUploadBytesToJobProgress(uploadedBytes, expectedBytes),
      complete: uploadedBytes >= expectedBytes,
    };
  }

  private rollbackOrchestration(context: OrchestrationContext, occurredAt: IsoDateTime, reason: string): void {
    this.deps.orchestrator.cancel({ context, requestedAt: occurredAt, reason });
  }

  private async advanceToMediaIntakeStage(
    context: OrchestrationContext,
    occurredAt: IsoDateTime,
  ): Promise<OrchestrationContext | null> {
    let current = context;
    for (const stageId of ['validation', 'ownership'] as const) {
      const step = this.deps.orchestrator.completeStage(current, {
        stageId,
        jobId: current.job.jobId,
        completedAt: occurredAt,
        outcome: 'success',
      });
      if (!step.ok) {
        return null;
      }
      current = step.data.context;
    }
    return current;
  }

  private async syncJobToUploading(runtime: SessionRuntime, occurredAt: IsoDateTime): Promise<void> {
    if (!runtime.orchestrationContext) {
      return;
    }

    const result = this.deps.orchestrator.applyJobTransitions(runtime.orchestrationContext, [
      { nextState: 'preparing', progressPercent: 10, occurredAt },
      { nextState: 'uploading', progressPercent: 15, occurredAt },
    ]);

    if (result.ok) {
      runtime.orchestrationContext = result.data.context;
    }
  }

  private async updateJobUploadProgress(
    runtime: SessionRuntime,
    uploadedBytes: number,
    expectedBytes: number,
    occurredAt: IsoDateTime,
  ): Promise<void> {
    if (!runtime.orchestrationContext) {
      return;
    }

    const progress = mapUploadBytesToJobProgress(uploadedBytes, expectedBytes);
    const job = runtime.orchestrationContext.job;
    if (job.progressPercent === progress) {
      return;
    }

    const result = this.deps.orchestrator.refineJobProgress(runtime.orchestrationContext, {
      progressPercent: progress,
      occurredAt,
    });

    if (result.ok) {
      runtime.orchestrationContext = result.data.context;
    }
  }
}

export function createUploadCoordinator(deps: UploadCoordinatorDeps): UploadCoordinator {
  return new UploadCoordinator(deps);
}

export { computeChunkByteSize };
