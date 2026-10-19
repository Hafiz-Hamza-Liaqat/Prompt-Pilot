import { describe, expect, it } from 'vitest';
import {
  validateAssetReferenceOwnership,
  validateOwnership,
  validateUploadSessionOwnership,
} from '../../src/domain/media/ownership.js';
import { asStorageLocator } from '../../src/domain/media/constants.js';
import { createPureMediaIntakeService } from '../../src/server/media/pure-media-intake-service.js';

const SCOPE = { ownerId: 'owner-001', projectId: 'project-001' };

describe('media ownership validation', () => {
  it('accepts matching owner and project scope', () => {
    expect(
      validateOwnership({ scope: SCOPE, subject: SCOPE }).ok,
    ).toBe(true);
  });

  it('rejects foreign owner scope', () => {
    const result = validateOwnership({
      scope: SCOPE,
      subject: { ownerId: 'other', projectId: 'project-001' },
    });
    expect(result.ok).toBe(false);
  });

  it('validates upload session ownership', () => {
    const result = validateUploadSessionOwnership(SCOPE, {
      sessionId: 'session-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceId: 'reference-001',
      referenceKind: 'video_upload',
      state: 'initiated',
      uploadedBytes: 0,
      expiresAt: '2026-07-06T12:00:00.000Z',
      createdAt: '2026-07-05T12:00:00.000Z',
      updatedAt: '2026-07-05T12:00:00.000Z',
    });
    expect(result.ok).toBe(true);
  });

  it('validates temporary asset ownership', () => {
    const result = validateAssetReferenceOwnership(SCOPE, {
      assetId: 'asset-001',
      referenceId: 'reference-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      classification: 'temporary',
      mimeType: 'video/mp4',
      byteSize: 1024,
      storageLocator: asStorageLocator('internal/locators/asset-001'),
    });
    expect(result.ok).toBe(true);
  });

  it('plans upload requests through default intake service', () => {
    const service = createPureMediaIntakeService();
    const plan = service.planUploadRequest({
      ...SCOPE,
      referenceId: 'reference-001',
      sessionId: 'session-001',
      referenceKind: 'video_upload',
      expectedBytes: 2048,
      mimeType: 'video/mp4',
      requestedAt: '2026-07-05T12:00:00.000Z',
    });
    expect(plan.ok).toBe(true);
  });
});
