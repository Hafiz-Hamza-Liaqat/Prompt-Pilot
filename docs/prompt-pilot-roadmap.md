# Prompt Pilot â€” Master Roadmap

**Project:** Prompt Pilot â€” AI Content Intelligence Platform
**Status:** Single source of truth for **forward** phases (post-pivot)
**Owner:** Product / engineering (human approval required per phase)
**Related:** [Pivot documentation](pivot/) Â· [PP-02 domain architecture](pp-02/) Â· [PP-03 contracts](pp-03/) Â· [PP-04 runtime architecture](pp-04/) Â· [PP-05A persistence design](pp-05a/) Â· [Legacy implementation checklist](implementation-checklist.md) (Phases 0â€“11-B historical only) Â· [Legacy phase roadmap](phase-roadmap.md) (superseded)

**Architecture foundation (PP-01â€“PP-04):** **LOCKED.** Changes require ADR + documented reason.

---

## How to use this document

| Rule | Detail |
|---|---|
| One phase in progress | Same governance as legacy checklist |
| Workflow | Audit â†’ Design â†’ Documentation â†’ Approval â†’ Backend â†’ Frontend â†’ Doc update â†’ Verification â†’ Sign-off |
| Independence | Each phase must be independently testable |
| No overlap | Do not start Phase N+1 until Phase N acceptance passes |

**Implemented today (reuse, do not rebuild):** Auth, profiles, projects, brief wizard, provider catalogue, deterministic scene/scoring/recommendation engines, hybrid workspace shell, global navigation (legacy Phases 2â€“11-B).

---

## Phase summary

| Phase | PP | Title | Status |
|---|---|---|---|
| 1 | PP-01 | Product Pivot Foundation | **APPROVED** |
| 2 | PP-02 | Domain Architecture | **APPROVED** |
| 3 | PP-03 | Canonical Contracts & Domain Glossary | **APPROVED** |
| 4 | PP-04 | Runtime Architecture & Execution Boundaries | **APPROVED** |
| 5 | PP-05A | Persistence Domain Design | **APPROVED** |
| 6 | PP-05 | Link Intelligence & URL Safety (design) | **COMPLETE** |
| 6b | PP-05B | Link Intelligence Implementation | **COMPLETE** |
| 6c | PP-05B.1 | Link Intelligence Hardening | **COMPLETE** |
| 6d | PP-05B.2 | Documentation & Composition Hardening | **COMPLETE** |
| 7 | PP-05B | Repository Interfaces & Persistence Contracts | **COMPLETE** (pending approval) |
| 8 | PP-05C | Persistence Implementation (DDL, RLS, adapters) | **COMPLETE** |
| 9 | PP-06 | Job Lifecycle Infrastructure | **COMPLETE** |
| 10 | PP-07 | Media Intake & Storage Boundaries | **COMPLETE** |
| 10b | PP-07.1 | Documentation & Contract Cleanup | **COMPLETE** |
| 11 | PP-07B | Upload Engine Implementation | **COMPLETE** |
| 11a | PP-07B-A | Upload Engine Design Audit | **COMPLETE** |
| 11b | PP-07B.1 | Upload Engine Hardening | **COMPLETE** |
| 12 | PP-08 | Job Orchestration & Worker Boundary | **APPROVED** (orchestration engine; worker boundary deferred) |
| 12b | PP-08.1 | Orchestrator Hardening & Documentation Cleanup | **COMPLETE** |
| 13 | PP-09A | Cache Layer Design Audit | **COMPLETE** |
| 13a | PP-09A.1 | Cache Layer Design Hardening | **COMPLETE** |
| 13b | PP-09B | Cache Layer Implementation | **COMPLETE** |
| 14a | PP-10A | Core Analysis Design Audit | **COMPLETE** |
| 14a1 | PP-10A.1 | Core Analysis Design Hardening | **COMPLETE** |
| 14 | PP-10 | Core Analysis (Mock Provider) | **COMPLETE** |
| 15 | PP-11 | Core Analysis UI & Workspace Integration | NOT_STARTED |
| 16 | PP-12 | Real AI Analysis Provider Boundary | NOT_STARTED |
| 17 | PP-13 | Package Engine (Mock) | NOT_STARTED |
| 18 | PP-14 | Prompt Studio UI & Export | NOT_STARTED |
| 19 | PP-15 | Real Prompt Compilation Provider | NOT_STARTED |
| 20 | PP-16 | Marketing & Hook Analysis Module | NOT_STARTED |
| 21 | PP-17 | SEO Engine | NOT_STARTED |
| 22 | PP-18 | Repurposing Engine | NOT_STARTED |
| 23 | PP-19 | Credits, Cost Controls & Usage Tracking | NOT_STARTED |
| 24 | PP-20 | BYOK & Feature Flags | NOT_STARTED |
| 25 | PP-21 | Localhost Acceptance, Deploy & Launch | NOT_STARTED |

