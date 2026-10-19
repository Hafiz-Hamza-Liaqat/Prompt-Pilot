export type { ContentHash, FileMetadata, FileMetadataInput } from './file-metadata.js';
export { ContentHashSchema, FileMetadataSchema } from './file-metadata.js';

export type {
  MediaValidationErrorCode,
  MediaValidationIssue,
  MediaValidationPolicy,
  MediaValidationResult,
} from './media-validation.js';
export {
  DEFAULT_AUDIO_UPLOAD_VALIDATION_POLICY,
  DEFAULT_BINARY_UPLOAD_VALIDATION_POLICY,
  DEFAULT_VIDEO_UPLOAD_VALIDATION_POLICY,
  MEDIA_VALIDATION_ERROR_CODES,
  MediaByteSizeContractSchema,
  MediaDurationContractSchema,
  MediaMimeContractSchema,
  mapValidationToIntakeError,
  validateContentHashContract,
  validateDurationSeconds,
  validateFileMetadata,
  validateFileMetadataAsIntakeResult,
  validateFileSize,
  validateMimeType,
} from './media-validation.js';
