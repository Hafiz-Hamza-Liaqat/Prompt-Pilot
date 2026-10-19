import { describe, expect, it } from 'vitest';
import { validateChunkIndex, computeUploadedBytes } from '../../src/server/upload/chunk-utils.js';
import { UPLOAD_ENGINE_CONFIG } from '../../src/server/upload/config.js';

describe('chunk utils', () => {
  it('validates chunk indices within plan bounds', () => {
    const chunkSize = UPLOAD_ENGINE_CONFIG.defaultChunkSizeBytes;
    const expectedBytes = chunkSize * 2 + 100;
    expect(validateChunkIndex(0, expectedBytes, chunkSize).ok).toBe(true);
    expect(validateChunkIndex(2, expectedBytes, chunkSize).ok).toBe(true);
    expect(validateChunkIndex(3, expectedBytes, chunkSize).ok).toBe(false);
  });

  it('computes monotonic uploaded bytes', () => {
    const chunkSize = 1000;
    const expectedBytes = 2500;
    expect(computeUploadedBytes(0, chunkSize, expectedBytes)).toBe(1000);
    expect(computeUploadedBytes(1, chunkSize, expectedBytes)).toBe(2000);
    expect(computeUploadedBytes(2, chunkSize, expectedBytes)).toBe(2500);
  });
});

describe('upload http mapping', () => {
  it('maps intake error codes to HTTP statuses', async () => {
    const { mapMediaIntakeErrorToHttpStatus } = await import('../../src/server/upload/upload-http.js');
    expect(mapMediaIntakeErrorToHttpStatus('ownership_violation')).toBe(403);
    expect(mapMediaIntakeErrorToHttpStatus('file_too_large')).toBe(413);
    expect(mapMediaIntakeErrorToHttpStatus('storage_unavailable')).toBe(503);
  });
});
