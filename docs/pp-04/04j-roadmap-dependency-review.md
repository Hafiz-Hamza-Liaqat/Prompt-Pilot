# PP-04J — Roadmap Dependency Review

**Related:** [Master roadmap](../prompt-pilot-roadmap.md) · [PP-02 roadmap deps](../pp-02/11-roadmap-dependency-review.md)

Updates forward phase dependencies after PP-04 Runtime Architecture. **PP-01, PP-02, PP-03, PP-04 are approved baseline.**

> **Phase ID errata (PP-07.1):** Sections below use pre-implementation PP numbering. **Authoritative forward schedule:** PP-06 = Job Lifecycle · PP-07 = Media Intake & Storage Boundaries · PP-07B = Upload Engine · PP-08 = Job Orchestration. See [master roadmap](../prompt-pilot-roadmap.md).

---

## 1. Approved baseline (locked)

| Phase | Artifact |
|---|---|
| PP-01 | Product vision, PRS, MVP, architecture audit |
| PP-02 | Domain language, ERM, pipeline, job states, cache, migration |
| PP-03 | Zod contracts (`src/domain/canonical/`) |
| PP-04 | Runtime components, services, repos, orchestrator, governance |

**Rule:** PP-05+ must not redefine Reference, Analysis, Package, Job, Fingerprint, or runtime boundaries without ADR.

---

## 2. Implementation phase dependencies

### PP-05 — Link Intelligence & URL Safety

| Requires | From |
|---|---|
| Runtime component: Request Validator, Link Intelligence service | PP-04A, PP-04C |
| Validation stage in pipeline | PP-04B |
| SSRF governance rules G-24, G-25 | PP-04H |
| `ReferenceSchema`, `JobFailureCode` validation enums | PP-03 |
| YouTube-only MVP scope | PP-01 |

| Produces (implementation) | URL normalizer, allowlist, integration tests, mock metadata provider |
| Deferred | TikTok/IG/FB, official platform API research |

---

### PP-06 — Upload Engine & Storage Boundary

| Requires | From |
|---|---|
| Media Intake service boundary | PP-04A, PP-04C |
| Upload stage + resume boundaries | PP-04B, PP-04I |
| Storage Provider in Provider Layer | PP-04A |
| Temp TTL governance G-26, G-29 | PP-04H |
| `REFERENCE_KINDS` upload kinds | PP-03 |

| Produces (implementation) | Supabase Storage bucket, upload API, RLS, virus-scan policy |
| Deferred | Permanent media library |

---

### PP-07 — Job Orchestration & Worker Boundary

| Requires | From |
|---|---|
| Runtime Orchestrator spec | PP-04E |
| Full pipeline + checkpoints | PP-04B |
| Job Repository boundary | PP-04D |
| Failure/retry/cancel architecture | PP-04I |
| Job state machine (PP-02) + `JobRecordSchema` | PP-02, PP-03 |
| **Persistence design (DDL + RLS)** | **Prerequisite spike** — see §3 |

| Produces (implementation) | Job table, status API, worker, queue |
| Deferred | Scale-out multi-worker |

---

## 3. Persistence design placement

PP-04D defines **conceptual repository boundaries only** (no SQL).

**Physical persistence design** (entity-to-table map, RLS, `applicationSchemaInventory` amendment, migration DDL plan) is required **before PP-07 migrations apply** and should begin **at PP-05 kickoff** as a design-only track:

| Deliverable | When |
|---|---|
| Entity-to-table map | Parallel with PP-05 |
| RLS notes | Before PP-07 |
| Forbidden-table inventory update | Before PP-07 |
| Migration DDL (not applied until PP-07) | PP-07 |

This preserves PP-04 as final **architecture** documentation while unblocking PP-07 implementation.

---

## 4. Downstream phases (summary)

| Phase | Title | PP-04 requires |
|---|---|---|
| PP-08 | Cache Layer | Cache Service, Cache Manager, G-30–G-33 |
| PP-09 | Core Analysis (Mock) | Core Analysis boundary, G-07 |
| PP-10 | Analysis UI & Workspace | Workspace Composer, sequence diagrams |
| PP-11 | Real AI Provider | Provider Layer rules G-06 |
| PP-12 | Package Engine (Mock) | Package dependency graph, G-08–G-10 |
| PP-13+ | Feature modules | Per-type generator boundaries (04C) |

---

## 5. Critical path (updated)

```text
PP-04 (Runtime Architecture) ── APPROVED ── GATE
        │
        ├──► PP-05 Link Intelligence ──┐
        │                               │
        ├──► PP-06 Upload Engine ───────┼──► PP-07 Job Orchestration
        │         (+ persistence design spike)
        │
        └──► PP-08 Cache ──► PP-09 Mock Analysis ──► PP-10 UI
                                      │
                                      └──► PP-12 Package Engine ──► PP-13+
```

---

## 6. Intentionally deferred decisions

| Topic | Deferred to |
|---|---|
| Worker hosting (inline vs queue vs edge) | PP-07 |
| Queue technology | PP-07 |
| Fingerprint hash algorithm | PP-08 |
| Cache storage backend | PP-08 |
| Timeout numeric values | PP-07 |
| Max retry/backoff | PP-07 |
| Partial package UX copy | PP-10 |
| Cross-user cache | Legal + PP-08 |
| Credit charge on cache hit | PP-18 |
| BYOK | PP-19 |

---

## 7. Roadmap document updates

- Phase 4 title → **Runtime Architecture & Execution Boundaries**
- Phases 1–3 status → **APPROVED**
- Phase 4 status → **COMPLETE** (pending human approval sign-off)
- Persistence design noted as PP-05/07 prerequisite track

---

## Step 04J acceptance

- [x] PP-05, PP-06, PP-07 requirements documented
- [x] Deferred decisions listed
- [x] Master roadmap updated
- [x] Persistence placement clarified
