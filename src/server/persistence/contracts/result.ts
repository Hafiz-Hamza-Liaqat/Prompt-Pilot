/**
 * Shared persistence result envelope for pivot repositories (PP-05B).
 * Aligns with legacy {@link RepositoryResult} in project-repository.ts.
 */

export const PERSISTENCE_ERROR_CODES = [
  'not_found',
  'persistence_error',
  'forbidden',
  'conflict',
  'project_archived',
  'invalid_state',
  'scope_violation',
  'validation_error',
] as const;

export type PersistenceErrorCode = (typeof PERSISTENCE_ERROR_CODES)[number];

export type PersistenceResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: PersistenceErrorCode; message?: string };

export type PersistenceVoidResult = PersistenceResult<void>;

export function persistenceOk<T>(data: T): PersistenceResult<T> {
  return { ok: true, data };
}

export function persistenceErr<T>(
  code: PersistenceErrorCode,
  message?: string,
): PersistenceResult<T> {
  return { ok: false, code, message };
}
