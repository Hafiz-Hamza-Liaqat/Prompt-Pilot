import type {
  ObjectDeleteRequest,
  ObjectDeleteResult,
  ObjectHeadRequest,
  ObjectHeadResult,
  ObjectPutRequest,
  ObjectPutResult,
  StorageLocator,
  StorageProvider,
} from '@/domain/media';
import type { IsoDateTime } from '@/domain/common';

export type WritePartRequest = {
  locator: StorageLocator;
  chunkIndex: number;
  data: Buffer;
  expectedChunkSize: number;
};

export type WritePartResult =
  | { ok: true; uploadedBytes: number }
  | { ok: false; code: 'not_found' | 'storage_error'; message?: string };

/**
 * Relay-mode upload storage port — extends PP-07 {@link StorageProvider} with
 * chunked write and resume introspection. UploadCoordinator depends on this
 * interface only; concrete adapters (memory, Supabase, R2) implement it.
 */
export type UploadStoragePort = StorageProvider & {
  writePart(request: WritePartRequest): Promise<WritePartResult>;

  getUploadedByteCount(locator: StorageLocator): number;

  listCompletedPartIndices(locator: StorageLocator): readonly number[];

  verifyContentHash(locator: StorageLocator, expectedHash: string): boolean;
};

export type { ObjectPutRequest, ObjectPutResult, ObjectHeadRequest, ObjectHeadResult, ObjectDeleteRequest, ObjectDeleteResult, IsoDateTime };
