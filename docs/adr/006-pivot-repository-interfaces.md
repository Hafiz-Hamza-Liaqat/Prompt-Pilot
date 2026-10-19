# ADR-006: Pivot repository interfaces in `src/server/persistence`

**Status:** Accepted (PP-05B)  
**Date:** 2026-07-05  
**Phase:** PP-05B

## Context

Legacy repositories live beside services (`project-repository.ts`, `video-brief-repository.ts`) with ad hoc result types. PP-05A defined eight pivot repositories. PP-05B must introduce interfaces without SQL or Supabase implementations.

## Decision

1. Create **`src/server/persistence/`** for pivot repository interfaces and shared contracts.
2. Use **`PersistenceResult<T>`** with extended error codes (`conflict`, `invalid_state`, etc.) — legacy repos unchanged until optional unification.
3. Every method takes **`OwnerScope`** first (`ownerId`, `projectId`).
4. **`PERSISTENCE_TOKENS`** (`Symbol.for`) for DI registration; **`PivotRepositoryRegistry`** for composition roots.
5. **`UnitOfWork`** interface only — no implementation in PP-05B.

## Consequences

- Supabase adapters implement interfaces in a future phase (`supabase-*-repository.ts` under `persistence/adapters/` or parallel folders).
- Orchestrator (PP-08) depends on interfaces, not concrete stores.
- Legacy `RepositoryResult` remains for projects/briefs until explicit migration.

## Alternatives considered

- **Extend project-repository.ts pattern inline** — rejected; sprawl across services
- **Implement stubs that throw** — rejected; user forbade runtime implementations
