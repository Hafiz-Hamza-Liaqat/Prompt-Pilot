# PP-05A-3 — Repository Design

**Related:** [PP-04D repository boundaries](../pp-04/04d-repository-boundaries.md) · [05a-1-domain-to-persistence-mapping.md](05a-1-domain-to-persistence-mapping.md)

Future repository responsibilities — **no implementation**.

Extends PP-04D with transaction boundaries, forbidden duties, and new repos (ProviderUsage, WorkspaceAsset, JobEvent, PackageManifest).

---

## 1. Design principles

| Principle | Detail |
|---|---|
| One aggregate per write transaction | Job state + event append may share txn; analysis insert separate commit point (CP-2) |
| Zod at boundary | Map DB row ↔ PP-03 schema on read/write |
| Owner scope | Every query includes project/user scope for RLS alignment |
| Idempotent inserts | Natural keys: `analysisId`, `packageId`, `jobId` |

---

## 2. ReferenceRepository

| Field | Detail |
|---|---|
| **Responsibilities** | CRUD for Reference entity (limited updates) |
| **Reads** | By `referenceId`, by `projectId`, latest by project |
| **Writes** | Insert on intake; update access status, title, platform fields |
| **Ownership** | Filter by `project.owner_id` |
| **Transaction boundaries** | Insert Reference + RightsAttestation + Job create = single txn (orchestrator) |
| **Forbidden** | Store analysis JSON; invoke AI; HTTP |

---

## 3. AnalysisRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Immutable analysis snapshot persistence |
| **Reads** | By `analysisId`; list by `referenceId`; get latest by reference |
| **Writes** | Insert new version; flip `isLatest` on prior (single txn) |
| **Ownership** | Via `projectId` on row |
| **Transaction boundaries** | Insert analysis + update cache link = orchestrator-coordinated (may be 2 txn with outbox pattern — PP-05B) |
| **Forbidden** | Update analysis body in place; run Core Analysis |

---

## 4. PackageRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Immutable package envelope storage |
| **Reads** | By `packageId`; by `analysisId` + type; latest version query |
| **Writes** | Insert package + manifest; never update payload |
| **Ownership** | Via `projectId` |
| **Transaction boundaries** | One package per txn for CP-3 partial failure |
| **Forbidden** | Regenerate payload; call Package Engine |

---

## 5. PackageManifestRepository (optional split)

| Field | Detail |
|---|---|
| **Responsibilities** | Query packages by dependency entity without loading payload |
| **Reads** | By `analysisId` in dependsOn; by generator version |
| **Writes** | Insert with package (same txn) |
| **Ownership** | Via package |
| **Transaction boundaries** | Coupled to Package insert |
| **Forbidden** | Business validation of dependencies (orchestrator/service) |
| **Note** | May merge into PackageRepository as JSON column — PP-05B |

---

## 6. JobRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Job lifecycle persistence |
| **Reads** | By `jobId`; active by project; history by reference |
| **Writes** | Insert; state transition with optimistic lock; attach failure |
| **Ownership** | Via `projectId` |
| **Transaction boundaries** | State transition + JobEvent append in one txn |
| **Forbidden** | Compute next state (orchestrator); skip state machine |

---

## 7. JobEventRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Append-only job event log |
| **Reads** | By `jobId` ordered |
| **Writes** | Insert only |
| **Ownership** | Via job → project |
| **Transaction boundaries** | Same txn as job state update when possible |
| **Forbidden** | Update/delete events in MVP |

---

## 8. ExportRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Export delivery records |
| **Reads** | By project, by exportId |
| **Writes** | Insert |
| **Ownership** | Project + `createdByUserId` |
| **Transaction boundaries** | Insert export; optional WorkspaceAsset link separate |
| **Forbidden** | Serialize packages (Export Generator service) |

---

## 9. FingerprintRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Fingerprint CRUD and lookup by identity |
| **Reads** | By `fingerprintId`; lookup by scoped identity hash |
| **Writes** | Insert candidate; promote active; invalidate |
| **Ownership** | Scoped per PP-05A-4 (user/project) |
| **Transaction boundaries** | Fingerprint promote + cache write coordinated by orchestrator |
| **Forbidden** | Store analysis payload |

---

## 10. CacheRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Cache entry get/put/invalidate/TTL |
| **Reads** | By cache key (fingerprint + scope + algorithm version) |
| **Writes** | Insert entry; update hit stats; invalidate |
| **Ownership** | Scope owner — not global until approved |
| **Transaction boundaries** | Cache write after analysis commit |
| **Forbidden** | Invoke Core Analysis on hit |

---

## 11. WorkspaceAssetRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Metadata for temp storage objects |
| **Reads** | By assetId, by reference |
| **Writes** | Insert; mark expired; delete metadata after storage purge |
| **Ownership** | Project owner |
| **Transaction boundaries** | Storage upload confirm + metadata insert |
| **Forbidden** | Expose locators to client responses |

---

## 12. ProviderUsageRepository

| Field | Detail |
|---|---|
| **Responsibilities** | Append usage ledger rows |
| **Reads** | By project, by user, by date range (PP-18) |
| **Writes** | Insert only |
| **Ownership** | User/project |
| **Transaction boundaries** | Insert after provider call completes |
| **Forbidden** | Enforce credit limits (middleware/service) |

---

## 13. WorkspaceRepository (read aggregate)

| Field | Detail |
|---|---|
| **Responsibilities** | Composite reads for workspace UI |
| **Reads** | Latest intelligence bundle: reference, analysis, packages, active job, brief |
| **Writes** | **None** — composition only |
| **Ownership** | Project scope |
| **Transaction boundaries** | Read-only; consistent snapshot optional (MVCC default) |
| **Forbidden** | Pipeline writes; AI |

**Implementation note:** May be a service composing other repos — no dedicated table required.

---

## 14. Existing repositories (unchanged)

| Repository | PP-05A impact |
|---|---|
| `ProjectRepository` | Add optional counts (references, jobs) — PP-05B |
| `VideoBriefRepository` | Unchanged until Migration Phase E |
| `ProviderCatalogueRepository` | Unchanged (public read) |

---

## Step 05A-3 acceptance

- [x] All repositories defined with reads/writes/ownership/transactions/forbidden
- [x] Aligns with PP-04D
- [x] No implementation
