# PP-11A — UI Component Plan

**Status:** Supporting document for [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md)  
**Scope:** New UI components only — documentation

Existing workspace components (`workspace-overview.tsx`, etc.) are **reused** per [11a-view-model-matrix.md](11a-view-model-matrix.md). This document lists **new** components only.

---

## Project page components

### `reference-intake-form.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/projects/reference-intake-form.tsx` |
| **Responsibility** | Capture pivot reference submission by kind (tabs or selector for youtube / transcript / script / upload) |
| **Dependencies** | `createReferenceAction`, `startAnalysisJobAction`, `ReferenceKind` constants, shared form UI (`Label`, `Input`, `Textarea`, `SubmitButton`) |
| **Reused components** | `SubmitButton`, `Label`, `Input`, `Textarea`, `BriefActionMessage` pattern |
| **Ownership** | Presentation only — no repository imports |
| **Tests** | Render + validation messages; kind-specific field visibility; submit calls action (mocked) |

---

### `rights-attestation-form.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/projects/rights-attestation-form.tsx` |
| **Responsibility** | Display attestation copy; checkbox acceptance; version constant |
| **Dependencies** | `recordAttestationAction` or combined with reference submit |
| **Reused components** | `Label`, checkbox input, alert for policy text |
| **Ownership** | Presentation only |
| **Tests** | Required checkbox blocks submit; success state |

---

### `job-status-panel.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/projects/job-status-panel.tsx` |
| **Responsibility** | Show active job state, progress bar from `progressPercent`, failure details, link to workspace when `completed` |
| **Dependencies** | `JobRecord` display DTO from page loader or `getJobStatusAction` |
| **Reused components** | `Alert`, `Button`, progress UI (existing shadcn if available) |
| **Ownership** | Presentation only — maps failure codes to copy table (no remapping of codes) |
| **Tests** | Renders each terminal/active state from fixtures; no fake generation animation (G-23) |

---

### `reference-kind-selector.tsx` (optional extract)

| Field | Detail |
|-------|--------|
| **Location** | `src/components/projects/reference-kind-selector.tsx` |
| **Responsibility** | Radio/tab selector for five `ReferenceKind` values |
| **Dependencies** | `REFERENCE_KINDS`, user-facing labels (not slugs) |
| **Reused components** | Brief wizard radio pattern from `source-step-form.tsx` |
| **Ownership** | Presentation |
| **Tests** | Kind switch shows correct fields |

---

## Workspace analysis components

### `workspace-analysis-section.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-section.tsx` |
| **Responsibility** | Container for analysis sub-panels; empty/loading/failure shells |
| **Dependencies** | `AnalysisViewModel`, `WorkspaceIntelligenceSnapshot` job hint |
| **Reused components** | `WorkspaceSectionHeading`, `WorkspaceEmptyState`, `WorkspaceEvaluationBadge` |
| **Ownership** | Presentation |
| **Tests** | Empty states; renders sub-panels when model present |

---

### `workspace-analysis-metadata.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-metadata.tsx` |
| **Responsibility** | Title, platform, duration, author, access status, language |
| **Dependencies** | `AnalysisViewModel.metadata` |
| **Reused components** | `WorkspaceEvaluationBadge` for observed fields |
| **Tests** | Renders fixture metadata; omits internal IDs |

---

### `workspace-analysis-media.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-media.tsx` |
| **Responsibility** | Media kind, resolution, tracks — **no storage locator** |
| **Dependencies** | `AnalysisViewModel.media` |
| **Tests** | Assert storage locator never rendered |

---

### `workspace-analysis-transcript.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-transcript.tsx` |
| **Responsibility** | Transcript text and optional segment list |
| **Dependencies** | `AnalysisViewModel.transcript` |
| **Tests** | Empty transcript copy; segment rendering |

---

### `workspace-analysis-timeline.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-timeline.tsx` |
| **Responsibility** | Timeline segments, pacing label |
| **Dependencies** | `AnalysisViewModel.timeline` |
| **Tests** | Segment list from fixture |

---

### `workspace-analysis-scenes.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-scenes.tsx` |
| **Responsibility** | Analysis scene segments (distinct from brief scene roadmap) |
| **Dependencies** | `AnalysisViewModel.scenes` |
| **Tests** | Confidence badges per segment |

---

### `workspace-analysis-story.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-story.tsx` |
| **Responsibility** | Story, hooks, audience, CTA blocks |
| **Dependencies** | `AnalysisViewModel.story`, `.hooks`, `.audience`, `.cta` |
| **Tests** | Derived badge on story fields |

---

### `workspace-analysis-production.tsx`

| Field | Detail |
|-------|--------|
| **Location** | `src/components/workspace/workspace-analysis-production.tsx` |
| **Responsibility** | Camera and editing patterns |
| **Dependencies** | `AnalysisViewModel.camera`, `.editing` |
| **Tests** | Renders fixture production sections |

---

## Modified existing components (not new files)

| File | Change |
|------|--------|
| `workspace-shell.tsx` | Add `analysis` case in `renderActiveSection`; accept extended view model type |
| `workspace-section-nav.tsx` | Add `analysis` link |
| `workspace-overview.tsx` | Optional analysis summary chip |
| `workspace-preview-notice.tsx` | Extend truthfulness copy when analysis present |

---

## Upload UI (Slice 7 — deferred sub-plan)

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `reference-upload-intake.tsx` | `src/components/projects/reference-upload-intake.tsx` | Client upload flow against `/api/projects/.../uploads` |

Detailed in PP-07B; referenced here for component inventory completeness.

---

## Component ownership summary

| Layer | May import repositories? |
|-------|--------------------------|
| `src/components/**` | **No** — props and actions only |
| `src/app/**/page.tsx` | Wires services only |
| Server actions | Repositories + trigger service |

---

## Accessibility and product rules

- Use existing layout primitives (`PageContainer`, `SectionHeading`)
- Progress UI must not imply video generation (G-23)
- User-facing name: **Prompt Pilot** — not machine slugs
- Provider-neutral language in analysis display

---

## Test file plan

| File | Scope |
|------|-------|
| `tests/workspace/analysisViewModel.spec.ts` | Mapper (Slice 1) |
| `tests/workspace/workspaceComposer.spec.ts` | Composer service |
| `tests/workspace/workspaceAnalysisComponents.spec.tsx` | Optional render tests from fixture |
| `tests/projects/referenceIntake.spec.ts` | Action validation unit tests |

---

## Consistency affirmation

- [x] No component imports `CoreAnalysisCoordinator` or providers
- [x] Analysis components consume view-model only
- [x] Job status reads display DTO only
