import { z } from 'zod';
import { DurationSecondsSchema } from '../../common.js';
import { MAX_DURATION_SECONDS, MIN_DURATION_SECONDS } from '../../constants.js';
import {
  CONTENT_HASH_ALGORITHMS,
  MEDIA_INTAKE_MAX_FILE_BYTES,
  MEDIA_INTAKE_MIN_FILE_BYTES,
  MEDIA_UPLOAD_AUDIO_MIME_TYPES,
  MEDIA_UPLOAD_MIME_TYPES,
  MEDIA_UPLOAD_VIDEO_MIME_TYPES,
  type ContentHashAlgorithm,
  type MediaUploadMimeType,
} from '../constants.js';
import type { MediaIntakeErrorCode, MediaIntakeResult } from '../models.js';
import { mediaIntakeErr, mediaIntakeOk } from '../models.js';
import { ContentHashSchema, FileMetadataSchema, type ContentHash, type FileMetadata } from './file-metadata.js';

export const MEDIA_VALIDATION_ERROR_CODES = [
  'invalid_mime_type',
  'file_too_large',
  'file_too_small',
  'duration_exceeded',
  'duration_too_short',
  'invalid_content_hash',
  'metadata_invalid',
] as const;

export type MediaValidationErrorCode = (typeof MEDIA_VALIDATION_ERROR_CODES)[number];

export type MediaValidationIssue = {
  code: MediaValidationErrorCode;
  message: string;
  field?: keyof FileMetadata | 'contentHash.digest' | 'contentHash.algorithm';
};

export type MediaValidationResult =
  | { ok: true; metadata: FileMetadata }
  | { ok: false; issues: MediaValidationIssue[] };

export type MediaValidationPolicy = {
  allowedMimeTypes: readonly string[];
  maxByteSize: number;
  minByteSize: number;
  minDurationSeconds: number;
  maxDurationSeconds: number;
  requireContentHash: boolean;
  allowedHashAlgorithms: readonly ContentHashAlgorithm[];
};

export const DEFAULT_VIDEO_UPLOAD_VALIDATION_POLICY: MediaValidationPolicy = {
  allowedMimeTypes: MEDIA_UPLOAD_VIDEO_MIME_TYPES,
  maxByteSize: MEDIA_INTAKE_MAX_FILE_BYTES,
  minByteSize: MEDIA_INTAKE_MIN_FILE_BYTES,
  minDurationSeconds: MIN_DURATION_SECONDS,
  maxDurationSeconds: MAX_DURATION_SECONDS,
  requireContentHash: false,
  allowedHashAlgorithms: CONTENT_HASH_ALGORITHMS,
};

export const DEFAULT_AUDIO_UPLOAD_VALIDATION_POLICY: MediaValidationPolicy = {
  ...DEFAULT_VIDEO_UPLOAD_VALIDATION_POLICY,
  allowedMimeTypes: MEDIA_UPLOAD_AUDIO_MIME_TYPES,
};

export const DEFAULT_BINARY_UPLOAD_VALIDATION_POLICY: MediaValidationPolicy = {
  ...DEFAULT_VIDEO_UPLOAD_VALIDATION_POLICY,
  allowedMimeTypes: MEDIA_UPLOAD_MIME_TYPES,
};

function issue(
  code: MediaValidationErrorCode,
  message: string,
  field?: MediaValidationIssue['field'],
): MediaValidationIssue {
  return { code, message, field };
}

export function validateMimeType(
  mimeType: string,
  policy: MediaValidationPolicy,
): MediaValidationIssue | null {
  const normalized = mimeType.trim().toLowerCase();
  if (!policy.allowedMimeTypes.includes(normalized as MediaUploadMimeType)) {
    return issue('invalid_mime_type', `MIME type "${mimeType}" is not allowed`, 'mimeType');
  }
  return null;
}

export function validateFileSize(
  byteSize: number,
  policy: MediaValidationPolicy,
): MediaValidationIssue | null {
  if (byteSize < policy.minByteSize) {
    return issue('file_too_small', `File size ${byteSize} bytes is below minimum`, 'byteSize');
  }
  if (byteSize > policy.maxByteSize) {
    return issue('file_too_large', `File size ${byteSize} bytes exceeds maximum`, 'byteSize');
  }
  return null;
}

