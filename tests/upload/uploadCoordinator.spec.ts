import { createHash } from 'node:crypto';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createDefaultJobLifecycleService } from '../../src/server/job/index.js';
import { createPureMediaIntakeService } from '../../src/server/media/index.js';
import { createDefaultJobOrchestrator } from '../../src/server/orchestration/index.js';
import type { JobOrchestrator } from '../../src/server/orchestration/index.js';
import { InMemoryUploadSessionRepository } from '../../src/server/upload/in-memory-upload-session-repository.js';
import { InMemoryWorkspaceAssetRepository } from '../../src/server/upload/in-memory-workspace-asset-repository.js';
import { createMemoryStorageProvider } from '../../src/server/upload/memory-storage-provider.js';
import { sanitizeProviderPayloadForClient } from '../../src/server/upload/provider-payload.js';
import { createUploadCoordinator } from '../../src/server/upload/upload-coordinator.js';
import { computeChunkByteSize } from '../../src/server/upload/chunk-utils.js';
import type { UploadStoragePort } from '../../src/server/upload/upload-storage-port.js';
import type { EntityId } from '../../src/domain/canonical/primitives.js';

const TIMESTAMP = '2026-07-06T14:00:00.000Z';
const PROJECT = 'project-001' as EntityId;
const OWNER = 'owner-001' as EntityId;
const REFERENCE = 'reference-001' as EntityId;

function buildCoordinator(overrides?: { orchestrator?: JobOrchestrator; storage?: UploadStoragePort }) {
  const lifecycle = createDefaultJobLifecycleService();
  const mediaIntake = createPureMediaIntakeService();
  const orchestrator = overrides?.orchestrator ?? createDefaultJobOrchestrator({ lifecycle, mediaIntake });
  return {
    coordinator: createUploadCoordinator({
      mediaIntake,
      storage: overrides?.storage ?? createMemoryStorageProvider(),
      sessionRepository: new InMemoryUploadSessionRepository(),
      assetRepository: new InMemoryWorkspaceAssetRepository(),
      orchestrator,
    }),
    orchestrator,
  };
}