**PP-05A gate:** Persistence design in [pp-05a/](pp-05a/). Persistence PP-05B (repository interfaces) and PP-05C (DDL, RLS, adapters) are **COMPLETE**. **Link Intelligence** (PP-05 / PP-05B in [pp-05/](pp-05/)) is complete through PP-05B.2.

**PP-04 gate:** Implementation phases must follow runtime boundaries in [pp-04/](pp-04/).

**PP-02 gate:** Phases 3+ must not redefine Reference, Analysis, Package, Job, or Fingerprint. See [roadmap dependency review](pp-02/11-roadmap-dependency-review.md).

---

## Phase 1 â€” Product Pivot Foundation

**Goal:** Document the AI Content Intelligence Platform pivot; no production code.

| Item | Detail |
|---|---|
| **Dependencies** | Legacy Phases 0â€“11-B complete |
| **Deliverables** | `docs/pivot/01`â€“`07`, this roadmap |
| **Checklist** | Vision audit Â· PRS Â· Feature inventory Â· Architecture audit Â· Cost audit Â· MVP freeze Â· Success metrics |
| **Acceptance** | All Phase 1-Aâ€“G acceptance boxes documented; human approval recorded |
| **Deferred** | All implementation |
| **Status** | **APPROVED** |
| **Owner** | Product |
| **Notes** | Documentation-only phase Â· [pivot index](pivot/README.md) |

---

## Phase 2 â€” Domain Architecture (PP-02)

**Goal:** Define canonical domain language, analysis object, package contract, pipeline, cache, and migration strategy â€” **no implementation**.

| Item | Detail |
|---|---|
| **Dependencies** | Phase 1 approved |
| **Deliverables** | [docs/pp-02/](pp-02/) (Steps 1â€“13) |
| **Checklist** | Audit gate Â· ReferenceVideoAnalysis spec Â· ERM Â· Package engine Â· Fingerprint Â· Job states Â· AI pipeline Â· Cache Â· Adapters Â· Migration Â· Roadmap deps Â· Final review |
| **Acceptance** | [12-final-architecture-review.md](pp-02/12-final-architecture-review.md) verdict recorded |
| **Deferred** | Zod schemas, DB, API, workers |
| **Status** | **APPROVED** |
| **Owner** | Product + engineering |
| **Verdict** | **GO WITH CONDITIONS** (conditions met by PP-03) |

---

## Phase 3 â€” Canonical Contracts & Domain Glossary (PP-03)

**Goal:** Encode PP-02 definitions in Zod and sync `domain-glossary.md` â€” **contracts only, no runtime wiring**.

| Item | Detail |
|---|---|
| **Dependencies** | Phase 2 approved |
| **PP-02 requires** | Canonical Analysis approved Â· Package contract approved Â· Job lifecycle approved |
| **Deliverables** | `ReferenceVideoAnalysis` Zod schema Â· Package envelope schema Â· Job state enum Â· Glossary amendment |
| **Acceptance** | No conflicting duplicate schemas; glossary matches PP-02 Part A |
| **Deferred** | DB migrations, API routes |
| **Status** | **APPROVED** |
| **Owner** | Product + engineering |
| **Evidence** | [docs/pp-03/](pp-03/) Â· `src/domain/canonical/` |

