import { randomUUID } from 'node:crypto';
import type { PersistenceTransaction, UnitOfWork } from '../../contracts/transaction';

/**
 * Supabase PostgREST clients cannot enlist in a client-side SQL transaction.
 * This implementation runs work sequentially and exposes a synthetic transaction id
 * for logging. Use {@link createPostgresUnitOfWork} when a direct Postgres connection
 * is available (integration tests, server-side workers).
 */
export class SupabaseSequentialUnitOfWork implements UnitOfWork {
  async run<T>(work: (transaction: PersistenceTransaction) => Promise<T>): Promise<T> {
    const transaction: PersistenceTransaction = { id: randomUUID() };
    return work(transaction);
  }
}
