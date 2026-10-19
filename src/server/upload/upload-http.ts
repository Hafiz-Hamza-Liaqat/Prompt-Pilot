import type { MediaIntakeErrorCode } from '@/domain/media/models';

const STATUS_MAP: Record<MediaIntakeErrorCode, number> = {
  validation_error: 400,
  ownership_violation: 403,
  invalid_mime_type: 415,
  file_too_large: 413,
  file_too_small: 400,
  duration_exceeded: 400,
  duration_too_short: 400,
  invalid_content_hash: 400,
  unsupported_reference_kind: 400,
  session_not_found: 404,
  session_terminal: 409,
  resume_not_allowed: 409,
  storage_unavailable: 503,
};

export function mapMediaIntakeErrorToHttpStatus(code: MediaIntakeErrorCode): number {
  return STATUS_MAP[code] ?? 400;
}

export function mapUploadCoordinatorErrorToHttpStatus(code: string): number {
  if (code in STATUS_MAP) {
    return STATUS_MAP[code as MediaIntakeErrorCode];
  }
  switch (code) {
    case 'not_found':
      return 404;
    case 'forbidden':
    case 'scope_violation':
      return 403;
    case 'conflict':
    case 'session_terminal':
      return 409;
    case 'not_authenticated':
      return 401;
    default:
      return 400;
  }
}
