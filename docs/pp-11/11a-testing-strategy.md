# PP-11A — Testing Strategy

**Status:** Supporting document for [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md)  
**Scope:** Implementation slices — documentation only

Slices are **small, independently verifiable**, and respect frozen PP-10 boundaries.

---

## Prerequisite slice (not PP-11 UI — parallel track)

| Item | Detail |
|------|--------|
| **Goal** | Reproducible pivot baseline + green build |
| **Source** | Commit domain, persistence, orchestration, cache, migration; fix upload module resolution |
| **Tests** | Existing `tests/orchestration/`, `tests/cache/`, `tests/analysis/` |
| **Verification** | `npm run typecheck`, `npm run build`, migration applied locally |
| **Regressions** | Full analysis + orchestration suites |

**Blocks:** Composer integration (Slice 2+), upload intake (Slice 7).

---

## Slice 1 — Analysis view-model mapper

| Item | Detail |
|------|--------|
| **Goal** | Pure display projection from canonical analysis |
| **New source files** | `src/server/workspace/analysis-view-model.ts`, `src/domain/workspace/analysis-display.ts` (types optional) |
| **New tests** | `tests/workspace/analysisViewModel.spec.ts` |
| **Verification** | Maps `validReferenceVideoAnalysisFixture` to MVP panels; strips `storageLocator`; confidence badges correct |
| **Regressions** | None expected |
| **PP-10 touch** | None |

---

## Slice 2 — Workspace Composer service

| Item | Detail |
|------|--------|
| **Goal** | Read-only composer replacing mock service loader path |
| **New source files** | `src/server/workspace/workspace-composer-service.ts`, `src/server/workspace/index.ts` |
| **New tests** | `tests/workspace/workspaceComposer.spec.ts` |
| **Verification** | Bundle with/without analysis; brief required path; section normalization; hybrid engines still run |
| **Regressions** | `tests/workspace/mockResultWorkspaceService.spec.ts`, `mockResultWorkspaceTruthfulness.spec.ts` |
| **Depends on** | Prerequisite slice for committed repositories (or in-memory doubles in tests) |

---

## Slice 3 — Workspace analysis UI

| Item | Detail |
|------|--------|
| **Goal** | Analysis section visible in workspace |
| **New source files** | `workspace-analysis-*.tsx` (see UI plan); modify `workspace-shell.tsx`, `workspace-section-nav.tsx`, `workspace/page.tsx`, `mockResultWorkspace.ts` (sections), `result-workspace.ts` (labels) |
| **New tests** | `tests/workspace/workspaceAnalysisComponents.spec.tsx` (optional); extend truthfulness tests |
| **Verification** | Manual + render tests from fixture view-model; empty states; no fake generation |
| **Regressions** | All `tests/workspace/*` |
| **PP-10 touch** | None |

---

## Slice 4 — Reference intake + attestation

| Item | Detail |
|------|--------|
| **Goal** | Project page forms + server actions for transcript/script/youtube (no job run yet) |
| **New source files** | `reference/actions.ts`, `reference/form-state.ts`, `reference-intake-form.tsx`, `rights-attestation-form.tsx`, `AttestationRepository` interface + Supabase adapter |
| **New tests** | `tests/projects/referenceActions.spec.ts`, `tests/persistence/attestationRepository.spec.ts` |
| **Verification** | Zod validation; attestation + reference rows created |
| **Regressions** | `tests/briefs/*` |
| **PP-10 touch** | None |

---

## Slice 5 — Job status UI

| Item | Detail |
|------|--------|
| **Goal** | Display active job on project page |
| **New source files** | `job-status-panel.tsx`, `getJobStatusAction` |
| **New tests** | `tests/projects/jobStatusPanel.spec.ts` |
| **Verification** | Renders states from `JobRecord` fixtures; failure codes displayed faithfully |
| **Regressions** | None |
| **PP-10 touch** | None |

---

## Slice 6 — Pipeline trigger boundary (E2E mock path)

| Item | Detail |
|------|--------|
| **Goal** | Roadmap acceptance — intake → analysis row in DB |
| **New source files** | `pipeline-trigger-service.ts`, `startAnalysisJobAction`, trigger factory wiring |
| **New tests** | `tests/workspace/pipelineTrigger.spec.ts`, extend `tests/analysis/coreAnalysisOrchestration.spec.ts` pattern with in-memory registry |
| **Verification** | Transcript E2E: reference + job + analysis row + cache entry; workspace Composer reads analysis |
| **Regressions** | `tests/analysis/` (40), `tests/orchestration/`, `tests/cache/` |
| **PP-10 touch** | **None** — imports frozen stage runner only |

---

## Slice 7 — Upload intake UI (deferred within PP-11)

| Item | Detail |
|------|--------|
| **Goal** | Video/audio reference kinds |
| **New source files** | `reference-upload-intake.tsx`; wire upload actions |
| **New tests** | Upload route + intake integration |
| **Verification** | Complete upload → reference → trigger |
| **Regressions** | Upload + media tests |
| **Depends on** | Upload build fix (prerequisite) |

---

## Regression suite (run after each slice)

```bash
npm run typecheck
npm test -- tests/analysis/
npm test -- tests/workspace/
npm test -- tests/briefs/
npm test -- tests/orchestration/
npm test -- tests/cache/
npm run build   # after prerequisite slice
```

---

## Test principles

| Rule | Detail |
|------|--------|
| No UI → coordinator tests | Use persisted fixtures or Composer mocks |
| Golden fixture | `validReferenceVideoAnalysisFixture` for mapper and render tests |
| In-memory repos | `tests/cache/test-doubles.ts` pattern for trigger integration |
| Truthfulness | Extend `mockResultWorkspaceTruthfulness.spec.ts` for analysis notices |

---

## Slice dependency graph

```text
Prerequisite ──► Slice 1 (mapper)
                      │
                      ▼
                 Slice 2 (composer)
                      │
                      ▼
                 Slice 3 (analysis UI)
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
     Slice 4 (intake)        Slice 5 (job UI)
          │
          └───────────┬───────────┘
                      ▼
                 Slice 6 (trigger) ──► E2E acceptance
                      │
                      ▼
                 Slice 7 (upload) [optional last]
```

---

## Recommended start after PP-11A approval

**Slice 1 — Analysis view-model mapper** — zero orchestration, zero PP-10 changes, independently shippable.

---

## Consistency affirmation

- [x] No slice modifies `src/server/analysis/*`
- [x] Trigger slice calls `executeCoreAnalysisStage` only from trigger service
- [x] Composer slice read-only
