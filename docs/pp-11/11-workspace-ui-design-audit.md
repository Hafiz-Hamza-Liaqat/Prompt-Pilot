# PP-11A — Workspace & UI Integration Design Audit

**Status:** Design complete (documentation only)  
**Scope:** Core Analysis UI & Workspace Integration (PP-11)  
**Baseline:** PP-10 frozen (`src/server/analysis/`) · PP-04C §15 Workspace Composer · readiness audit 2026-07-07

---

## 1. Overall PP-11 architecture

PP-11 adds **two runtime surfaces** on top of frozen PP-10:

| Surface | Purpose | Touches PP-10? |
|---------|---------|----------------|
| **Project page** | Reference intake, rights attestation, job status, CTA to workspace | No |
| **Workspace page** | Analysis display + existing hybrid brief engines | No (read only) |
| **Pipeline trigger boundary** | Starts jobs, runs stage runners in-process for mock E2E | Uses PP-10 stage runner; does not modify PP-10 modules |

PP-11 **never** invokes `CoreAnalysisCoordinator`, `MockAnalysisProvider`, or `AnalysisProviderPort` from UI components or Workspace Composer. Display reads **`ReferenceVideoAnalysis`** via `WorkspaceRepository.getIntelligenceBundle()`.

### Layer model

```text
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js App Router)                                   │
│  project/page.tsx          workspace/page.tsx                   │
│  intake · attestation ·    WorkspaceShell + section components  │
│  job status panel                                               │
└────────────┬───────────────────────────────┬──────────────────────┘
             │ server actions               │ page loader
             ▼                              ▼
┌────────────────────────┐    ┌──────────────────────────────────┐
│ Write boundary         │    │ Workspace Composer (read-only)    │
│ reference actions      │    │ analysis-view-model mapper        │
│ pipeline trigger       │    │ + hybrid engines (brief path)   │
└────────────┬───────────┘    └──────────────┬───────────────────┘
             │                               │
             ▼                               ▼
┌────────────────────────┐    ┌──────────────────────────────────┐
│ JobOrchestrator        │    │ WorkspaceRepository              │
│ stage runners          │    │ Reference · Analysis · Job read  │
│ (includes PP-10 stage) │    │ Package read                     │
└────────────┬───────────┘    └──────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PP-10 FROZEN: executeCoreAnalysisStage → CoreAnalysisCoordinator│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Runtime flow

### 2.1 End-to-end (write + read)

```text
Project Page
      ↓
Reference Intake (form + attestation)
      ↓
Server Action / Trigger Boundary
      ↓
ReferenceRepository.insert · AttestationRepository.insert · JobRepository.create
      ↓
JobOrchestrator.start()
      ↓
Stage runners (validation → … → cache_lookup → core_analysis → …)
      ↓
PP-10: executeCoreAnalysisStage → CoreAnalysisCoordinator → persist + cache write
      ↓
AnalysisRepository row available
      ↓
WorkspaceRepository.getIntelligenceBundle()   [read path — separate request]
      ↓
Workspace Composer
      ↓
Analysis view-model mapper
      ↓
Workspace UI (analysis section)
```

### 2.2 Read path only (workspace visit)

```text
User opens /projects/{id}/workspace
      ↓
workspace/page.tsx authenticates + builds Composer deps
      ↓
WorkspaceComposerService.loadViewModel(userId, projectId, section)
      ↓
WorkspaceRepository.getIntelligenceBundle(scope)
      ↓
If analysis present → map to AnalysisViewModel
If absent → analysis section empty state; hybrid sections unchanged
      ↓
