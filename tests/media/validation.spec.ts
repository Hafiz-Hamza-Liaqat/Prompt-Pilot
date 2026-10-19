import { describe, expect, it } from 'vitest';
import {
  ContentHashSchema,
  FileMetadataSchema,
  validateContentHashContract,
  validateDurationSeconds,
  validateFileMetadata,
  validateFileSize,
  validateMimeType,
  DEFAULT_VIDEO_UPLOAD_VALIDATION_POLICY,
} from '../../src/domain/media/validation/index.js';

const POLICY = DEFAULT_VIDEO_UPLOAD_VALIDATION_POLICY;

describe('media validation contracts', () => {
  it('validates allowed MIME types', () => {
    expect(validateMimeType('video/mp4', POLICY)).toBeNull();
    expect(validateMimeType('application/pdf', POLICY)?.code).toBe('invalid_mime_type');
  });

  it('enforces file size bounds', () => {
    expect(validateFileSize(1024, POLICY)).toBeNull();
    expect(validateFileSize(0, POLICY)?.code).toBe('file_too_small');
    expect(validateFileSize(POLICY.maxByteSize + 1, POLICY)?.code).toBe('file_too_large');
  });

  it('enforces duration contract', () => {
    expect(validateDurationSeconds(30, POLICY)).toBeNull();
    expect(validateDurationSeconds(3, POLICY)?.code).toBe('duration_too_short');
    expect(validateDurationSeconds(999, POLICY)?.code).toBe('duration_exceeded');
  });

  it('validates sha256 content hash contract', () => {
    const valid = validateContentHashContract(
      { algorithm: 'sha256', digest: 'a'.repeat(64) },
      { ...POLICY, requireContentHash: true },
    );
    expect(valid).toBeNull();

    const invalid = validateContentHashContract(
      { algorithm: 'sha256', digest: 'not-a-hash' },
      { ...POLICY, requireContentHash: true },
    );
    expect(invalid?.code).toBe('invalid_content_hash');
  });

  it('parses FileMetadata schema', () => {
    const parsed = FileMetadataSchema.safeParse({
      mimeType: 'video/mp4',
      byteSize: 2048,
      durationSeconds: 30,
    });
    expect(parsed.success).toBe(true);
  });

  it('aggregates metadata validation issues', () => {
    const result = validateFileMetadata({
      mimeType: 'application/pdf',
      byteSize: POLICY.maxByteSize + 1,
      durationSeconds: 30,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(1);
    }
  });

  it('parses ContentHash schema independently', () => {
    expect(
      ContentHashSchema.safeParse({ algorithm: 'sha256', digest: 'b'.repeat(64) }).success,
    ).toBe(true);
  });
});