describe('PP-07B.1 upload hardening', () => {
  describe('sanitizeProviderPayloadForClient', () => {
    it('strips object keys and URI-like values from provider payloads', () => {
      const sanitized = sanitizeProviderPayloadForClient({
        uploadId: 'opaque-token',
        method: 'multipart',
        objectKey: 'project-001/asset-001',
        bucket: 'private-bucket',
        locator: 'memory://memory/project/asset',
      });

      expect(sanitized).toEqual({
        uploadId: 'opaque-token',
        method: 'multipart',
      });
      expect(sanitized).not.toHaveProperty('objectKey');
      expect(sanitized).not.toHaveProperty('bucket');
    });
  });

  describe('validation before orchestration', () => {
    it('rejects invalid metadata before starting a job', async () => {
      const { coordinator, orchestrator } = buildCoordinator();
      const startSpy = vi.spyOn(orchestrator, 'start');

      const result = await coordinator.initiateUpload({
        projectId: PROJECT,
        ownerId: OWNER,
        referenceId: REFERENCE,
        referenceKind: 'video_upload',
        expectedBytes: 0,
        mimeType: 'video/mp4',
        occurredAt: TIMESTAMP,
      });

      expect(result.ok).toBe(false);
      expect(startSpy).not.toHaveBeenCalled();
    });
  });

  describe('interface-only coordinator dependency', () => {
    it('accepts a custom UploadStoragePort without MemoryStorageProvider', async () => {
      const memory = createMemoryStorageProvider();
      const storage: UploadStoragePort = {
        providerId: 'test-port',
        prepareUpload: (...args) => memory.prepareUpload(...args),
        confirmUpload: (...args) => memory.confirmUpload(...args),
        headObject: (...args) => memory.headObject(...args),
        deleteObject: (...args) => memory.deleteObject(...args),
        listExpiredObjects: (...args) => memory.listExpiredObjects(...args),
        writePart: (...args) => memory.writePart(...args),
        getUploadedByteCount: (locator) => memory.getUploadedByteCount(locator),
        listCompletedPartIndices: (locator) => memory.listCompletedPartIndices(locator),
        verifyContentHash: (locator, hash) => memory.verifyContentHash(locator, hash),
      };

      const { coordinator } = buildCoordinator({ storage });
      const result = await coordinator.initiateUpload({
        projectId: PROJECT,
        ownerId: OWNER,
        referenceId: REFERENCE,
        referenceKind: 'video_upload',
        expectedBytes: 512,
        mimeType: 'video/mp4',
        occurredAt: TIMESTAMP,
      });

      expect(result.ok).toBe(true);
      expect(storage.providerId).toBe('test-port');
    });
  });

  describe('providerPayload sanitization', () => {
    it('never exposes objectKey in initiate response', async () => {
      const { coordinator } = buildCoordinator();
      const result = await coordinator.initiateUpload({
        projectId: PROJECT,
        ownerId: OWNER,
        referenceId: REFERENCE,
        referenceKind: 'video_upload',
        expectedBytes: 1024,
        mimeType: 'video/mp4',
        occurredAt: TIMESTAMP,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.uploadTarget.providerPayload).not.toHaveProperty('objectKey');
        expect(result.data.uploadTarget.providerPayload).not.toHaveProperty('bucket');
        expect(JSON.stringify(result.data)).not.toMatch(/memory:\/\//);
      }
    });
  });

  describe('upload lifecycle ownership', () => {
    it('routes job state changes through JobOrchestrator during chunk upload', async () => {
      const { coordinator, orchestrator } = buildCoordinator();
      const applySpy = vi.spyOn(orchestrator, 'applyJobTransitions');

      const initiated = await coordinator.initiateUpload({
        projectId: PROJECT,
        ownerId: OWNER,
        referenceId: REFERENCE,
        referenceKind: 'video_upload',
        expectedBytes: 1024,
        mimeType: 'video/mp4',
        occurredAt: TIMESTAMP,
      });
      expect(initiated.ok).toBe(true);
      if (!initiated.ok) {
        return;
      }

      await coordinator.uploadChunk(
        { projectId: PROJECT, ownerId: OWNER },
        initiated.data.sessionId,
        0,
        Buffer.alloc(1024, 0xab),
        TIMESTAMP,
      );

      expect(applySpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([
          expect.objectContaining({ nextState: 'preparing' }),
          expect.objectContaining({ nextState: 'uploading' }),
        ]),
      );
    });

    it('rolls back orchestration when storage prepare fails', async () => {
      const memory = createMemoryStorageProvider();
      const storage: UploadStoragePort = {
        providerId: memory.providerId,
        prepareUpload: async () => ({ ok: false as const, code: 'storage_error' as const, message: 'Unavailable' }),
        confirmUpload: (...args) => memory.confirmUpload(...args),
        headObject: (...args) => memory.headObject(...args),
        deleteObject: (...args) => memory.deleteObject(...args),
        listExpiredObjects: (...args) => memory.listExpiredObjects(...args),
        writePart: (...args) => memory.writePart(...args),
        getUploadedByteCount: (locator) => memory.getUploadedByteCount(locator),
        listCompletedPartIndices: (locator) => memory.listCompletedPartIndices(locator),
        verifyContentHash: (locator, hash) => memory.verifyContentHash(locator, hash),
      };
      const { coordinator, orchestrator } = buildCoordinator({ storage });
      const cancelSpy = vi.spyOn(orchestrator, 'cancel');

      const result = await coordinator.initiateUpload({
        projectId: PROJECT,
        ownerId: OWNER,
        referenceId: REFERENCE,
        referenceKind: 'video_upload',
        expectedBytes: 1024,
        mimeType: 'video/mp4',
        occurredAt: TIMESTAMP,
      });

      expect(result.ok).toBe(false);
      expect(cancelSpy).toHaveBeenCalled();
    });
  });
});

describe('UploadCoordinator', () => {
  let coordinator: ReturnType<typeof buildCoordinator>['coordinator'];

  beforeEach(() => {
    coordinator = buildCoordinator().coordinator;
  });

  it('initiates upload session and binds orchestrator without exposing storage locator', async () => {
    const result = await coordinator.initiateUpload({
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      expectedBytes: 1024,
      mimeType: 'video/mp4',
      occurredAt: TIMESTAMP,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sessionId).toBeTruthy();
      expect(result.data.jobId).toBeTruthy();
      expect(result.data.uploadMethod).toBe('single_put');
      expect(result.data.uploadTarget.providerPayload).not.toHaveProperty('storageLocator');
      expect(JSON.stringify(result.data)).not.toMatch(/memory:\/\//);
    }
  });

  it('completes single-chunk upload and advances orchestrator past media_intake', async () => {
    const initiated = await coordinator.initiateUpload({
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      expectedBytes: 1024,
      mimeType: 'video/mp4',
      occurredAt: TIMESTAMP,
    });
    expect(initiated.ok).toBe(true);
    if (!initiated.ok) {
      return;
    }

    const payload = Buffer.alloc(1024, 0xab);
    const chunk = await coordinator.uploadChunk(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      0,
      payload,
      TIMESTAMP,
    );
    expect(chunk.ok).toBe(true);
    if (chunk.ok) {
      expect(chunk.data.complete).toBe(true);
      expect(chunk.data.jobProgressPercent).toBeGreaterThanOrEqual(10);
    }

    const hash = createHash('sha256').update(payload).digest('hex');
    const completed = await coordinator.completeUpload(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      { contentHash: hash },
      TIMESTAMP,
    );

    expect(completed.ok).toBe(true);
    if (completed.ok) {
      expect(completed.data.jobState).toBe('fingerprinting');
      expect(completed.data.assetId).toBeTruthy();
    }
  });

  it('supports multipart upload across multiple chunks', async () => {
    const expectedBytes = 9 * 1024 * 1024;
    const initiated = await coordinator.initiateUpload({
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'audio_upload',
      expectedBytes,
      mimeType: 'audio/mpeg',
      occurredAt: TIMESTAMP,
    });
    expect(initiated.ok).toBe(true);
    if (!initiated.ok) {
      return;
    }
    expect(initiated.data.uploadMethod).toBe('multipart');

    const chunkSize = initiated.data.chunkSizeBytes;
    const chunk0Size = computeChunkByteSize(0, chunkSize, expectedBytes);
    const chunk1Size = computeChunkByteSize(1, chunkSize, expectedBytes);

    await coordinator.uploadChunk(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      0,
      Buffer.alloc(chunk0Size, 1),
      TIMESTAMP,
    );
    await coordinator.uploadChunk(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      1,
      Buffer.alloc(chunk1Size, 2),
      TIMESTAMP,
    );

    const full = Buffer.concat([Buffer.alloc(chunk0Size, 1), Buffer.alloc(chunk1Size, 2)]);
    const hash = createHash('sha256').update(full).digest('hex');

    const completed = await coordinator.completeUpload(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      { contentHash: hash },
      TIMESTAMP,
    );
    expect(completed.ok).toBe(true);
  });

  it('cancels upload and invokes media intake cancel without leaving active session', async () => {
    const initiated = await coordinator.initiateUpload({
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      expectedBytes: 2048,
      mimeType: 'video/mp4',
      occurredAt: TIMESTAMP,
    });
    expect(initiated.ok).toBe(true);
    if (!initiated.ok) {
      return;
    }

    const cancelled = await coordinator.cancelUpload(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      TIMESTAMP,
      'User aborted',
    );
    expect(cancelled.ok).toBe(true);
    if (cancelled.ok) {
      expect(cancelled.data.state).toBe('cancelled');
    }

    const status = await coordinator.getStatus({ projectId: PROJECT, ownerId: OWNER }, initiated.data.sessionId);
    expect(status.ok).toBe(true);
    if (status.ok) {
      expect(status.data.state).toBe('cancelled');
    }
  });

  it('resumes upload using storage truth for next chunk index', async () => {
    const expectedBytes = 2048;
    const initiated = await coordinator.initiateUpload({
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      expectedBytes,
      mimeType: 'video/mp4',
      occurredAt: TIMESTAMP,
    });
    expect(initiated.ok).toBe(true);
    if (!initiated.ok) {
      return;
    }

    await coordinator.uploadChunk(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      0,
      Buffer.alloc(expectedBytes, 0xcd),
      TIMESTAMP,
    );

    const resumed = await coordinator.resumeUpload(
      { projectId: PROJECT, ownerId: OWNER },
      initiated.data.sessionId,
      TIMESTAMP,
    );
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      expect(resumed.data.uploadedBytes).toBe(expectedBytes);
      expect(resumed.data.nextChunkIndex).toBeGreaterThanOrEqual(1);
    }
  });

  it('rejects chunk upload for wrong owner scope', async () => {
    const initiated = await coordinator.initiateUpload({
      projectId: PROJECT,
      ownerId: OWNER,
      referenceId: REFERENCE,
      referenceKind: 'video_upload',
      expectedBytes: 512,
      mimeType: 'video/mp4',
      occurredAt: TIMESTAMP,
    });
    expect(initiated.ok).toBe(true);
    if (!initiated.ok) {
      return;
    }

    const chunk = await coordinator.uploadChunk(
      { projectId: PROJECT, ownerId: 'other-owner' as EntityId },
      initiated.data.sessionId,
      0,
      Buffer.alloc(512),
      TIMESTAMP,
    );
    expect(chunk.ok).toBe(false);
    if (!chunk.ok) {
      expect(chunk.code).toBe('session_not_found');
    }
  });
});
