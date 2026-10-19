import { UPLOAD_ENGINE_CONFIG } from './config.js';

export type ChunkValidationResult =
  | { ok: true; chunkSize: number }
  | { ok: false; message: string };

export function validateChunkIndex(chunkIndex: number, expectedBytes: number, chunkSizeBytes: number): ChunkValidationResult {
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0) {
    return { ok: false, message: 'Chunk index must be a non-negative integer' };
  }

  const maxIndex = Math.ceil(expectedBytes / chunkSizeBytes) - 1;
  if (chunkIndex > maxIndex) {
    return { ok: false, message: `Chunk index ${chunkIndex} exceeds plan (max ${maxIndex})` };
  }

  if (chunkIndex >= UPLOAD_ENGINE_CONFIG.maxMultipartParts) {
    return { ok: false, message: 'Maximum multipart part count exceeded' };
  }

  const isLast = chunkIndex === maxIndex;
  const chunkSize = isLast ? expectedBytes - chunkIndex * chunkSizeBytes : chunkSizeBytes;
  if (chunkSize <= 0) {
    return { ok: false, message: 'Invalid chunk size for index' };
  }

  return { ok: true, chunkSize };
}

export function computeUploadedBytes(
  chunkIndex: number,
  chunkSizeBytes: number,
  expectedBytes: number,
): number {
  const maxIndex = Math.ceil(expectedBytes / chunkSizeBytes) - 1;
  if (chunkIndex >= maxIndex) {
    return expectedBytes;
  }
  return (chunkIndex + 1) * chunkSizeBytes;
}

export function computeChunkByteSize(
  chunkIndex: number,
  chunkSizeBytes: number,
  expectedBytes: number,
): number {
  const validated = validateChunkIndex(chunkIndex, expectedBytes, chunkSizeBytes);
  if (!validated.ok) {
    return 0;
  }
  return validated.chunkSize;
}
