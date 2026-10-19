# PP-05A-8 — Persistence Governance

**Related:** [PP-04H runtime governance](../pp-04/04h-runtime-governance-rules.md) · [05a-3-repository-design.md](05a-3-repository-design.md)

Architectural rules for persistence layer. Violations require ADR.

---

## 1. Repository rules

| ID | Rule |
|---|---|
| P-01 | **Repositories never invoke AI** or external providers |
| P-02 | **Repositories never contain business logic** — validation is schema-shape only |
| P-03 | **Repositories never know about HTTP** — no Request/Response types |
| P-04 | **Repositories never call Package Engine or Core Analysis** |
| P-05 | **Repositories never transition job states** — Orchestrator only |
| P-06 | **One repository per aggregate root** — avoid god repos |
| P-07 | **Cross-aggregate operations use orchestrator** — not cross-repo calls from repos |

---

## 2. Transaction rules

| ID | Rule |
|---|---|
| P-08 | **Transactions remain bounded** — prefer small commits at checkpoints |
| P-09 | **Analysis insert is checkpoint CP-2** — commit before package generation |
| P-10 | **Package inserts one type per transaction** for partial failure (CP-3) |
| P-11 | **Job state + JobEvent append in same transaction** when possible |
| P-12 | **No distributed transactions** — compensate with job retry |

---

## 3. Immutability rules

| ID | Rule |
|---|---|
| P-13 | **ReferenceVideoAnalysis rows are insert-only** |
| P-14 | **Package payload is insert-only** |
| P-15 | **ProviderUsage is append-only** |
| P-16 | **JobEvent is append-only** |
| P-17 | **Export records are insert-only** |

---

## 4. Dependency rules

| ID | Rule |
|---|---|
| P-18 | **No circular dependencies** — repos depend on DB client only |
| P-19 | **Services may depend on repos; repos never depend on services** |
| P-20 | **Persistence never calls Package Engine** |
| P-21 | **WorkspaceRepository is read-only** — no writes |

---

## 5. Security rules

| ID | Rule |
|---|---|
| P-22 | **Every pivot table has RLS enabled** |
| P-23 | **Service role writes require application ownership check** |
| P-24 | **storageLocator never returned to client** |
| P-25 | **Cache scope enforced at repository query layer** |

---

## 6. Schema rules

| ID | Rule |
|---|---|
| P-26 | **Persisted JSON must validate against PP-03 Zod schemas** |
| P-27 | **No parallel hand-written DB types** — generate from migrations + map to domain |
| P-28 | **Forbidden tables stay forbidden** until explicit inventory ADR |
| P-29 | **Package storage uses PackageEnvelope contract** — not separate prompt_outputs table |

---

## 7. Migration rules

| ID | Rule |
|---|---|
| P-30 | **Migrations are additive in Phases A–C** |
| P-31 | **No destructive DDL in MVP without backup plan** |
| P-32 | **Update applicationSchemaInventory in same PR as first pivot migration** |

---

## 8. Relationship to PP-04 governance

| PP-04 rule | PP-05A persistence echo |
|---|---|
| G-06 Provider adapters don't persist | P-04 repos don't call providers |
| G-18 Jobs required | JobRepository mandatory |
| G-34 Zod contracts | P-26 |
| G-37 Forbidden tables | P-28 |

---

## Step 05A-8 acceptance

- [x] Persistence rules documented with IDs
- [x] No overlap contradiction with PP-04
- [x] No implementation
