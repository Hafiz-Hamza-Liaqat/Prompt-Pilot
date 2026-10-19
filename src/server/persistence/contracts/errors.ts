import type { PersistenceErrorCode } from './result';

/**
 * Structured persistence-layer error for logging and safe API mapping.
 * Distinct from {@link DomainError} (pipeline/orchestrator).
 */
export type PersistenceError = {
  code: PersistenceErrorCode;
  message: string;
  entity?: string;
  entityId?: string;
  cause?: unknown;
};

export type PersistenceErrorFactory = (
  code: PersistenceErrorCode,
  message: string,
  meta?: Pick<PersistenceError, 'entity' | 'entityId' | 'cause'>,
) => PersistenceError;