---

## Phase 4 â€” Runtime Architecture & Execution Boundaries (PP-04)

**Goal:** Define runtime components, pipeline execution, service/repository boundaries, orchestrator, governance, and failure architecture â€” **documentation only**.

| Item | Detail |
|---|---|
| **Dependencies** | Phase 3 approved |
| **PP-03 requires** | Canonical contracts in `src/domain/canonical/` |
| **Deliverables** | [docs/pp-04/](pp-04/) (04Aâ€“04J + final review) |
| **Checklist** | Components Â· Pipeline Â· Services Â· Repositories Â· Orchestrator Â· Package deps Â· Sequences Â· Governance Â· Failure/recovery Â· Roadmap deps |
| **Acceptance** | [05-final-runtime-architecture-review.md](pp-04/05-final-runtime-architecture-review.md) verdict recorded |
| **Deferred** | All runtime implementation |
| **Status** | **APPROVED** |
| **Owner** | Product + engineering |
| **Verdict** | **GO WITH CONDITIONS** (met) |

---

## Phase 5 â€” Persistence Domain Design (PP-05A)

**Goal:** Map approved domain architecture to persistence responsibilities â€” **design only, no SQL**.

| Item | Detail |
|---|---|
| **Dependencies** | Phase 4 approved |
| **Deliverables** | [docs/pp-05a/](pp-05a/) (05A-1â€“05A-10) Â· [ADR-005](adr/005-persistence-entity-set.md) |
| **Checklist** | Domain mapping Â· ERM Â· Repositories Â· Ownership Â· RLS strategy Â· Lifecycle Â· Migration Â· Governance Â· Risks Â· PP-05B readiness |
| **Acceptance** | [05a-10-pp05b-readiness-review.md](pp-05a/05a-10-pp05b-readiness-review.md) verdict recorded |
| **Deferred** | DDL, RLS SQL, repository code |
| **Status** | **COMPLETE** (pending human approval) |
| **Verdict** | **GO WITH CONDITIONS** |

---

## Phase 6 â€” Link Intelligence & URL Safety (PP-05)

**Goal:** YouTube URL normalization, platform detection, SSRF-safe validation; **no media download**.

| Item | Detail |
|---|---|
| **Dependencies** | Phases 4â€“5 approved Â· PP-06â€“PP-08 complete for orchestrator handoff |
| **PP-04 requires** | Request Validator Â· Link Intelligence service Â· G-24/G-25 |
| **Deliverables (design)** | [pp-05/05-link-intelligence-design-audit.md](pp-05/05-link-intelligence-design-audit.md) |
| **Deliverables (implementation)** | [pp-05/05b-link-intelligence-implementation.md](pp-05/05b-link-intelligence-implementation.md) â€” coordinator, providers, stage runner, orchestrator integration |
| **Deliverables (hardening)** | [pp-05/05b1-link-intelligence-hardening.md](pp-05/05b1-link-intelligence-hardening.md) â€” Media Intake handoff, SSRF hardening, production provider policy |
| **Deliverables (docs/composition)** | [pp-05/05b2-documentation-composition-hardening.md](pp-05/05b2-documentation-composition-hardening.md) â€” production composition rule, security residuals |
| **Acceptance** | SSRF test suite passes; no fetch without gate; typecheck + link + orchestration + full regression pass |
| **Notes** | No DB dependency for URL validation; may parallel persistence PP-05C |
| **Status** | **COMPLETE** (through PP-05B.2) |
| **Docs** | [pp-05/README.md](pp-05/README.md) |

---

## Phase 6b â€” Link Intelligence Implementation (PP-05B)

**Goal:** Runtime Link Intelligence coordinator, providers, orchestrator stage integration.

| Item | Detail |
|---|---|
| **Dependencies** | PP-05 design Â· PP-08 orchestrator |
| **Deliverables** | `src/server/link/`, `src/domain/link/`, `tests/link/` |
| **Status** | **COMPLETE** |
| **Docs** | [pp-05/05b-link-intelligence-implementation.md](pp-05/05b-link-intelligence-implementation.md) |

