import type { PostgrestError } from '@supabase/supabase-js';
import type { PersistenceErrorCode, PersistenceResult } from '../../contracts';
import { persistenceErr } from '../../contracts';

export { persistenceErr };

export function persistenceOk<T>(data: T): PersistenceResult<T> {
  return { ok: true, data };
}

export function persistenceNotFound<T>(message?: string): PersistenceResult<T> {
  return persistenceErr('not_found', message);
}

export function persistenceFailure<T>(error?: PostgrestError | null): PersistenceResult<T> {
  if (error?.code === 'PGRST116') {
    return persistenceNotFound(error.message);
  }
  if (error?.code === '42501') {
    return persistenceErr('forbidden' satisfies PersistenceErrorCode, error.message);
  }
  return persistenceErr('persistence_error', error?.message);
}

export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const separatorIndex = decoded.indexOf('|');
    if (separatorIndex <= 0) {
      return null;
    }
    return {
      createdAt: decoded.slice(0, separatorIndex),
      id: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export const TERMINAL_JOB_STATES = [
  'completed',
  'failed',
  'cancelled',
  'expired',
] as const;

export function scopeMatches(scope: { ownerId: string; projectId: string }, ownerId: string, projectId: string): boolean {
  return scope.ownerId === ownerId && scope.projectId === projectId;
}
