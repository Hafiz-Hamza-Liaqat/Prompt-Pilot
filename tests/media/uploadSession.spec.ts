import { describe, expect, it } from 'vitest';
import {
  UploadSessionSchema,
  canResumeUploadSession,
  isUploadSessionTerminal,
} from '../../src/domain/media/upload-session.js';

const TIMESTAMP = '2026-07-05T12:00:00.000Z';

describe('UploadSession model', () => {
  it('parses a valid upload session', () => {
    const result = UploadSessionSchema.safeParse({
      sessionId: 'session-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceId: 'reference-001',
      referenceKind: 'video_upload',
      state: 'initiated',
      uploadedBytes: 0,
      expiresAt: '2026-07-06T12:00:00.000Z',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    });
    expect(result.success).toBe(true);
  });

  it('identifies terminal session states', () => {
    expect(isUploadSessionTerminal('completed')).toBe(true);
    expect(isUploadSessionTerminal('uploading')).toBe(false);
  });

  it('allows resume from uploading or paused', () => {
    expect(
      canResumeUploadSession({
        sessionId: 'session-001',
        projectId: 'project-001',
        ownerId: 'owner-001',
        referenceId: 'reference-001',
        referenceKind: 'video_upload',
        state: 'paused',
        uploadedBytes: 100,
        expiresAt: '2026-07-06T12:00:00.000Z',
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      }),
    ).toBe(true);
  });
});