---

## Phase 6c â€” Link Intelligence Hardening (PP-05B.1)

**Goal:** Close PP-05B independent architecture audit conditions.

| Item | Detail |
|---|---|
| **Dependencies** | PP-05B |
| **Deliverables** | Media Intake handoff, HTTPS/DNS/redirect SSRF, canonical error propagation, Zod schemas |
| **Status** | **COMPLETE** |
| **Docs** | [pp-05/05b1-link-intelligence-hardening.md](pp-05/05b1-link-intelligence-hardening.md) |

---

## Phase 6d â€” Documentation & Composition Hardening (PP-05B.2)

**Goal:** Close PP-05B.1 audit documentation conditions â€” no runtime changes.

| Item | Detail |
|---|---|
| **Dependencies** | PP-05B.1 |
| **Deliverables** | Roadmap sync, production composition rule, security residual documentation |
| **Status** | **COMPLETE** |
| **Docs** | [pp-05/05b2-documentation-composition-hardening.md](pp-05/05b2-documentation-composition-hardening.md) |

---

## Phase 7 â€” Repository Interfaces & Persistence Contracts (PP-05B)

**Goal:** Canonical repository interfaces, persistence contracts, DI tokens â€” **no storage implementation**.

| Item | Detail |
|---|---|
| **Dependencies** | Phase 5 (PP-05A) approved |
| **Deliverables** | `src/server/persistence/` Â· [docs/pp-05b/](pp-05b/) Â· [ADR-006](adr/006-pivot-repository-interfaces.md) |
| **Acceptance** | Eight interfaces Â· UnitOfWork Â· PersistenceResult Â· compile tests Â· no SQL |
| **Deferred** | Supabase adapters, migrations, RLS SQL |
| **Status** | **COMPLETE** (pending human approval) |

---

## Phase 8 â€” Persistence Implementation (PP-05C)

**Goal:** Schema inventory update, migrations, RLS policies, Supabase repository adapters.

| Item | Detail |
|---|---|
| **Dependencies** | Phase 7 (PP-05B) approved |
| **Deliverables** | Migrations Â· RLS Â· `applicationSchemaInventory` update Â· adapter implementations |
| **Acceptance** | pgTAP RLS tests; inventory tests pass; repository integration tests |
| **Status** | **COMPLETE** |
| **Docs** | [pp-05c/README.md](pp-05c/README.md) |

---

## Phase 9 â€” Job Lifecycle Infrastructure (PP-06)

**Goal:** Canonical job models, state machine, progress/retry/cancel/resume contracts, and lifecycle service interfaces â€” persistence-agnostic.

| Item | Detail |
|---|---|
| **Dependencies** | PP-03 (JobRecordSchema) Â· PP-02 job state machine |
| **Deliverables** | `src/domain/job/*` Â· `src/server/job/*` Â· compile-time + unit tests |
| **Acceptance** | Typecheck passes; state transition tests; invalid transitions rejected |
| **Deferred** | Worker execution loop (post PP-08 orchestration) |
| **Status** | **COMPLETE** |
| **Consumer** | PP-08 `DefaultJobOrchestrator` via `JobLifecycleService` |

---

## Phase 10 â€” Media Intake & Storage Boundaries (PP-07)

**Goal:** Upload session models, storage provider interfaces, validation and lifecycle contracts â€” provider-agnostic, no cloud SDKs.

| Item | Detail |
|---|---|
| **Dependencies** | PP-03 Â· PP-04 Media Intake boundary Â· PP-06 upload resume |
| **Deliverables** | `src/domain/media/*` Â· `src/server/media/*` Â· contract tests |
| **Acceptance** | Typecheck passes; validation tests; ownership gates |
| **Deferred** | Storage provider implementations; upload HTTP endpoints (PP-07B) |
| **Status** | **COMPLETE** |

---

## Phase 10b â€” Documentation & Contract Cleanup (PP-07.1)

