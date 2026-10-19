/** Upload Engine operational defaults — PP-07B-A design. */
export const UPLOAD_ENGINE_CONFIG = {
  defaultChunkSizeBytes: 5_242_880, // 5 MiB
  minChunkSizeBytes: 262_144, // 256 KiB
  maxChunkSizeBytes: 33_554_432, // 32 MiB
  singlePutThresholdBytes: 8_388_608, // 8 MiB
  maxMultipartParts: 10_000,
  signedUrlTtlMinutes: 60,
  uploadProgressFloorPercent: 10,
  uploadProgressCeilingPercent: 15,
} as const;

export function resolveChunkSizeBytes(requested?: number): number {
  if (requested === undefined) {
    return UPLOAD_ENGINE_CONFIG.defaultChunkSizeBytes;
  }
  return Math.min(
    UPLOAD_ENGINE_CONFIG.maxChunkSizeBytes,
    Math.max(UPLOAD_ENGINE_CONFIG.minChunkSizeBytes, requested),
  );
}

export function resolveUploadMethod(expectedBytes: number): 'single_put' | 'multipart' {
  return expectedBytes <= UPLOAD_ENGINE_CONFIG.singlePutThresholdBytes ? 'single_put' : 'multipart';
}

export function mapUploadBytesToJobProgress(uploadedBytes: number, expectedBytes: number): number {
  if (expectedBytes <= 0) {
    return UPLOAD_ENGINE_CONFIG.uploadProgressFloorPercent;
  }
  const ratio = Math.min(1, uploadedBytes / expectedBytes);
  const span = UPLOAD_ENGINE_CONFIG.uploadProgressCeilingPercent - UPLOAD_ENGINE_CONFIG.uploadProgressFloorPercent;
  return UPLOAD_ENGINE_CONFIG.uploadProgressFloorPercent + Math.floor(span * ratio);
}
