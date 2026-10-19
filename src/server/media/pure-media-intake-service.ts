import {
  mediaIntakeErr,
  mediaIntakeOk,
  registerUploadSession,
  resolveUploadSessionExpiry,
  validateAssetReferenceOwnership,
  validateFileMetadata,
  validateFileMetadataAsIntakeResult,
  validateUploadSessionOwnership,
  applyUploadProgress,
  cancelUploadSession,
  completeUploadSession,
  resumeUploadSession,
  startUploadSession,
  type FileMetadata,
  type MediaIntakeResult,
  type MediaOwnerScope,
  type MediaValidationPolicy,
  type MediaValidationResult,
  type UploadCancellation,
  type UploadCompletion,
  type UploadRequest,
  type UploadResume,
  type UploadSession,
  type UploadSessionRegistration,
  type TemporaryAsset,
} from '@/domain/media';
import { resolveUrlReferenceFromLinkMetadata } from '@/domain/media/url-intake.js';
import type { LinkMetadata } from '@/domain/link';
import type { UrlMediaIntakeDescriptor } from '@/domain/media/url-media-descriptor.js';
import type {
  MediaIntakeService,
  MediaOwnershipService,
  MediaValidationService,
  UploadSessionService,
} from './media-intake-service';

/** Pure validation planner — no storage I/O (PP-07 contracts). */
export class PureMediaValidationService implements MediaValidationService {
  validateMetadata(input: unknown, policy?: MediaValidationPolicy): MediaValidationResult {
    return validateFileMetadata(input, policy);
  }

  validateMetadataForIntake(
    input: unknown,
    policy?: MediaValidationPolicy,
  ): MediaIntakeResult<FileMetadata> {
    return validateFileMetadataAsIntakeResult(input, policy);
  }
}

/** Pure upload session planner — no bytes transferred (PP-07 contracts). */
export class PureUploadSessionService implements UploadSessionService {
  registerSession(registration: UploadSessionRegistration): MediaIntakeResult<UploadSession> {
    return registerUploadSession(registration);
  }

  startSession(
    session: UploadSession,
    scope: MediaOwnerScope,
    occurredAt: string,
  ): MediaIntakeResult<UploadSession> {
    return startUploadSession(session, scope, occurredAt);
  }

  recordProgress(
    session: UploadSession,
    scope: MediaOwnerScope,
    uploadedBytes: number,
    occurredAt: string,
  ): MediaIntakeResult<UploadSession> {
    return applyUploadProgress(session, scope, uploadedBytes, occurredAt);
  }

  completeSession(
    session: UploadSession,
    completion: UploadCompletion,
  ): MediaIntakeResult<UploadSession> {
    return completeUploadSession(session, completion);
  }

  cancelSession(
    session: UploadSession,
    cancellation: UploadCancellation,
  ): MediaIntakeResult<UploadSession> {
    return cancelUploadSession(session, cancellation);
  }

  resumeSession(session: UploadSession, resume: UploadResume): MediaIntakeResult<UploadSession> {
    return resumeUploadSession(session, resume);
  }
}

/** Pure ownership gate — scope checks only (PP-07 contracts). */
export class PureMediaOwnershipService implements MediaOwnershipService {
  assertScope(
    scope: MediaOwnerScope,
    subject: { ownerId: string; projectId: string },
  ): MediaIntakeResult<void> {
    if (scope.ownerId !== subject.ownerId || scope.projectId !== subject.projectId) {
      return mediaIntakeErr('ownership_violation', 'Caller scope does not match resource ownership');
    }
    return mediaIntakeOk(undefined);
  }

  assertUploadSession(scope: MediaOwnerScope, session: UploadSession): MediaIntakeResult<void> {
    const result = validateUploadSessionOwnership(scope, session);
    if (!result.ok) {
      return mediaIntakeErr('ownership_violation', result.message);
    }
    return mediaIntakeOk(undefined);
  }

