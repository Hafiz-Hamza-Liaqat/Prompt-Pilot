import type { LinkMetadata } from '@/domain/link';
import type {
  FileMetadata,
  MediaIntakeResult,
  MediaOwnerScope,
  MediaValidationPolicy,
  MediaValidationResult,
  UploadCancellation,
  UploadCompletion,
  UploadRequest,
  UploadResume,
  UploadSession,
  UploadSessionRegistration,
} from '@/domain/media';
import type { UrlMediaIntakeDescriptor } from '@/domain/media/url-media-descriptor.js';
import type { TemporaryAsset } from '@/domain/media';
import type { StorageProvider } from '@/domain/media';
import type { AppendMediaLifecycleEventInput, MediaLifecycleEvent } from '@/domain/media';

/**
 * Validates file metadata at intake boundary — PP-07 contracts only.
 */
export interface MediaValidationService {
  validateMetadata(input: unknown, policy?: MediaValidationPolicy): MediaValidationResult;
  validateMetadataForIntake(input: unknown, policy?: MediaValidationPolicy): MediaIntakeResult<FileMetadata>;
}

/**
 * Upload session planning — no bytes transferred, no storage calls.
 */
export interface UploadSessionService {
  registerSession(registration: UploadSessionRegistration): MediaIntakeResult<UploadSession>;
  startSession(
    session: UploadSession,
    scope: MediaOwnerScope,
    occurredAt: string,
  ): MediaIntakeResult<UploadSession>;
  recordProgress(
    session: UploadSession,
    scope: MediaOwnerScope,
    uploadedBytes: number,
    occurredAt: string,
  ): MediaIntakeResult<UploadSession>;
  completeSession(
    session: UploadSession,
    completion: UploadCompletion,
  ): MediaIntakeResult<UploadSession>;
  cancelSession(
    session: UploadSession,
    cancellation: UploadCancellation,
  ): MediaIntakeResult<UploadSession>;
  resumeSession(session: UploadSession, resume: UploadResume): MediaIntakeResult<UploadSession>;
}

/**
 * Ownership gate for media operations.
 */
export interface MediaOwnershipService {
  assertScope(scope: MediaOwnerScope, subject: { ownerId: string; projectId: string }): MediaIntakeResult<void>;
  assertUploadSession(scope: MediaOwnerScope, session: UploadSession): MediaIntakeResult<void>;
  assertTemporaryAsset(scope: MediaOwnerScope, asset: TemporaryAsset): MediaIntakeResult<void>;
}

/**
 * Facade for orchestrator media intake stage — persistence and HTTP deferred.
 */
export interface MediaIntakeService extends MediaValidationService, UploadSessionService, MediaOwnershipService {
  planUploadRequest(request: UploadRequest): MediaIntakeResult<UploadSessionRegistration>;
  /** Maps Link Intelligence output to a URL media descriptor — no fetch or persistence (PP-05B.1). */
  resolveUrlReference(
    linkMetadata: LinkMetadata,
    scope: MediaOwnerScope,
    jobId?: string,
  ): MediaIntakeResult<UrlMediaIntakeDescriptor>;
}

/**
 * Lifecycle audit stream — interface only.
 */
export interface MediaLifecycleEventService {
  append(event: AppendMediaLifecycleEventInput): Promise<MediaLifecycleEvent>;
  list(filter: { projectId: string; ownerId: string }): Promise<MediaLifecycleEvent[]>;
}

/**
 * Storage operations — implemented by future provider adapters.
 * Referenced here for orchestrator DI only; no PP-07 implementation.
 */
export type MediaStorageService = StorageProvider;

export const MEDIA_INTAKE_TOKENS = {
  validationService: Symbol.for('prompt-pilot.media.MediaValidationService'),
  uploadSessionService: Symbol.for('prompt-pilot.media.UploadSessionService'),
  ownershipService: Symbol.for('prompt-pilot.media.MediaOwnershipService'),
  intakeService: Symbol.for('prompt-pilot.media.MediaIntakeService'),
  lifecycleEventService: Symbol.for('prompt-pilot.media.MediaLifecycleEventService'),
  storageService: Symbol.for('prompt-pilot.media.MediaStorageService'),
} as const;
