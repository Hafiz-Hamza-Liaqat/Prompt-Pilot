import { DEFAULT_EXPIRATION_POLICY } from './lifecycle/policies.js';
import type { MediaIntakeResult, MediaOwnerScope } from './models.js';
import { mediaIntakeErr, mediaIntakeOk } from './models.js';
import { validateUploadSessionOwnership } from './ownership.js';
import type {
  UploadCancellation,
  UploadCompletion,
  UploadRequest,
  UploadResume,
  UploadSessionRegistration,
} from './upload-contracts.js';
import {
  UploadSessionSchema,
  canResumeUploadSession,
  isUploadSessionTerminal,
  type UploadSession,
} from './upload-session.js';

export function registerUploadSession(
  registration: UploadSessionRegistration,
): MediaIntakeResult<UploadSession> {
  const { request, expiresAt } = registration;
  const timestamp = request.requestedAt;

  const session: UploadSession = {
    sessionId: request.sessionId,
    projectId: request.projectId,
    ownerId: request.ownerId,
    referenceId: request.referenceId,
    jobId: request.jobId,
    referenceKind: request.referenceKind,
    state: 'initiated',
    expectedBytes: request.expectedBytes,
    uploadedBytes: 0,
    chunkSizeBytes: request.chunkSizeBytes,
    mimeType: request.mimeType,
    expiresAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const parsed = UploadSessionSchema.safeParse(session);
  if (!parsed.success) {
    return mediaIntakeErr('validation_error', 'Upload session registration failed validation');
  }

  return mediaIntakeOk(parsed.data);
}

export function resolveUploadSessionExpiry(request: UploadRequest): string {
  const createdMs = Date.parse(request.requestedAt);
  const ttlMs = DEFAULT_EXPIRATION_POLICY.uploadSessionTtlHours * 60 * 60 * 1000;
  return new Date(createdMs + ttlMs).toISOString();
}

export function startUploadSession(
  session: UploadSession,
  scope: MediaOwnerScope,
  occurredAt: string,
): MediaIntakeResult<UploadSession> {
  const ownership = validateUploadSessionOwnership(scope, session);
  if (!ownership.ok) {
    return mediaIntakeErr('ownership_violation', ownership.message);
  }
  if (isUploadSessionTerminal(session.state)) {
    return mediaIntakeErr('session_terminal', `Session is terminal in state "${session.state}"`);
  }
  if (session.state !== 'initiated' && session.state !== 'paused') {
    return mediaIntakeErr('validation_error', `Cannot start upload from state "${session.state}"`);
  }

  return mediaIntakeOk({
    ...session,
    state: 'uploading',
    updatedAt: occurredAt,
  });
}

export function applyUploadProgress(
  session: UploadSession,
  scope: MediaOwnerScope,
  uploadedBytes: number,
  occurredAt: string,
): MediaIntakeResult<UploadSession> {
  const ownership = validateUploadSessionOwnership(scope, session);
  if (!ownership.ok) {
    return mediaIntakeErr('ownership_violation', ownership.message);
  }
  if (session.state !== 'uploading') {
    return mediaIntakeErr('validation_error', 'Progress updates require uploading state');
  }
  if (session.expectedBytes !== undefined && uploadedBytes > session.expectedBytes) {
    return mediaIntakeErr('file_too_large', 'Uploaded bytes exceed expected file size');
  }

  return mediaIntakeOk({
    ...session,
    uploadedBytes,
    updatedAt: occurredAt,
  });
}

export function completeUploadSession(
  session: UploadSession,
  completion: UploadCompletion,
): MediaIntakeResult<UploadSession> {
  const ownership = validateUploadSessionOwnership(completion.scope, session);
  if (!ownership.ok) {
    return mediaIntakeErr('ownership_violation', ownership.message);
  }
  if (session.sessionId !== completion.sessionId) {
    return mediaIntakeErr('validation_error', 'Session id mismatch');
  }
  if (isUploadSessionTerminal(session.state)) {
    return mediaIntakeErr('session_terminal', `Session is terminal in state "${session.state}"`);
  }

  return mediaIntakeOk({
    ...session,
    state: 'completed',
    uploadedBytes: completion.uploadedBytes,
    contentHash: completion.contentHash,
    storageLocator: completion.storageLocator,
    updatedAt: completion.completedAt,
    completedAt: completion.completedAt,
  });
}

export function cancelUploadSession(
  session: UploadSession,
  cancellation: UploadCancellation,
): MediaIntakeResult<UploadSession> {
  const ownership = validateUploadSessionOwnership(cancellation.scope, session);
  if (!ownership.ok) {
    return mediaIntakeErr('ownership_violation', ownership.message);
  }
  if (isUploadSessionTerminal(session.state)) {
    return mediaIntakeErr('session_terminal', `Session is terminal in state "${session.state}"`);
  }

  return mediaIntakeOk({
    ...session,
    state: 'cancelled',
    updatedAt: cancellation.cancelledAt,
    completedAt: cancellation.cancelledAt,
  });
}

export function resumeUploadSession(
  session: UploadSession,
  resume: UploadResume,
): MediaIntakeResult<UploadSession> {
  const ownership = validateUploadSessionOwnership(resume.scope, session);
  if (!ownership.ok) {
    return mediaIntakeErr('ownership_violation', ownership.message);
  }
  if (!canResumeUploadSession(session)) {
    return mediaIntakeErr('resume_not_allowed', `Cannot resume session in state "${session.state}"`);
  }
  if (resume.uploadedBytes > (session.expectedBytes ?? Number.MAX_SAFE_INTEGER)) {
    return mediaIntakeErr('file_too_large', 'Resume offset exceeds expected file size');
  }

  return mediaIntakeOk({
    ...session,
    state: 'uploading',
    uploadedBytes: resume.uploadedBytes,
    updatedAt: resume.requestedAt,
  });
}

export type UploadIntakeEngine = {
  register: typeof registerUploadSession;
  resolveExpiry: typeof resolveUploadSessionExpiry;
  start: typeof startUploadSession;
  progress: typeof applyUploadProgress;
  complete: typeof completeUploadSession;
  cancel: typeof cancelUploadSession;
  resume: typeof resumeUploadSession;
};

export const uploadIntakeEngine: UploadIntakeEngine = {
  register: registerUploadSession,
  resolveExpiry: resolveUploadSessionExpiry,
  start: startUploadSession,
  progress: applyUploadProgress,
  complete: completeUploadSession,
  cancel: cancelUploadSession,
  resume: resumeUploadSession,
};
