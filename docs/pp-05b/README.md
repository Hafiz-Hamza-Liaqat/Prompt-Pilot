# PP-05B — Repository Interfaces & Persistence Contracts

**Phase:** PP-05B — Repository Interfaces & Persistence Contracts  
**Type:** Interfaces and contracts only — **no storage implementation**  
**Prerequisites:** PP-05A (approved) · Architecture foundation locked (PP-01–PP-04)

---

## Objective

Introduce canonical repository **interfaces**, shared persistence **contracts**, transaction/unit-of-work boundaries, and DI tokens. All future Supabase/Postgres adapters must implement these interfaces.

---

## Code layout

```text
src/server/persistence/
├── contracts/
│   ├── result.ts          — PersistenceResult, error codes
│   ├── ownership.ts       — OwnerScope
│   ├── pagination.ts      — Cursor + offset pagination
│   ├── errors.ts          — PersistenceError
│   ├── transaction.ts     — UnitOfWork, PersistenceTransaction
│   ├── records.ts         — Command/query record types
│   └── index.ts
├── repositories/
│   ├── reference-repository.ts
│   ├── analysis-repository.ts
│   ├── package-repository.ts
│   ├── job-repository.ts
│   ├── export-repository.ts
│   ├── fingerprint-repository.ts
│   ├── cache-repository.ts
│   ├── workspace-repository.ts
│   └── index.ts
├── tokens.ts              — PERSISTENCE_TOKENS, PivotRepositoryRegistry
└── index.ts
```

---

## Repository interfaces

| Interface | Writes | Reads |
|---|---|---|
| `ReferenceRepository` | insert, updateMetadata | getById, listByProject, getLatestByProject |
| `AnalysisRepository` | insert, setLatestVersion | getById, listByReference, getLatestByReference |
| `PackageRepository` | insert | getById, listByAnalysis, getLatestByAnalysisAndType |
| `JobRepository` | create, transitionState, appendEvent | getById, listByReference, getActiveByProject |
| `ExportRepository` | insert | getById, listByProject |
| `FingerprintRepository` | insertCandidate, promoteToActive, invalidate | getById, lookupByIdentity |
| `CacheRepository` | put, recordHit, invalidate | lookup |
| `WorkspaceRepository` | **none** | getIntelligenceBundle |

---

## Contracts

| Contract | Purpose |
|---|---|
| `PersistenceResult<T>` | Discriminated ok/error envelope |
| `OwnerScope` | `{ ownerId, projectId }` on every call |
| `UnitOfWork` | Transaction boundary for orchestrator |
| `CursorPage` / `OffsetPage` | Pagination |
| `PivotRepositoryRegistry` | DI registration map |

---

## Governance

- Interfaces define **behavior only** (PP-05A P-01–P-07).
- No Supabase, SQL, or runtime adapters in this phase.
- Domain types from `@/domain/canonical` — no parallel DTOs.

---

## Tests

`tests/persistence/repositoryInterfaces.spec.ts` — structural compile-time stubs + token stability.

---

## Next phase

**PP-05C / migrations tranche:** Supabase implementations, DDL, RLS, `applicationSchemaInventory` update.

**PP-05 (Link Intelligence):** Design audit complete — [pp-05/](../pp-05/). Implementation may proceed in parallel — no persistence dependency for URL validation.

---

## Acceptance

- [x] Eight repository interfaces
- [x] Transaction + unit-of-work contracts
- [x] DI tokens + registry types
- [x] Persistence error + pagination contracts
- [x] Compile-time tests
- [x] No SQL, migrations, or implementations
- [ ] Human approval