export function validateDurationSeconds(
  durationSeconds: number | undefined,
  policy: MediaValidationPolicy,
): MediaValidationIssue | null {
  if (durationSeconds === undefined) {
    return null;
  }

  if (durationSeconds < policy.minDurationSeconds) {
    return issue(
      'duration_too_short',
      `Duration ${durationSeconds}s is below minimum ${policy.minDurationSeconds}s`,
      'durationSeconds',
    );
  }

  if (durationSeconds > policy.maxDurationSeconds) {
    return issue(
      'duration_exceeded',
      `Duration ${durationSeconds}s exceeds maximum ${policy.maxDurationSeconds}s`,
      'durationSeconds',
    );
  }

  return null;
}

export function validateContentHashContract(
  contentHash: ContentHash | undefined,
  policy: MediaValidationPolicy,
): MediaValidationIssue | null {
  if (!contentHash) {
    if (policy.requireContentHash) {
      return issue('invalid_content_hash', 'Content hash is required', 'contentHash');
    }
    return null;
  }

  const parsed = ContentHashSchema.safeParse(contentHash);
  if (!parsed.success) {
    return issue('invalid_content_hash', 'Content hash contract is invalid', 'contentHash.digest');
  }

  if (!policy.allowedHashAlgorithms.includes(parsed.data.algorithm)) {
    return issue(
      'invalid_content_hash',
      `Hash algorithm "${parsed.data.algorithm}" is not allowed`,
      'contentHash.algorithm',
    );
  }

  return null;
}

export function validateFileMetadata(
  input: unknown,
  policy: MediaValidationPolicy = DEFAULT_BINARY_UPLOAD_VALIDATION_POLICY,
): MediaValidationResult {
  const parsed = FileMetadataSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((zodIssue) =>
        issue('metadata_invalid', zodIssue.message, zodIssue.path[0] as MediaValidationIssue['field']),
      ),
    };
  }

  const issues: MediaValidationIssue[] = [];
  const metadata = parsed.data;

  const mimeIssue = validateMimeType(metadata.mimeType, policy);
  if (mimeIssue) issues.push(mimeIssue);

  const sizeIssue = validateFileSize(metadata.byteSize, policy);
  if (sizeIssue) issues.push(sizeIssue);

  const durationIssue = validateDurationSeconds(metadata.durationSeconds, policy);
  if (durationIssue) issues.push(durationIssue);

  const hashIssue = validateContentHashContract(metadata.contentHash, policy);
  if (hashIssue) issues.push(hashIssue);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, metadata };
}

export function mapValidationToIntakeError(
  issue: MediaValidationIssue,
): MediaIntakeResult<never> {
  const codeMap: Record<MediaValidationErrorCode, MediaIntakeErrorCode> = {
    invalid_mime_type: 'invalid_mime_type',
    file_too_large: 'file_too_large',
    file_too_small: 'file_too_small',
    duration_exceeded: 'duration_exceeded',
    duration_too_short: 'duration_too_short',
    invalid_content_hash: 'invalid_content_hash',
    metadata_invalid: 'validation_error',
  };
  return mediaIntakeErr(codeMap[issue.code], issue.message);
}

export function validateFileMetadataAsIntakeResult(
  input: unknown,
  policy?: MediaValidationPolicy,
): MediaIntakeResult<FileMetadata> {
  const result = validateFileMetadata(input, policy);
  if (result.ok) {
    return mediaIntakeOk(result.metadata);
  }
  return mapValidationToIntakeError(result.issues[0]!);
}

/** Duration contract schema for standalone validation. */
export const MediaDurationContractSchema = DurationSecondsSchema;

export const MediaMimeContractSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => MEDIA_UPLOAD_MIME_TYPES.includes(value.toLowerCase() as MediaUploadMimeType),
    'MIME type must be an allowed upload type',
  );

export const MediaByteSizeContractSchema = z
  .number()
  .int()
  .min(MEDIA_INTAKE_MIN_FILE_BYTES)
  .max(MEDIA_INTAKE_MAX_FILE_BYTES);
