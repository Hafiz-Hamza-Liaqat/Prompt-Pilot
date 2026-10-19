import { createHash, randomUUID } from 'node:crypto';
import {
  asStorageLocator,
  type ObjectDeleteRequest,
  type ObjectHeadRequest,
  type ObjectHeadResult,
  type ObjectPutRequest,
  type ObjectPutResult,
  type StorageLocator,
} from '@/domain/media';
import type { IsoDateTime } from '@/domain/common';
import { UPLOAD_ENGINE_CONFIG, resolveUploadMethod } from './config.js';
import type { UploadStoragePort, WritePartRequest, WritePartResult } from './upload-storage-port.js';

export type { WritePartRequest, WritePartResult } from './upload-storage-port.js';

type StoredObject = {
  locator: StorageLocator;
  bucket: string;
  objectKey: string;
  mimeType: string;
  byteSize: number;
  parts: Map<number, Buffer>;
  assembled?: Buffer;
  contentHash?: string;
};

/** In-memory storage provider with multipart part tracking — PP-07B dev/test adapter. */
export class MemoryStorageProvider implements UploadStoragePort {
  readonly providerId = 'memory';

  private readonly objects = new Map<string, StoredObject>();

  async prepareUpload(request: ObjectPutRequest): Promise<ObjectPutResult> {
    const objectKey = `${request.scope.projectId}/${request.assetId}`;
    const locator = asStorageLocator(`memory://${this.providerId}/${objectKey}`);
    const method = resolveUploadMethod(request.byteSize);
    const expiresAt = new Date(Date.now() + UPLOAD_ENGINE_CONFIG.signedUrlTtlMinutes * 60_000).toISOString();

    this.objects.set(locator, {
      locator,
      bucket: 'memory-bucket',
      objectKey,
      mimeType: request.mimeType,
      byteSize: request.byteSize,
      parts: new Map(),
    });

    return {
      ok: true,
      descriptor: {
        locator,
        bucket: 'memory-bucket',
        objectKey,
        mimeType: request.mimeType,
        byteSize: request.byteSize,
        createdAt: new Date().toISOString(),
      },
      uploadTarget: {
        locator,
        method,
        expiresAt,
        providerPayload: {
          providerId: this.providerId,
          uploadId: randomUUID(),
          method,
        },
      },
    };
  }

  async writePart(request: WritePartRequest): Promise<WritePartResult> {
    const object = this.objects.get(request.locator);
    if (!object) {
      return { ok: false, code: 'not_found', message: 'Upload object not found' };
    }
    if (request.data.length !== request.expectedChunkSize) {
      return { ok: false, code: 'storage_error', message: 'Chunk byte length mismatch' };
    }

    object.parts.set(request.chunkIndex, Buffer.from(request.data));
    object.assembled = undefined;

    return { ok: true, uploadedBytes: this.getUploadedByteCount(request.locator) };
  }

  getUploadedByteCount(locator: StorageLocator): number {
    const object = this.objects.get(locator);
    if (!object) {
      return 0;
    }
    let total = 0;
    for (const part of object.parts.values()) {
      total += part.length;
    }
    return total;
  }

  listCompletedPartIndices(locator: StorageLocator): number[] {
    const object = this.objects.get(locator);
    if (!object) {
      return [];
    }
    return [...object.parts.keys()].sort((a, b) => a - b);
  }

  private assemble(object: StoredObject): Buffer {
    if (object.assembled) {
      return object.assembled;
    }
    const indices = [...object.parts.keys()].sort((a, b) => a - b);
    const chunks = indices.map((index) => object.parts.get(index) as Buffer);
    object.assembled = Buffer.concat(chunks);
    return object.assembled;
  }

  async confirmUpload(request: ObjectHeadRequest): Promise<ObjectHeadResult> {
    const object = this.objects.get(request.locator);
    if (!object) {
      return { ok: false, code: 'not_found' };
    }

    const assembled = this.assemble(object);
    if (assembled.length !== object.byteSize) {
      return { ok: false, code: 'storage_error', message: 'Assembled size mismatch' };
    }

    object.contentHash = createHash('sha256').update(assembled).digest('hex');

    return {
      ok: true,
      descriptor: {
        locator: object.locator,
        bucket: object.bucket,
        objectKey: object.objectKey,
        mimeType: object.mimeType,
        byteSize: assembled.length,
        contentHash: object.contentHash,
        contentHashAlgorithm: 'sha256',
        createdAt: new Date().toISOString(),
      },
    };
  }

  async headObject(request: ObjectHeadRequest): Promise<ObjectHeadResult> {
    const object = this.objects.get(request.locator);
    if (!object) {
      return { ok: false, code: 'not_found' };
    }

    const uploaded = this.getUploadedByteCount(request.locator);
    return {
      ok: true,
      descriptor: {
        locator: object.locator,
        bucket: object.bucket,
        objectKey: object.objectKey,
        mimeType: object.mimeType,
        byteSize: uploaded > 0 ? uploaded : object.byteSize,
        contentHash: object.contentHash,
        contentHashAlgorithm: object.contentHash ? 'sha256' : undefined,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async deleteObject(request: ObjectDeleteRequest) {
    if (!this.objects.has(request.locator)) {
      return { ok: false as const, code: 'not_found' as const };
    }
    this.objects.delete(request.locator);
    return { ok: true as const };
  }

  async listExpiredObjects(_before: IsoDateTime): Promise<readonly StorageLocator[]> {
    return [];
  }

  verifyContentHash(locator: StorageLocator, expectedHash: string): boolean {
    const object = this.objects.get(locator);
    if (!object) {
      return false;
    }
    this.assemble(object);
    return object.contentHash === expectedHash.toLowerCase();
  }
}

export function createMemoryStorageProvider(): MemoryStorageProvider {
  return new MemoryStorageProvider();
}
