/**
 * Transaction boundary contracts for orchestrator-coordinated writes (PP-05A P-08–P-12).
 * Implementations deferred to Supabase/Postgres adapter phase.
 */

export type PersistenceTransaction = {
  readonly id: string;
};

export type UnitOfWork = {
  /**
   * Runs work inside a single persistence transaction.
   * Implementations must commit on success and roll back on thrown errors.
   */
  run<T>(work: (transaction: PersistenceTransaction) => Promise<T>): Promise<T>;
};

/**
 * Optional capability for repositories that support enlisting in an external transaction.
 */
export type TransactionAware = {
  withTransaction(transaction: PersistenceTransaction): void;
};
