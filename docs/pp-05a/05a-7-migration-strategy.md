# PP-05A-7 — Migration Strategy

**Related:** [PP-02 migration strategy](../pp-02/10-migration-strategy.md) · [PP-03 compatibility](../pp-03/compatibility.md)

Persistence migration sequence — **documentation only. No migration scripts.**

Extends PP-02 Phases A–E with persistence-specific actions and `applicationSchemaInventory` updates.

---

## 1. Principles

- Additive first — legacy brief path keeps working
- Dual-read before cutover
- Schema inventory updated **before** first DDL (PP-05B)
- Each phase independently testable + rollback

---

## 2. Phase A — Introduce new entities

**Goal:** Create pivot tables and repositories without changing UX default.

| Persistence action | Detail |
|---|---|
| Add tables (conceptual) | references, jobs, job_events, reference_analyses, packages, content_fingerprints, cache_entries, rights_attestations, workspace_assets, provider_usage |
| Update inventory | Add to `APPLICATION_OWNED_PUBLIC_TABLES`; remove from forbidden conceptual block |
| Repositories | Interface + Supabase impl stubs |
| RLS | Enable owner-scoped policies |
| UX | New routes hidden or beta flag |

**Does not replace:** `video_briefs`, existing workspace fixtures.

**Tests:** pgTAP RLS templates; repository unit tests with mocks.

---

## 3. Phase B — Dual-write compatibility

**Goal:** Pipeline writes canonical entities; workspace reads legacy OR canonical.

| Persistence action | Detail |
|---|---|
| Write path | Job completion persists Analysis + Packages |
| Read path | WorkspaceRepository composes canonical when flag on |
| Brief | Still dual — no brief migration |
| Fixtures | Still exist for legacy flag |

**Rollback:** Flag to legacy read.

---

## 4. Phase C — Backfill

**Goal:** Optional historical data migration.

| Data | Action |
|---|---|
| Eligible briefs | Synthetic Reference rows (no retroactive analysis) |
| Projects | No automatic analysis backfill |

**Not required for MVP.**

---

## 5. Phase D — Cutover

**Goal:** Canonical persistence is default read path.

| Persistence action | Detail |
|---|---|
| Workspace | Reads Analysis + Packages by default |
| Fixtures | Removed from production read path |
| Jobs | Required for new reference intake |

**Rollback:** Dual-read flag.

---

## 6. Phase E — Legacy removal

**Goal:** Deprecate fixture and dual-read paths.

| Remove | Detail |
|---|---|
| Static fixture dependencies | Code removal |
| Dual-read branching | Code removal |
| Optional | Narrow `video_briefs` columns after proof |

**Not rollback-friendly** — backup required.

---

## 7. applicationSchemaInventory transition

| Current | Future (PP-05B) |
|---|---|
| 7 owned tables | + pivot entity tables |
| `FORBIDDEN_APPLICATION_TABLES` blocks `prompt_outputs`, `video_plans` | **Keep forbidden** — packages replace prompt_outputs concept |
| — | Approve: references, reference_analyses, jobs, job_events, packages, exports, content_fingerprints, cache_entries, workspace_assets, provider_usage, rights_attestations |

**Rule:** Do not create `video_plans` or `prompt_outputs` tables — use Package envelope.

---

## 8. Rollback matrix

| Phase | Persistence rollback |
|---|---|
| A | Drop routes; tables empty OK |
| B | Read flag to legacy |
| D | Dual-read flag |
| E | Restore from backup |

---

## 9. Ordering relative to implementation phases

| Implementation phase | Migration phase |
|---|---|
| PP-05B (DDL) | A |
| PP-07 (Jobs) | A writes active |
| PP-09 (Mock analysis) | B dual-write |
| PP-10 (Workspace UI) | D cutover |
| Post-MVP | E |

---

## Step 05A-7 acceptance

- [x] Phases A–E with persistence actions
- [x] Inventory transition documented
- [x] No SQL scripts