**Goal:** Resolve PP-07 audit findings â€” documentation sync, `StorageLocator` typing, `CleanupPolicy` completeness â€” **no runtime behavior**.

| Item | Detail |
|---|---|
| **Dependencies** | PP-07 approved (GO WITH CONDITIONS) |
| **Deliverables** | Roadmap renumbering Â· phase ID errata Â· branded locators Â· cleanup policy logic Â· service rename |
| **Acceptance** | Typecheck + media tests + full regression pass |
| **Status** | **COMPLETE** |

---

## Phase 11a â€” Upload Engine Design Audit (PP-07B-A)

**Goal:** Design upload architecture without production upload code â€” preserve PP-07/08 boundaries.

| Item | Detail |
|---|---|
| **Dependencies** | PP-07 Â· PP-07.1 Â· PP-08 Â· PP-08.1 Â· PP-05B |
| **Deliverables** | Upload lifecycle, chunking, resume, security, orchestrator/persistence integration design, testing strategy |
| **Acceptance** | Design doc complete; aligned with existing contracts; no HTTP/storage/runtime code |
| **Status** | **COMPLETE** (pending approval) |
| **Docs** | [pp-07b/README.md](pp-07b/README.md) Â· [07ba-upload-engine-design-audit.md](pp-07b/07ba-upload-engine-design-audit.md) |

---

## Phase 11 â€” Upload Engine Implementation (PP-07B)

**Goal:** Chunked upload runtime, storage adapters, HTTP boundary â€” implements PP-07B-A design.

| Item | Detail |
|---|---|
| **Dependencies** | PP-07B-A Â· PP-08 Â· PP-05B (persistence contracts) Â· PP-05C (persistence implementation â€” **COMPLETE**) |
| **PP-04 requires** | Media Intake service Â· upload resume boundaries Â· G-26/G-29 |
| **Deliverables** | Upload Engine runtime, storage provider adapter(s), upload API, session persistence wiring |
| **Acceptance** | Owner-only access; temp TTL enforced; orchestrator `media_intake` handoff |
| **Deferred** | Permanent media library; virus-scan worker; Supabase storage adapter (production) |
| **Status** | **COMPLETE** |
| **Docs** | [pp-07b/README.md](pp-07b/README.md) |

---

## Phase 11b â€” Upload Engine Hardening (PP-07B.1)

**Goal:** Resolve PP-07B audit conditions without expanding runtime scope.

| Item | Detail |
|---|---|
| **Dependencies** | PP-07B |
| **Deliverables** | `UploadStoragePort`, payload sanitization, orchestrator-owned job progress, validation ordering, rollback on initiate failure |
| **Acceptance** | Coordinator depends on interfaces only; no orphan jobs on invalid initiate; G-29 payload boundary |
| **Status** | **COMPLETE** |
| **Docs** | [07b1-upload-engine-hardening.md](pp-07b/07b1-upload-engine-hardening.md) |

---

## Phase 12 â€” Job Orchestration & Worker Boundary (PP-08)

**Goal:** Orchestration layer coordinating pipeline stages; worker boundary deferred.

| Item | Detail |
|---|---|
| **Dependencies** | PP-06 Â· PP-07 |
| **PP-04 requires** | Runtime Orchestrator Â· failure/recovery architecture |
| **Deliverables (PP-08)** | `JobOrchestrator`, `DefaultJobOrchestrator`, execution planning, pipeline coordinator, event contracts, future port interfaces |
| **Deferred** | Worker execution loop, status HTTP API, repository/AI/package port implementations |
| **Acceptance** | Orchestrator coordinates PP-06 lifecycle + PP-07 media contracts; stage plans match PP-04B pipeline |
| **Status** | **APPROVED** (orchestration engine; worker boundary deferred) |
| **Docs** | [pp-08/README.md](pp-08/README.md) |

---

## Phase 12b â€” Orchestrator Hardening (PP-08.1)

**Goal:** Resolve PP-08 audit findings without expanding runtime scope.

