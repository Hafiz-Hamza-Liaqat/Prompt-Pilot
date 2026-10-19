# PP-04D — Repository Boundaries

**Related:** [PP-02 ERM](../pp-02/02-entity-relationship-model.md) · [PP-03 contracts](../pp-03/README.md)

Conceptual repository responsibilities only. **No SQL. No tables.**

Repositories are **persistence adapters** — they do not contain business logic, AI calls, or orchestration.

---

## 1. Repository principles

| Rule | Detail |
|---|---|
| Owner-scoped | All pivot repositories enforce project ownership via RLS (implementation phase) |
| Immutable writes | Analysis and published packages are append-only; new version = new row |
| No AI | Repositories never invoke providers |
| Thin | Validate shape with Zod at boundary; map to/from storage |
| Idempotent keys | Job and package writes support retry without duplication |

---

## 2. Reference Repository

| Field | Detail |
|---|---|
| **Purpose** | Persist and query Reference intake records |
| **Operations** | Create on submission; read by ID/project; update access status |
| **Entities** | `Reference` (`ReferenceSchema`) |
| **Called by** | Orchestrator (create), Media Intake (update descriptors), Workspace Composer (read) |
| **Must not** | Store analysis content; run validation beyond schema |

---

## 3. Analysis Repository

| Field | Detail |
|---|---|
| **Purpose** | Persist immutable `ReferenceVideoAnalysis` snapshots |
| **Operations** | Insert new version; read by analysisId; list versions by referenceId; mark `isLatest` |
| **Entities** | `ReferenceVideoAnalysis` |
| **Called by** | Core Analysis Service (via orchestrator), Cache Service (read/write link), Workspace Composer |
| **Must not** | Update analysis in place; delete without policy job |

---

## 4. Package Repository

| Field | Detail |
|---|---|
| **Purpose** | Persist immutable `PackageEnvelope` records |
| **Operations** | Insert package; read by ID; list by analysisId + packageType; query latest version |
| **Entities** | `PackageEnvelope` |
| **Called by** | Package Generator facade, Export Generator, Workspace Composer |
| **Must not** | Regenerate payload; merge package types |

---

## 5. Export Repository

| Field | Detail |
|---|---|
| **Purpose** | Record export delivery events |
| **Operations** | Insert export; list by project/reference |
| **Entities** | `ExportRecord` |
| **Called by** | Export Generator, History Service |
| **Must not** | Store duplicate full package blobs if packages already persisted (prefer reference by ID) |

---

## 6. Job Repository

| Field | Detail |
|---|---|
| **Purpose** | Persist job lifecycle and progress |
| **Operations** | Create job; update state/progress; attach failure; list by project/reference; checkpoint metadata |
| **Entities** | `JobRecord`, job events (conceptual) |
| **Called by** | Orchestrator only (writes); Frontend/API (read status) |
| **Must not** | Transition states without orchestrator rules |

---

## 7. Fingerprint Repository

| Field | Detail |
|---|---|
| **Purpose** | Persist fingerprint records and lookup by identity inputs |
| **Operations** | Upsert candidate→active; invalidate; expire |
| **Entities** | `ContentFingerprint` |
| **Called by** | Fingerprint Service, Cache Service |
| **Must not** | Store analysis payload |

---

## 8. Cache Repository (optional adapter)

| Field | Detail |
|---|---|
| **Purpose** | Cache entry CRUD separate from analysis storage if needed |
| **Operations** | Get by key; put; invalidate; TTL sweep |
| **Entities** | Cache entry (conceptual — PP-02 cache architecture) |
| **Called by** | Cache Service |
| **Note** | May be merged with Analysis Repository in MVP if cache entries reference analysis rows only |

---

## 9. Workspace Repository (read aggregate)

| Field | Detail |
|---|---|
| **Purpose** | Optimized read queries for workspace composition (may be view or service-only) |
| **Operations** | Fetch latest intelligence bundle for project |
| **Entities** | Denormalized read model — not a domain root |
| **Called by** | Workspace Composer |
| **Note** | May be implemented as service composition without dedicated table |

---

## 10. Existing repositories (unchanged)

| Repository | Scope |
|---|---|
| `project-repository` / `supabase-project-repository` | Projects |
| `video-brief-repository` / `supabase-video-brief-repository` | Video Brief wizard |
| `provider-catalogue-repository` | Public catalogue |

---

## 11. Persistence design deferral

Physical table mapping, RLS policies, and migration DDL are **implementation deliverables** required before PP-07 (Job Orchestration). Conceptual boundaries above define **what** each repository owns without prescribing schema.

Recommended entity order for future persistence phase:

1. Reference + Job (pipeline skeleton)
2. Analysis + Fingerprint + Cache link
3. Package + Export
4. History / job events

---

## Step 04D acceptance

- [x] All pivot repositories identified
- [x] Responsibilities without SQL
- [x] Existing repos mapped
- [x] Persistence DDL deferred to implementation tranche
