# PP-11 — Core Analysis UI & Workspace Integration

**Status:** DESIGN COMPLETE (PP-11A) · Implementation **NOT STARTED** (PP-11)  
**Design:** [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md)  
**Dependencies:** PP-10 (frozen) · PP-04 Workspace Composer · PP-05C persistence · PP-08 orchestration · PP-09B cache

---

## Purpose

PP-11 delivers **project UI and workspace integration** for Core Analysis: reference intake, rights attestation, job status, and **analysis sections** in the workspace. PP-11 **reads** persisted `ReferenceVideoAnalysis` output from PP-10; it does **not** redesign analysis runtime, providers, or orchestration internals.

This track is **not** Real AI (PP-12), Package Engine (PP-13), Prompt Studio (PP-14), or SEO/marketing panels (deferred).

---

## Naming note

| ID | Meaning |
|----|---------|
| **PP-11A** | Workspace & UI Integration Design Audit — **COMPLETE** |
| **PP-11** | Core Analysis UI & Workspace Integration — **NOT STARTED** |
| **PP-12** | Real AI Analysis Provider Boundary |

---

## Phase objectives

| Phase | Goal | Status |
|-------|------|--------|
| **PP-11A** | Lock architecture, view-model matrix, intake matrix, composer, server actions, UI plan, test slices | **COMPLETE** |
| **PP-11** | Implement Composer, analysis UI, intake/attestation, job status, pipeline trigger boundary | **NOT STARTED** |

---

## Dependency diagram

```text
                    ┌─────────────────────────────────────┐
                    │  PP-10 (FROZEN)                     │
                    │  executeCoreAnalysisStage           │
                    │  CoreAnalysisCoordinator            │
                    │  MockAnalysisProvider               │
                    │  AnalysisRepository + Cache write   │
                    └──────────────┬──────────────────────┘
                                   │ produces ReferenceVideoAnalysis
                                   ▼
┌──────────────┐    write     ┌────────────────────┐    read    ┌─────────────────────┐
│ Project UI   │─────────────►│ Persistence layer  │◄───────────│ Workspace Composer  │
│ intake       │              │ Reference, Job,    │            │ (read-only)         │
│ attestation  │              │ Analysis, Package  │            └──────────┬──────────┘
│ job status   │              └─────────┬──────────┘                       │
└──────┬───────┘                        │                                  ▼
       │                                │                       ┌─────────────────────┐
       │ trigger                        │                       │ Workspace UI        │
       ▼                                │                       │ analysis + hybrid   │
┌──────────────────────┐               │                       └─────────────────────┘
│ Pipeline trigger     │───────────────┘
│ (server boundary)    │
│ JobOrchestrator      │
│ stage runners        │
└──────────────────────┘
```

**Read path (display):** Workspace page → Workspace Composer → `WorkspaceRepository.getIntelligenceBundle()` → analysis view-model mapper → UI.

**Write path (production):** Project page → server actions → repositories + pipeline trigger → PP-10 stages → persisted analysis.

---

## Document index

| Document | Scope |
|----------|--------|
| [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md) | Primary architecture, flows, ownership, non-goals |
| [11a-view-model-matrix.md](11a-view-model-matrix.md) | Section-by-section data source, mapper, UI, states |
| [11a-reference-intake-matrix.md](11a-reference-intake-matrix.md) | Per-`ReferenceKind` intake, validation, trigger |
| [11a-workspace-composer-design.md](11a-workspace-composer-design.md) | Composer-only specification |
| [11a-ui-component-plan.md](11a-ui-component-plan.md) | New UI components and test expectations |
| [11a-server-action-design.md](11a-server-action-design.md) | Server actions and trigger boundary |
| [11a-testing-strategy.md](11a-testing-strategy.md) | Implementation slices and verification |

---

## PP-10 boundaries (locked — do not change in PP-11)

| Rule | Detail |
|------|--------|
| G-06 | Provider interprets only; coordinator persists analysis and writes cache |
| Option B | Runtime path: `executeCoreAnalysisStage` → coordinator directly; port is DI-only |
| Thin port | `AnalysisProviderPort` unchanged; UI never calls it for display |
| Orchestrator | `JobOrchestrator` owns workflow; Composer never starts jobs |
| Schema | `ReferenceVideoAnalysisSchema` unchanged; display uses MVP subset only |
| Cache | Cache write on analysis miss remains coordinator-owned |

---

## Verification checklist (design — PP-11A)

- [x] Overall PP-11 architecture documented
- [x] Read path vs write path separated
- [x] Workspace Composer ownership locked (read-only)
- [x] Analysis view-model ownership defined
- [x] Reference intake + attestation ownership defined
- [x] Job status ownership defined
- [x] Server action boundaries defined
- [x] Orchestration trigger boundary defined (separate from Composer)
- [x] View-model matrix complete
- [x] Reference intake matrix complete
- [x] UI component plan complete
- [x] Testing slices defined
- [x] Cross-document consistency verified
- [x] PP-10 reuse explicit
- [ ] Human approval recorded for PP-11 implementation

---

## Verification (implementation — PP-11, future)

```bash
npm run typecheck
npm test -- tests/workspace
npm test -- tests/analysis tests/orchestration
npm run build
```

| Check | Target |
|-------|--------|
| Analysis display from persisted bundle | PASS |
| E2E mock path (trigger → analysis row) | PASS |
| Brief + hybrid workspace regression | PASS |
| No UI call to CoreAnalysisCoordinator | PASS |
| Full project build | PASS |

---

## Final audit — PP-11 readiness assessment

See [11-workspace-ui-design-audit.md § Final audit](11-workspace-ui-design-audit.md#final-audit).

| Verdict | Detail |
|---------|--------|
| **PP-11A** | **COMPLETE** — blueprint locked |
| **PP-11 implementation** | **NOT READY** until prerequisites below are resolved |

### Unresolved questions (decisions locked in PP-11A)

| Question | PP-11A decision |
|----------|-----------------|
| Where does transcript/script text live before analysis? | Passed via trigger boundary as `intakeOverride`; persisted copy is `ReferenceVideoAnalysis.transcript` after run |
| Is `workspace_refresh` stage required for MVP? | **No** — workspace page load + Composer satisfies display |
| Single vs multiple analysis nav sections? | One **`analysis`** workspace section with internal sub-panels |

### Production dependencies (deferred)

- Real AI provider (PP-12)
- Production fingerprint runtime (test doubles OK for mock E2E)
- Background worker infrastructure
- Package Engine replacing static sections (PP-13)
- SEO/marketing workspace panels

### Implementation blockers (before PP-11 Slice 1)

| Blocker | Owner |
|---------|-------|
| Commit pivot baseline (domain, persistence, orchestration, cache, migration) | Prerequisite track |
| Fix upload module build (PP-07B) for video/audio intake slice | Prerequisite track |
| Implement `AttestationRepository` (design in server-action doc) | PP-11 Slice 4 |
| Implement pipeline trigger boundary | PP-11 Slice 6 |

### Recommended Slice 1

**Analysis view-model mapper** — pure transform from `ReferenceVideoAnalysis` fixture; no orchestration, no UI, no PP-10 changes. See [11a-testing-strategy.md](11a-testing-strategy.md).

---

## Next phase

**PP-11 implementation** begins only after human approval of this design package and resolution of prerequisite blockers listed above.