| Item | Detail |
|---|---|
| **Dependencies** | PP-08 |
| **Deliverables** | Event contract alignment, PP-06 doc sync, media intake coordination test, Link Intelligence pipeline documentation |
| **Acceptance** | Typecheck + orchestration tests + full regression pass |
| **Status** | **COMPLETE** |
| **Docs** | [pp-08.1/README.md](pp-08.1/README.md) |

---

## Phase 13 â€” Cache Layer Design Audit (PP-09A)

**Goal:** Architectural design for fingerprint-driven analysis cache â€” **no runtime implementation**.

| Item | Detail |
|---|---|
| **Dependencies** | PP-02 cache architecture Â· PP-04 Cache Service Â· PP-05C `CacheRepository` Â· PP-08 `cache_lookup` stage |
| **Deliverables** | [pp-09/09-cache-layer-design-audit.md](pp-09/09-cache-layer-design-audit.md) â€” ports, key composition, hit/miss lifecycle, invalidation, orchestrator integration |
| **Acceptance** | Design complete; consistent with G-15, G-30â€“G-33; no runtime cache code |
| **Status** | **COMPLETE** |
| **Docs** | [pp-09/README.md](pp-09/README.md) |

---

## Phase 13a â€” Cache Layer Design Hardening (PP-09A.1)

**Goal:** Close PP-09A independent audit conditions â€” documentation only.

| Item | Detail |
|---|---|
| **Dependencies** | PP-09A |
| **Deliverables** | Fingerprint runtime prerequisite, canonical G-33/`cache_corrupt` semantics, roadmap wording sync |
| **Acceptance** | All PP-09 docs consistent; no runtime cache code |
| **Status** | **COMPLETE** |
| **Docs** | [pp-09/09a1-cache-layer-design-hardening.md](pp-09/09a1-cache-layer-design-hardening.md) |

---

## Phase 13b â€” Cache Layer Implementation (PP-09B)

**Goal:** Cache Service runtime, orchestrator delegate port, `executeCacheLookupStage` â€” fingerprint-driven lookup before Core Analysis.

| Item | Detail |
|---|---|
| **Dependencies** | PP-09A Â· PP-09A.1 approved Â· PP-05C Â· PP-08 orchestrator |
| **PP-04 requires** | Cache Service Â· G-30â€“G-33 |
| **Deliverables** | `CacheCoordinator`, `CachePort`, stage runner, unit + orchestration tests |
| **Acceptance** | Cache hit skips `core_analysis`; per-user scope enforced; corrupt â†’ invalidate â†’ miss (G-33); `cache_corrupt` only on invalidation failure |
| **Deferred** | Global cache sharing; LinkMetadataCache adapter; write path full wiring (PP-10) |
| **Status** | **COMPLETE** |
| **Docs** | [pp-09/README.md](pp-09/README.md) Â· runtime under `src/server/cache/` |

---

## Phase 14a â€” Core Analysis Design Audit (PP-10A)

**Goal:** Documentation-only blueprint for Core Analysis before any runtime work â€” coordinator, mock provider, stage runner, persistence + cache write sequencing.

| Item | Detail |
|---|---|
| **Dependencies** | PP-09B Â· PP-08 Â· PP-05C Â· PP-03 contracts |
| **PP-04 requires** | Core Analysis service boundary (04C Â§6) Â· G-06 Â· G-07 |
| **Deliverables** | [pp-10/README.md](pp-10/README.md) Â· [10-core-analysis-design-audit.md](pp-10/10-core-analysis-design-audit.md) Â· [input assembly matrix](pp-10/10a-input-assembly-matrix.md) |
| **Acceptance** | Component boundaries; Option B port strategy; persistence ownership; PP-09 cache write integration; failure model; fingerprint dependency; test strategy; no runtime code |
| **Deferred** | Fingerprint runtime; real AI; UI; Package Engine |
| **Status** | **COMPLETE** |

---

## Phase 14a1 â€” Core Analysis Design Hardening (PP-10A.1)

**Goal:** Close independent PP-10A documentation audit conditions â€” docs only.

