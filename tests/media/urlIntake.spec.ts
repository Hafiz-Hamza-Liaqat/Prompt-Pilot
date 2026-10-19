import { describe, expect, it } from 'vitest';
import type { LinkMetadata } from '../../src/domain/link/index.js';
import { resolveUrlReferenceFromLinkMetadata } from '../../src/domain/media/url-intake.js';
import type { EntityId } from '../../src/domain/canonical/primitives.js';

const TIMESTAMP = '2026-07-06T15:00:00.000Z';
const OWNER = 'owner-001' as EntityId;
const PROJECT = 'project-001' as EntityId;
const REFERENCE = 'reference-001' as EntityId;

function sampleLinkMetadata(overrides: Partial<LinkMetadata> = {}): LinkMetadata {
  return {
    linkMetadataId: 'link-meta-001' as EntityId,
    referenceId: REFERENCE,
    projectId: PROJECT,
    ownerId: OWNER,
    referenceKind: 'youtube_url',
    platform: 'youtube',
    platformContentId: 'dQw4w9WgXcQ',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Sample video',
    mediaKind: 'video',
    accessStatus: 'public',
    providerId: 'mock',
    extractionMethod: 'mock',
    extractedAt: TIMESTAMP,
    linkMetadataVersion: '1.0.0',
    ...overrides,
  };
}

describe('resolveUrlReferenceFromLinkMetadata', () => {
  it('maps LinkMetadata to UrlMediaIntakeDescriptor', () => {
    const result = resolveUrlReferenceFromLinkMetadata(
      sampleLinkMetadata(),
      { ownerId: OWNER, projectId: PROJECT },
      'job-001',
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.linkMetadataId).toBe('link-meta-001');
      expect(result.data.platformContentId).toBe('dQw4w9WgXcQ');
      expect(result.data.mimeType).toBe('video/mp4');
      expect(result.data.jobId).toBe('job-001');
    }
  });

  it('rejects scope mismatch', () => {
    const result = resolveUrlReferenceFromLinkMetadata(
      sampleLinkMetadata(),
      { ownerId: 'other-owner' as EntityId, projectId: PROJECT },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ownership_violation');
    }
  });

  it('rejects non-URL reference kinds', () => {
    const result = resolveUrlReferenceFromLinkMetadata(
      sampleLinkMetadata({ referenceKind: 'video_upload' }),
      { ownerId: OWNER, projectId: PROJECT },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('unsupported_reference_kind');
    }
  });
});