WorkspaceShell renders active section
```

### 2.3 PP-11 vs PP-10

| Concern | PP-10 | PP-11 |
|---------|-------|-------|
| Produce analysis | Yes — coordinator + provider | No |
| Display analysis | No | Yes — Composer read path |
| Start jobs | No (tests only today) | Yes — trigger boundary |
| Cache write | Coordinator on miss | None |
| Intake assembly for provider | Stage `intakeOverride` + empty base intake | Trigger boundary supplies `intakeOverride` per kind |

---

## 3. Workspace Composer responsibilities

Mirrors PP-04C §15 and `mock-result-workspace-service.ts` pattern.

| Responsibility | Detail |
|----------------|--------|
| Load project + brief (when completed) | Same as mock service today |
| Load intelligence bundle | `WorkspaceRepository.getIntelligenceBundle()` |
| Map analysis to display view-model | Delegates to `mapAnalysisToViewModel()` |
| Run hybrid deterministic engines | Scene decomposition, complexity/risk, provider recommendations when brief exists |
| Merge static fixture sections | Prompts, continuity, audio-editing remain static until PP-13 |
| Section routing | Normalize `section` query param; expose `activeSection` |
| Truthfulness metadata | Section origins, badges, notices per `result-workspace.ts` |

| Must never do | Reason |
|---------------|--------|
| Start or retry jobs | Orchestrator ownership |
| Write analysis, cache, or packages | G-06 / repository boundaries |
| Call providers or coordinator | Display reads persistence only |
| Imply video generation | G-23 |

Full specification: [11a-workspace-composer-design.md](11a-workspace-composer-design.md).

---

## 4. Analysis view-model ownership

| Layer | Owner | Artifact |
|-------|-------|----------|
| Canonical analysis | PP-10 / persistence | `ReferenceVideoAnalysis` |
| Display projection | PP-11 mapper | `AnalysisViewModel` (new type in `src/domain/workspace/` or `src/server/workspace/`) |
| UI rendering | PP-11 components | `workspace-analysis-*.tsx` |

**Mapper rules:**

- Input: `ReferenceVideoAnalysis` (from bundle)
- Output: MVP display subset per PP-10A §9.3
- Strip internal fields: `media.storageLocator`, raw fingerprint inputs not meant for users
- Preserve confidence classifications for badge rendering
- Do not relax schema — mapper omits sections, never mutates canonical shape

---

## 5. Reference intake ownership

| Concern | Owner |
|---------|-------|
| Form UX | Project page components |
| Client validation | Zod schemas colocated with actions (brief pattern) |
| Reference row create | `createReferenceAction` → `ReferenceRepository.insert` |
| URL normalization | Link module (`url-normalizer.ts`) in action or trigger prep |
| Upload session | Upload coordinator (PP-07B) — separate from reference create for uploads |
| Text body (transcript/script) | **Not stored on Reference row** — passed to trigger as `intakeOverride` at job start |
| Attestation link | `rightsAttestationId` on `CreateReferenceInput` |

Brief wizard (`source-step-form.tsx`) remains **parallel** — legacy `WizardSourceType`, not pivot `ReferenceKind`.

---

## 6. Rights attestation ownership

| Concern | Owner |
|---------|-------|
| UI capture | `rights-attestation-form.tsx` on project page |
| Persist attestation | `recordAttestationAction` → **`AttestationRepository.insert`** (new, thin) |
| Link to reference | `rightsAttestationId` on reference create |
| Enforcement | Orchestration validation stage may emit `attestation_missing`; UI surfaces remediation |

**Schema today:** `rights_attestations` table in pivot migration. **Gap:** no repository interface yet — defined in [11a-server-action-design.md](11a-server-action-design.md).

Attestation is **required** for all reference kinds before pipeline trigger.

---

## 7. Job status ownership

| Concern | Owner |
|---------|-------|
| Display | `job-status-panel.tsx` on project page |
| Read model | `JobRepository.getActiveByProject` via `getJobStatusAction` or RSC loader |
| Poll / refresh | Server action poll or page revalidation after trigger |
| Failure display | Render `JobRecord.failure` code/message; map to user copy — **no remapping** of PP-10 codes |
| Retry | **PP-11 MVP:** link to re-submit intake; full retry orchestration deferred unless `retry_pending` handler added in trigger |

Job status UI must **not** show synthetic analysis progress or fake generation (G-23).

---

## 8. Workspace rendering

### 8.1 Section model

Extend `WORKSPACE_SECTIONS` with **`analysis`** (new). Existing sections unchanged.

| Section | PP-11 behavior |
|---------|----------------|
| `overview` | Existing; add analysis summary chip when bundle has analysis |
| `analysis` | **New** — sub-panels from `AnalysisViewModel` |
| `providers`, `scenes`, `quality` | Existing hybrid engines when brief complete |
| `prompts`, `continuity`, `audio-editing` | Static fixture until PP-13 |

### 8.2 Workspace page loader

Replace direct `createMockResultWorkspaceService` call with:

1. `createWorkspaceComposerService(deps)` when bundle may exist
2. Fallback to mock service behavior when pivot registry unavailable (dev flag) — **optional**; prefer single Composer path after prerequisites committed

### 8.3 Badges and notices

Reuse `workspace-evaluation-badge.tsx`, `workspace-sample-badge.tsx`, `workspace-section-heading.tsx`. Analysis uses **observed / derived / unsupported** labels per PP-10A §9.4 — not sample badges unless section is still static fixture.

---

## 9. Empty states

| Condition | UI behavior |
|-----------|-------------|
| No reference | Project page: prompt to add reference; workspace analysis section: "No reference submitted" |
| Reference, no job | "Analysis not started" + CTA to project page |
| Job in progress | Job status on project page; analysis section: "Analysis in progress" — **no partial analysis fabrications** |
| Job failed | Project page failure panel; analysis section: failure summary + remediation link |
| Job complete, no analysis row | Rare error state — "Analysis unavailable" (support message) |
| Analysis present | Full MVP panels |
| Brief incomplete | Workspace redirect unchanged (`brief_required`) for hybrid sections; analysis section may still show if reference+analysis exist |

---

## 10. Loading states

| Surface | Pattern |
|---------|---------|
| Project page RSC | Next.js `loading.tsx` optional; job panel skeleton after trigger |
| Workspace page RSC | Server-rendered Composer load — no client spinner required for MVP |
| Post-trigger | `revalidatePath` project + workspace; job panel shows active state |
| Poll action | Returns `{ job, updatedAt }` — client may poll every N seconds while job active (optional enhancement) |

---

## 11. Failure states

Display persisted `JobFailure` only — do not invent codes.

| Code category | Example codes | UI treatment |
|---------------|---------------|--------------|
| Validation | `invalid_url`, `unsupported_platform`, `file_too_large` | Intake remediation hints |
| Access | `private_content`, `geo_blocked` | Explain access limitation |
| Rights | `attestation_missing`, `policy_blocked` | Attestation form emphasis |
| Processing | `analysis_failed`, `transcription_failed` | Retry CTA |
| Infrastructure | `storage_error`, `timeout`, `worker_unavailable` | Retry + support note |
| Cache | `cache_corrupt` | Retry analysis |

Form validation errors use action field errors (brief pattern), not job failure records.

---

## 12. Retry behavior

| Scenario | PP-11 MVP |
|----------|-----------|
| `retry_pending` job | Show failure + "Try again" → new trigger (new job or retry API — trigger boundary decides) |
| User edits intake | New reference + new job (append-only analysis versions) |
| Cache hit skip | Transparent — user sees completed analysis; no special UI |
| Coordinator failure after partial persist | PP-10 guarantees no cache write on failure; UI shows failed job |

Full orchestrator `resume`/`retry` APIs exist in domain — trigger boundary may wire incrementally in Slice 6.

---

## 13. Repository ownership

| Repository | PP-11 read | PP-11 write | Notes |
|------------|------------|-------------|-------|
| `ReferenceRepository` | Composer (via bundle) | Intake action | Metadata only |
| `AnalysisRepository` | Composer (via bundle) | **Never** — PP-10 coordinator only | |
| `JobRepository` | Job status | Trigger boundary | |
| `PackageRepository` | Composer (via bundle) | Never in PP-11 | Empty until PP-13 |
| `AttestationRepository` | Optional read | Attestation action | **New interface** |
| `UploadSessionRepository` | — | Upload flow (PP-07B) | |
| `WorkspaceRepository` | Composer | Never | Read aggregate |
| Project / brief repos | Composer | Unchanged | Legacy path |

---

## 14. Server action boundaries

All write actions live under `src/app/projects/[projectId]/reference/actions.ts` (or equivalent). Pattern mirrors `brief/actions.ts`: `'use server'`, `requireUserResult`, Zod validation, `revalidatePath`.

| Action | Writes | Orchestration |
|--------|--------|---------------|
| `recordAttestationAction` | Attestation row | None |
| `createReferenceAction` | Reference row | None |
| `startAnalysisJobAction` | Job row + trigger | **Yes** — calls trigger service |
| `getJobStatusAction` | None | None — read only |

Detail: [11a-server-action-design.md](11a-server-action-design.md).

---

## 15. Orchestration trigger boundary

**New module (PP-11):** `src/server/workspace/pipeline-trigger-service.ts` (name locked in testing strategy).

| Responsibility | Detail |
|----------------|--------|
| Create orchestration context | After `JobRepository.create` + `JobOrchestrator.start` |
| Run stages in-process | Loop `getNextStage` → delegate to existing stage runners |
| Assemble `intakeOverride` | Per reference kind before `executeCoreAnalysisStage` |
| Inject fingerprint test doubles | Mock E2E until fingerprint runtime (same as analysis tests) |
| Return outcome | `{ jobId, analysisId?, terminalState }` to action |

**Does not belong in:** UI components, Workspace Composer, or PP-10 modules.

Stage runners reused (existing code):

- `executeLinkIntelligenceStage`
- `executeCacheLookupStage`
- `executeCoreAnalysisStage` (PP-10 frozen)
- Upload/media paths via upload coordinator where applicable

`workspace_refresh` orchestration stage is **not implemented** in PP-11 — page load replaces it for MVP.

---

## 16. Dependency injection pattern

Page-level wiring (matches `workspace/page.tsx` today):

```text
createSupabaseServerClient()
  → createSupabasePivotRepositoryRegistry(supabase)
  → createWorkspaceComposerService({
       workspaceRepository,
       projectRepository,
       briefRepository,
       providerCatalogueRepository,
       sceneDecompositionService,
       complexityRiskService,
       providerRecommendationService,
       staticFixture,           // until PP-13
     })