| Item | Detail |
|---|---|
| **Dependencies** | PP-10A |
| **Deliverables** | [10a1-core-analysis-design-hardening.md](pp-10/10a1-core-analysis-design-hardening.md) Â· remediations in PP-10 package |
| **Acceptance** | Ownership, port path, upload assembly, fingerprint wording, matrix alignment verified |
| **Status** | **COMPLETE** |

---

## Phase 14 â€” Core Analysis (Mock Provider) (PP-10)

**Goal:** Mock reference analysis producing valid `ReferenceVideoAnalysis` snapshots on cache miss.

| Item | Detail |
|---|---|
| **Dependencies** | PP-10A Â· PP-10A.1 Â· PP-09B Â· PP-08 |
| **PP-04 requires** | Core Analysis service boundary Â· G-07 |
| **Design** | [pp-10/10-core-analysis-design-audit.md](pp-10/10-core-analysis-design-audit.md) |
| **Deliverables** | `CoreAnalysisCoordinator`, `MockAnalysisProvider`, `executeCoreAnalysisStage`, port adapter, unit + orchestration tests |
| **Acceptance** | Observed/inferred labels; insert + cache write on miss; no cache write on failure; packages consume analysis only (PP-13) |
| **Deferred** | Real AI (PP-12); fingerprint production E2E without test doubles |
| **Status** | **COMPLETE** |

---

## Phase 15 â€” Core Analysis UI & Workspace Integration (PP-11)

**Goal:** Project UI for intake, attestation, job status, analysis sections in workspace.

| Item | Detail |
|---|---|
| **Dependencies** | PP-10 |
| **PP-04 requires** | Workspace Composer Â· sequence diagrams |
| **Deliverables** | Project CTAs, analysis panels, extend workspace |
| **Acceptance** | E2E mock path; existing brief/workspace regression passes |
| **Deferred** | SEO/marketing panels |
| **Status** | NOT_STARTED |

---

## Phase 16 â€” Real AI Analysis Provider Boundary (PP-12)

**Goal:** Server-only AI provider for analysis behind env gate + cost caps.

| Item | Detail |
|---|---|
| **Dependencies** | PP-11, cost audit approval |
| **PP-04 requires** | Provider Layer Â· G-06 |
| **Deliverables** | Provider interface, mock/real swap, timeout, structured JSON validation |
| **Acceptance** | No browser keys; spend within test budget |
| **Deferred** | Multimodal frame pipeline if too costly |
| **Status** | NOT_STARTED |

---

## Phase 17 â€” Package Engine (Mock) (PP-13)

**Goal:** Blueprint + Prompt packages via shared Package contract (mock generators).

| Item | Detail |
|---|---|
| **Dependencies** | PP-10 |
| **PP-04 requires** | Package dependency graph Â· G-08â€“G-10 |
| **Deliverables** | Package Engine service, mock generators, extend `compiledPrompt` usage |
| **Acceptance** | Generators read ReferenceVideoAnalysis only; replace static workspace fixtures |
| **Deferred** | Real AI compilation |
| **Status** | NOT_STARTED |

---

## Phase 18 â€” Prompt Studio UI & Export (PP-14)

**Goal:** Copy/export JSON/text; transformation notice; provider tabs.

| Item | Detail |
|---|---|
| **Dependencies** | PP-13 |
| **PP-02 requires** | Prompt Package type approved |
| **Deliverables** | Prompt Studio UI, export actions |
| **Acceptance** | User can copy full package without generation |
| **Status** | NOT_STARTED |

---

## Phase 19 â€” Real Prompt Compilation Provider (PP-15)

**Goal:** AI-assisted compilation behind same boundary pattern as Phase 16.

| Item | Detail |
|---|---|
| **Dependencies** | PP-14, BYOK optional |
| **PP-02 requires** | Package Engine approved |
| **Deliverables** | Real compiler provider, cost tracking hooks |
| **Acceptance** | Schema-valid outputs; budget gate |
| **Notes** | **Replaces legacy "Phase 12 AI Provider Boundary"** â€” split into analysis (11) and compilation (14) |
| **Status** | NOT_STARTED |

