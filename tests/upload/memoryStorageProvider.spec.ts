import { describe, expect, it } from 'vitest';
import { createMemoryStorageProvider } from '../../src/server/upload/memory-storage-provider.js';
import type { EntityId } from '../../src/domain/canonical/primitives.js';

const SCOPE = { ownerId: 'owner-001' as EntityId, projectId: 'project-001' as EntityId };

describe('MemoryStorageProvider', () => {
  it('prepares multipart upload and assembles parts on confirm', async () => {
    const storage = createMemoryStorageProvider();
    const assetId = 'asset-001' as EntityId;

    const prepared = await storage.prepareUpload({
      scope: SCOPE,
      assetId,
      mimeType: 'video/mp4',
      byteSize: 200,
      classification: 'temporary',
    });
    expect(prepared.ok).toBe(true);
    if (!prepared.ok) {
      return;
    }

    expect(prepared.uploadTarget.method).toBe('single_put');

    await storage.writePart({
      locator: prepared.descriptor.locator,
      chunkIndex: 0,
      data: Buffer.alloc(200, 7),
      expectedChunkSize: 200,
    });

    const confirmed = await storage.confirmUpload({ scope: SCOPE, locator: prepared.descriptor.locator });
    expect(confirmed.ok).toBe(true);
    if (confirmed.ok) {
      expect(confirmed.descriptor.byteSize).toBe(200);
      expect(confirmed.descriptor.contentHash).toHaveLength(64);
    }
  });

  it('tracks uploaded byte count for resume reconciliation', async () => {
    const storage = createMemoryStorageProvider();
    const prepared = await storage.prepareUpload({
      scope: SCOPE,
      assetId: 'asset-002' as EntityId,
      mimeType: 'audio/mpeg',
      byteSize: 300,
      classification: 'temporary',
    });
    if (!prepared.ok) {
      return;
    }

    await storage.writePart({
      locator: prepared.descriptor.locator,
      chunkIndex: 0,
      data: Buffer.alloc(150, 1),
      expectedChunkSize: 150,
    });

    expect(storage.getUploadedByteCount(prepared.descriptor.locator)).toBe(150);
    expect(storage.listCompletedPartIndices(prepared.descriptor.locator)).toEqual([0]);
  });
});
