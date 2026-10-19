import { describe, expect, it, expectTypeOf } from 'vitest';
import { asStorageLocator } from '../../src/domain/media/constants.js';
import type {
  AssetReference,
  StorageProvider,
  TemporaryAsset,
} from '../../src/domain/media/storage/index.js';

describe('storage abstraction contracts', () => {
  it('brands storage locators as opaque internal values', () => {
    const locator = asStorageLocator('bucket/project/reference/object');
    expect(typeof locator).toBe('string');
  });

  it('models temporary assets with expiration', () => {
    const asset: TemporaryAsset = {
      assetId: 'asset-001',
      referenceId: 'reference-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      classification: 'temporary',
      mimeType: 'video/mp4',
      byteSize: 1024,
      storageLocator: asStorageLocator('internal/locators/asset-001'),
      state: 'active',
      expiresAt: '2026-07-06T12:00:00.000Z',
    };
    expect(asset.classification).toBe('temporary');
  });

  it('types StorageProvider without cloud SDK dependencies', () => {
    expectTypeOf<StorageProvider>().toHaveProperty('providerId');
    expectTypeOf<StorageProvider>().toHaveProperty('prepareUpload');
    expectTypeOf<StorageProvider>().toHaveProperty('deleteObject');
  });

  it('keeps AssetReference fields provider-neutral', () => {
    expectTypeOf<AssetReference>().toHaveProperty('storageLocator');
    expectTypeOf<AssetReference>().not.toMatchTypeOf<{ signedUrl: string }>();
  });
});