---

## Phase 20 â€” Marketing & Hook Analysis Module (PP-16)

**Goal:** Marketing Package from analysis snapshot (hooks, retention, audience).

| Item | Detail |
|---|---|
| **Dependencies** | PP-12 |
| **PP-02 requires** | Marketing Package type approved |
| **Deliverables** | Marketing package generator + UI section |
| **Acceptance** | MVP+ feature; independently testable |
| **Status** | NOT_STARTED |

---

## Phase 21 â€” SEO Engine (PP-17)

**Goal:** SEO Package â€” title, meta, keywords, tags, publishing checklist.

| Item | Detail |
|---|---|
| **Dependencies** | PP-12 |
| **PP-02 requires** | SEO Package type approved |
| **Deliverables** | SEO generator + UI |
| **Acceptance** | Exportable SEO package |
| **Status** | NOT_STARTED |

---

## Phase 22 â€” Repurposing Engine (PP-18)

**Goal:** Repurposing Package â€” blog, LinkedIn, reel script, course outline.

| Item | Detail |
|---|---|
| **Dependencies** | PP-15 |
| **PP-02 requires** | Repurposing Package type approved |
| **Deliverables** | Repurposing templates, UI section |
| **Acceptance** | At least two formats in first release |
| **Status** | NOT_STARTED |

---

## Phase 23 â€” Credits, Cost Controls & Usage Tracking (PP-19)

**Goal:** Credit ledger, usage events, per-user limits, cost dashboard (internal).

| Item | Detail |
|---|---|
| **Dependencies** | PP-12, PP-15 |
| **PP-02 requires** | Pipeline history Â· job metrics |
| **Deliverables** | Credits table, enforcement middleware, metrics from Phase 1-G |
| **Acceptance** | Limits enforced; no payment yet |
| **Status** | NOT_STARTED |

---

## Phase 24 â€” BYOK & Feature Flags (PP-20)

**Goal:** User API key storage; gradual feature rollout.

| Item | Detail |
|---|---|
| **Dependencies** | PP-19 |
| **Deliverables** | Encrypted key storage, settings UI, flag registry |
| **Acceptance** | Keys never in client; flags toggle modules |
| **Status** | NOT_STARTED |

---

## Phase 25 â€” Localhost Acceptance, Deploy & Launch (PP-21)

**Goal:** Full MVP sign-off, security review, and hosted deploy **only with explicit human approval**.

| Item | Detail |
|---|---|
| **Dependencies** | PP-11, PP-14 minimum; budget approval for deploy |
| **Deliverables** | Acceptance script, security checklist, manual UX sign-off; Vercel + Supabase hosted when approved |
| **Acceptance** | All MVP AC from Phase 1-F met; smoke tests on production URL; rollback plan |
| **Deferred** | App store, mobile; multi-platform link intake until legal approval |
| **Status** | NOT_STARTED |
| **Notes** | Multi-platform link intake (IG/FB/TikTok) requires **OFFICIAL PLATFORM RESEARCH** â€” extend Phase 5 after Phase 20 if approved |

---

## Legacy phase mapping

| Legacy phase | Pivot disposition |
|---|---|
| 0â€“11-B | **DONE** â€” reuse |
| Legacy 12 (AI boundary) | Split into Phases 11 and 14 |
| Legacy 13â€“16 (plan, scenes, compiler, bible) | Absorbed into Phases 9â€“14 via Package Engine |
| Legacy 17â€“19 (URL, extraction, planning) | Replaced by Phases 5â€“11 (video-first) |
| PP-02 (Phase 2) | Domain architecture â€” canonical language before implementation |
| Legacy 20+ | Mapped to Phases 15â€“20 or deferred |

---

## Document maintenance

When a pivot phase completes, update **Status** here and add evidence to a pivot phase log (future: `docs/pivot/phase-log.md`). Do not mark phases DONE without verification gates from [implementation-checklist.md](implementation-checklist.md) global requirements.
