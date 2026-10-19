export type {
  MediaIntakeContext,
  MediaIntakeError,
  MediaIntakeErrorCode,
  MediaIntakeResult,
  MediaIntakeTimestamped,
  MediaOwnerScope,
} from './models.js';
export {
  MEDIA_INTAKE_ERROR_CODES,
  mediaIntakeErr,
  mediaIntakeOk,
} from './models.js';

export type {
  AssetClassification,
  AssetState,
  ContentHashAlgorithm,
  MediaUploadMimeType,
  StorageLocator,
  UploadReferenceKind,
  UploadSessionState,
} from './constants.js';
export {
  ASSET_CLASSIFICATIONS,
  ASSET_STATES,
  CONTENT_HASH_ALGORITHMS,
  DEFAULT_TEMP_ASSET_TTL_HOURS,
  MEDIA_INTAKE_MAX_FILE_BYTES,
  MEDIA_INTAKE_MIN_FILE_BYTES,
  MEDIA_UPLOAD_AUDIO_MIME_TYPES,
  MEDIA_UPLOAD_MIME_TYPES,
  MEDIA_UPLOAD_VIDEO_MIME_TYPES,
  UPLOAD_REFERENCE_KINDS,
  UPLOAD_SESSION_STATES,
  UPLOAD_SESSION_TERMINAL_STATES,
  asStorageLocator,
  StorageLocatorSchema,
} from './constants.js';

export type { UploadSession } from './upload-session.js';
export {
  UploadSessionSchema,
  canResumeUploadSession,
  isUploadSessionTerminal,
} from './upload-session.js';

export type {
  UploadCancellation,
  UploadCompletion,
  UploadProgressUpdate,
  UploadRequest,
  UploadResume,
  UploadSessionRegistration,
  UploadSessionSnapshot,
  UploadSessionTransition,
} from './upload-contracts.js';

export type {
  OwnershipSubject,
  OwnershipValidationRequest,
  OwnershipValidationResult,
} from './ownership.js';
export {
  validateAssetReferenceOwnership,
  validateOwnership,
  validateTemporaryAssetOwnership,
  validateUploadSessionOwnership,
} from './ownership.js';

export * from './validation/index.js';
export * from './lifecycle/index.js';
export * from './storage/index.js';

export type { UploadIntakeEngine } from './upload-intake-engine.js';
export {
  applyUploadProgress,
  cancelUploadSession,
  completeUploadSession,
  registerUploadSession,
  resolveUploadSessionExpiry,
  resumeUploadSession,
  startUploadSession,
  uploadIntakeEngine,
} from './upload-intake-engine.js';

export type { UrlMediaIntakeDescriptor } from './url-media-descriptor.js';
export { UrlMediaIntakeDescriptorSchema } from './url-media-descriptor.js';
export { resolveUrlReferenceFromLinkMetadata } from './url-intake.js';