```

Trigger wiring (project actions only):

```text
createSupabasePivotRepositoryRegistry(supabase)
  → createAnalysisStack({ analysisRepository, cacheRepository, resolvePortInput })
  → createPipelineTriggerService({ orchestrator, stageRunners, analysisStack, … })
```

---

## 17. Non-goals

| Non-goal | Phase |
|----------|-------|
| Modify PP-10 analysis module | Frozen |
| Real AI analysis | PP-12 |
| Package generation UI | PP-13 |
| Replace static prompt/continuity sections | PP-13 |
| SEO / marketing panels | Deferred |
| `workspace_refresh` stage runner | Post-MVP |
| Production background workers | PP-21 |
| Fingerprint production runtime | Prerequisite for prod E2E |
| Merge brief wizard into reference intake | Out of scope |
| Browser-side analysis or provider keys | Forbidden (G-06) |
| New `JobFailureCode` values | Not required |

---

## 18. Cross-document consistency

| Topic | Resolution |
|-------|------------|
| Composer read-only | All docs agree — no writes, no orchestration, no providers |
| Trigger boundary | Server actions + `pipeline-trigger-service.ts` only |
| Analysis display | Always via bundle → mapper → UI |
| PP-10 reuse | Stage runner and coordinator unchanged; trigger calls runner |
| G-06 | UI/Composer never persist analysis |
| Failure handling | Display persisted codes; no new codes |
| Transcript/script text | `intakeOverride` at trigger; canonical copy in analysis after run |

---

## Final audit

### PP-11 readiness assessment

| Gate | Status |
|------|--------|
| PP-11A design complete | **PASS** |
| PP-10 frozen baseline verified | **PASS** |
| Architecture internally consistent | **PASS** |
| PP-11 implementation ready | **NOT READY** — prerequisites remain |

### Unresolved questions

All material questions **resolved in this package** (see README). Open **implementation** choices (not architecture):

- Exact poll interval for job status (optional UX)
- Whether Slice 6 uses single synchronous request or background continuation (mock path: synchronous acceptable)

### Production dependencies

- Pivot migration applied in target environment
- Fingerprint runtime for production pipeline
- Upload storage provider beyond memory
- Worker infrastructure for long-running jobs

### Implementation blockers

1. Commit pivot baseline (domain, persistence, orchestration, cache, migration)
2. Fix upload build (PP-07B) before upload intake slice
3. Implement `AttestationRepository`
4. Implement pipeline trigger service (Slice 6) for E2E acceptance

### Recommended Slice 1

**Analysis view-model mapper** — `mapAnalysisToViewModel()` + unit tests against `validReferenceVideoAnalysisFixture`. Zero PP-10 touch, zero UI, independently verifiable.

---

**PP-11A constraints honored:** Documentation only; no runtime code; PP-10 boundaries preserved.
