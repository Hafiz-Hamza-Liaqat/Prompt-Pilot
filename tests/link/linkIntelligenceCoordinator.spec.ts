import { describe, expect, it } from 'vitest';
import type { LinkMetadata } from '../../src/domain/link/index.js';
import type { LinkMetadataCache, LinkMetadataCacheKey } from '../../src/server/link/link-metadata-cache.js';
import { createLinkIntelligenceCoordinator } from '../../src/server/link/link-intelligence-coordinator.js';
import { createLinkProviderRegistry } from '../../src/server/link/link-provider-registry.js';
import { createMockLinkProvider } from '../../src/server/link/mock-link-provider.js';
import type { EntityId } from '../../src/domain/canonical/primitives.js';

const TIMESTAMP = '2026-07-06T15:00:00.000Z';
const OWNER = 'owner-001' as EntityId;
const PROJECT = 'project-001' as EntityId;
const REFERENCE = 'reference-001' as EntityId;
const JOB = 'job-001' as EntityId;

const publicDns = async () => ['93.184.216.34'];

class InMemoryLinkMetadataCache implements LinkMetadataCache {
  private readonly store = new Map<string, LinkMetadata>();

  async get(key: LinkMetadataCacheKey): Promise<LinkMetadata | null> {
    return this.store.get(JSON.stringify(key)) ?? null;
  }

  async set(key: LinkMetadataCacheKey, metadata: LinkMetadata): Promise<void> {
    this.store.set(JSON.stringify(key), metadata);
  }

  async delete(key: LinkMetadataCacheKey): Promise<void> {
    this.store.delete(JSON.stringify(key));
  }
}

describe('LinkIntelligenceCoordinator', () => {
  it('extracts canonical LinkMetadata without exposing provider payloads', async () => {
    const coordinator = createLinkIntelligenceCoordinator({
      registry: createLinkProviderRegistry([createMockLinkProvider()]),
      hostResolver: publicDns,
    });

    const result = await coordinator.analyzeLink({
      jobId: JOB,
      referenceId: REFERENCE,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceKind: 'youtube_url',
      rawUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      occurredAt: TIMESTAMP,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.linkMetadata.platformContentId).toBe('dQw4w9WgXcQ');
      expect(result.data.linkMetadata.title).toBeTruthy();
      expect(result.data.linkMetadata).not.toHaveProperty('providerPayload');
      expect(JSON.stringify(result.data)).not.toMatch(/providerPayload/);
    }
  });

  it('rejects invalid URLs before provider fetch', async () => {
    const mock = createMockLinkProvider();
    const coordinator = createLinkIntelligenceCoordinator({
      registry: createLinkProviderRegistry([mock]),
      hostResolver: publicDns,
    });

    const result = await coordinator.analyzeLink({
      jobId: JOB,
      referenceId: REFERENCE,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceKind: 'youtube_url',
      rawUrl: 'ftp://invalid.example/video',
      occurredAt: TIMESTAMP,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects upload reference kinds', async () => {
    const coordinator = createLinkIntelligenceCoordinator({
      registry: createLinkProviderRegistry([createMockLinkProvider()]),
      hostResolver: publicDns,
    });

    const result = await coordinator.analyzeLink({
      jobId: JOB,
      referenceId: REFERENCE,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceKind: 'video_upload',
      rawUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      occurredAt: TIMESTAMP,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('unsupported_platform');
    }
  });

  it('uses LinkMetadataCache when provided', async () => {
    const cache = new InMemoryLinkMetadataCache();
    const coordinator = createLinkIntelligenceCoordinator({
      registry: createLinkProviderRegistry([createMockLinkProvider()]),
      cache,
      hostResolver: publicDns,
    });

    const first = await coordinator.analyzeLink({
      jobId: JOB,
      referenceId: REFERENCE,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceKind: 'youtube_url',
      rawUrl: 'https://youtu.be/dQw4w9WgXcQ',
      occurredAt: TIMESTAMP,
    });
    expect(first.ok).toBe(true);

    const second = await coordinator.analyzeLink({
      jobId: JOB,
      referenceId: 'reference-002' as EntityId,
      projectId: PROJECT,
      ownerId: OWNER,
      referenceKind: 'youtube_url',
      rawUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      occurredAt: TIMESTAMP,
    });

    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.cacheHit).toBe(true);
    }
  });
});