  assertTemporaryAsset(scope: MediaOwnerScope, asset: TemporaryAsset): MediaIntakeResult<void> {
    const result = validateAssetReferenceOwnership(scope, asset);
    if (!result.ok) {
      return mediaIntakeErr('ownership_violation', result.message);
    }
    return mediaIntakeOk(undefined);
  }
}

/**
 * Pure media intake contract service — validates and plans sessions without storage or HTTP.
 * Renamed from DefaultMediaIntakeService in PP-07.1 for clarity.
 */
export class PureMediaIntakeService
  implements MediaIntakeService, MediaValidationService, UploadSessionService, MediaOwnershipService
{
  private readonly validation = new PureMediaValidationService();
  private readonly sessions = new PureUploadSessionService();
  private readonly ownership = new PureMediaOwnershipService();

  validateMetadata(input: unknown, policy?: MediaValidationPolicy): MediaValidationResult {
    return this.validation.validateMetadata(input, policy);
  }

  validateMetadataForIntake(
    input: unknown,
    policy?: MediaValidationPolicy,
  ): MediaIntakeResult<FileMetadata> {
    return this.validation.validateMetadataForIntake(input, policy);
  }

  registerSession(registration: UploadSessionRegistration): MediaIntakeResult<UploadSession> {
    return this.sessions.registerSession(registration);
  }

  startSession(
    session: UploadSession,
    scope: MediaOwnerScope,
    occurredAt: string,
  ): MediaIntakeResult<UploadSession> {
    return this.sessions.startSession(session, scope, occurredAt);
  }

  recordProgress(
    session: UploadSession,
    scope: MediaOwnerScope,
    uploadedBytes: number,
    occurredAt: string,
  ): MediaIntakeResult<UploadSession> {
    return this.sessions.recordProgress(session, scope, uploadedBytes, occurredAt);
  }

  completeSession(
    session: UploadSession,
    completion: UploadCompletion,
  ): MediaIntakeResult<UploadSession> {
    return this.sessions.completeSession(session, completion);
  }

  cancelSession(
    session: UploadSession,
    cancellation: UploadCancellation,
  ): MediaIntakeResult<UploadSession> {
    return this.sessions.cancelSession(session, cancellation);
  }

  resumeSession(session: UploadSession, resume: UploadResume): MediaIntakeResult<UploadSession> {
    return this.sessions.resumeSession(session, resume);
  }

  assertScope(
    scope: MediaOwnerScope,
    subject: { ownerId: string; projectId: string },
  ): MediaIntakeResult<void> {
    return this.ownership.assertScope(scope, subject);
  }

  assertUploadSession(scope: MediaOwnerScope, session: UploadSession): MediaIntakeResult<void> {
    return this.ownership.assertUploadSession(scope, session);
  }

  assertTemporaryAsset(scope: MediaOwnerScope, asset: TemporaryAsset): MediaIntakeResult<void> {
    return this.ownership.assertTemporaryAsset(scope, asset);
  }

  planUploadRequest(request: UploadRequest): MediaIntakeResult<UploadSessionRegistration> {
    const metadataResult = this.validateMetadataForIntake(
      {
        mimeType: request.mimeType,
        byteSize: request.expectedBytes,
      },
      undefined,
    );
    if (!metadataResult.ok) {
      return metadataResult;
    }

    const expiresAt = resolveUploadSessionExpiry(request);
    return mediaIntakeOk({ request, expiresAt });
  }

  resolveUrlReference(
    linkMetadata: LinkMetadata,
    scope: MediaOwnerScope,
    jobId?: string,
  ): MediaIntakeResult<UrlMediaIntakeDescriptor> {
    return resolveUrlReferenceFromLinkMetadata(linkMetadata, scope, jobId);
  }
}

export function createPureMediaIntakeService(): MediaIntakeService {
  return new PureMediaIntakeService();
}

/** @deprecated Use {@link PureMediaIntakeService} — removed in a future release. */
export const DefaultMediaIntakeService = PureMediaIntakeService;

/** @deprecated Use {@link createPureMediaIntakeService}. */
export const createDefaultMediaIntakeService = createPureMediaIntakeService;
