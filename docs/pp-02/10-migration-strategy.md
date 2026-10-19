# Migration Strategy — PP-02 Step 11

**Type:** Sequence only — not SQL  
**Related:** [Adapter strategy](09-adapter-strategy.md) · [Architecture Readiness Audit](../pivot/04-architecture-audit.md)

---

## 1. Principles

- No risky **big-bang** cutover
- Each phase independently testable
- Legacy brief wizard and workspace remain functional until explicit switch
- Schema inventory guard updated **before** first migration (PP-04)

---

## 2. Migration phases

### Phase A — New entities (additive)

**Goal:** Introduce domain language in persistence without breaking existing flows.

| Add (conceptual) | Does not replace |
|---|---|
| Reference | video_briefs (yet) |
| Job | — |
| Content Fingerprint | — |
| ReferenceVideoAnalysis | SourceAnalysis schema in code |
| Package | static fixtures |

**Behavior:** New pivot UI path optional; legacy brief path default.

**Tests:** New entity unit tests; existing 1005+ tests pass.

---

### Phase B — Dual read

**Goal:** Workspace can read **either** legacy composition **or** canonical analysis + packages.

| Reader | Sources |
|---|---|
| Legacy path | Brief + engines + fixtures |
| Pivot path | Reference + Analysis + Packages |

Feature flag (future PP-17) controls path — until then environment config.

**Tests:** Dual-read integration script.

---

### Phase C — Backfill

**Goal:** Migrate eligible existing projects (optional script).

| Data | Backfill |
|---|---|
| Brief script/URL sources | Synthetic Reference records |
| — | No retroactive analysis unless user triggers job |

**Not required for MVP.**

---

### Phase D — Switch over

**Goal:** Pivot path becomes default.

| Change |
|---|
| Project detail primary CTA → reference intake |
| Workspace defaults to Analysis + Packages |
| Fixtures removed from production path |

Legacy brief available as "Advanced planning" or merged prefill.

**Tests:** Full regression + MVP acceptance.

---

### Phase E — Remove legacy

**Goal:** Delete deprecated paths.

| Remove |
|---|
| Static prompt/continuity fixtures |
| `providerCapability.ts` imports |
| Dual-read branching |
| Optional: product_url/article_url UX |

**Schema:** Deprecate columns only after data migration proof — not in early phases.

---

## 3. Rollback plan

Each phase must support rollback:

| Phase | Rollback |
|---|---|
| A | Hide new routes; tables orphaned but harmless |
| B | Flag to legacy reader |
| D | Flag back to dual-read |
| E | Not rollback-friendly — requires backup restore |

---

## 4. applicationSchemaInventory impact

Current `FORBIDDEN_APPLICATION_TABLES` blocks `prompt_outputs`, `video_plans`, etc.

**PP-04 action (future):** Replace forbidden list with **approved entity list**:

- `references`, `reference_analyses`, `content_fingerprints`, `jobs`, `packages`, `exports`, `cache_entries` (names TBD in PP-04)

PP-02 does not name final table names — only entities.

---

## Step 11 acceptance

- [x] Phases A–E defined
- [x] Rollback noted
- [x] No SQL
- [ ] Human approval
