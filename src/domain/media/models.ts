import type { EntityId } from '../canonical/primitives.js';
import type { IsoDateTime } from '../common.js';

/** Owner scope for media intake — aligns with project ownership model. */
export type MediaOwnerScope = {
  ownerId: EntityId;
  projectId: EntityId;
};

export const MEDIA_INTAKE_ERROR_CODES = [
  'validation_error',
  'ownership_violation',
  'invalid_mime_type',
  'file_too_large',
  'file_too_small',
  'duration_exceeded',
  'duration_too_short',
  'invalid_content_hash',
  'unsupported_reference_kind',
  'session_not_found',
  'session_terminal',
  'resume_not_allowed',
  'storage_unavailable',
] as const;

export type MediaIntakeErrorCode = (typeof MEDIA_INTAKE_ERROR_CODES)[number];

export type MediaIntakeError = {
  code: MediaIntakeErrorCode;
  message: string;
};

export type MediaIntakeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: MediaIntakeError };

export function mediaIntakeOk<T>(data: T): MediaIntakeResult<T> {
  return { ok: true, data };
}

export function mediaIntakeErr<T>(
  code: MediaIntakeErrorCode,
  message: string,
): MediaIntakeResult<T> {
  return { ok: false, error: { code, message } };
}

export type MediaIntakeContext = MediaOwnerScope & {
  referenceId: EntityId;
  jobId?: EntityId;
};

export type MediaIntakeTimestamped = {
  occurredAt: IsoDateTime;
};
