import { describe, expect, it } from 'vitest';
import { asStorageLocator } from '../../src/domain/media/constants.js';
import {
  cancelUploadSession,
  completeUploadSession,
  registerUploadSession,
  resumeUploadSession,
  startUploadSession,
} from '../../src/domain/media/upload-intake-engine.js';

const TIMESTAMP = '2026-07-05T12:00:00.000Z';
const SCOPE = { ownerId: 'owner-001', projectId: 'project-001' };

describe('upload contracts', () => {
  it('registers and starts an upload session', () => {
    const registered = registerUploadSession({
      request: {
        ...SCOPE,
        referenceId: 'reference-001',
        sessionId: 'session-001',
        referenceKind: 'video_upload',
        expectedBytes: 1_048_576,
        mimeType: 'video/mp4',
        requestedAt: TIMESTAMP,
      },
      expiresAt: '2026-07-06T12:00:00.000Z',
    });
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;

    const started = startUploadSession(registered.data, SCOPE, TIMESTAMP);
    expect(started.ok).toBe(true);
    if (started.ok) {
      expect(started.data.state).toBe('uploading');
    }
  });

  it('completes upload with storage locator binding', () => {
    const session = {
      sessionId: 'session-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceId: 'reference-001',
      referenceKind: 'video_upload' as const,
      state: 'uploading' as const,
      uploadedBytes: 1_048_576,
      expectedBytes: 1_048_576,
      expiresAt: '2026-07-06T12:00:00.000Z',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };

    const result = completeUploadSession(session, {
      sessionId: 'session-001',
      scope: SCOPE,
      uploadedBytes: 1_048_576,
      contentHash: 'a'.repeat(64),
      contentHashAlgorithm: 'sha256',
      storageLocator: asStorageLocator('internal/locators/session-001'),
      completedAt: TIMESTAMP,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.state).toBe('completed');
      expect(result.data.storageLocator).toBe('internal/locators/session-001');
    }
  });

  it('cancels active sessions', () => {
    const session = {
      sessionId: 'session-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceId: 'reference-001',
      referenceKind: 'video_upload' as const,
      state: 'uploading' as const,
      uploadedBytes: 100,
      expiresAt: '2026-07-06T12:00:00.000Z',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };

    const result = cancelUploadSession(session, {
      sessionId: 'session-001',
      scope: SCOPE,
      cancelledAt: TIMESTAMP,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.state).toBe('cancelled');
    }
  });

  it('resumes paused sessions from byte offset', () => {
    const session = {
      sessionId: 'session-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceId: 'reference-001',
      referenceKind: 'video_upload' as const,
      state: 'paused' as const,
      uploadedBytes: 512,
      expectedBytes: 2048,
      expiresAt: '2026-07-06T12:00:00.000Z',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };

    const result = resumeUploadSession(session, {
      sessionId: 'session-001',
      scope: SCOPE,
      uploadedBytes: 512,
      nextChunkIndex: 1,
      requestedAt: TIMESTAMP,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.state).toBe('uploading');
    }
  });

  it('rejects cross-owner session operations', () => {
    const session = {
      sessionId: 'session-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceId: 'reference-001',
      referenceKind: 'video_upload' as const,
      state: 'initiated' as const,
      uploadedBytes: 0,
      expiresAt: '2026-07-06T12:00:00.000Z',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };

    const result = startUploadSession(session, { ownerId: 'other', projectId: 'project-001' }, TIMESTAMP);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ownership_violation');
    }
  });
});
