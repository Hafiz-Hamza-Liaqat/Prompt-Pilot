# PP-11A — View-Model Matrix

**Status:** Supporting document for [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md)  
**Scope:** Documentation only

Maps every workspace section to its data source, mapper, UI component, and UI states.

---

## Legend

| Column | Meaning |
|--------|---------|
| **Data source** | Origin of truth for rendered content |
| **Repository** | Persistence read path (Composer never writes) |
| **Mapper** | Function producing display DTO |
| **UI component** | React component file |
| **Empty / Loading / Failure** | Section-specific UI states |

**Section status:**

| Status | Meaning |
|--------|---------|
| **Existing** | Shipped today — behavior unchanged |
| **Reused** | Existing component extended or fed new data |
| **New** | PP-11 deliverable |
| **Deferred** | Not in PP-11 scope |

---

## Workspace navigation sections

### `overview`

| Field | Value |
|-------|-------|
| Status | **Existing** (extended) |
| Data source | `ProjectRecord`, `PartialVideoBriefDraft`, optional `Reference` + analysis summary from bundle |
| Repository | `project-repository`, `video-brief-repository`, `WorkspaceRepository` (summary only) |
| Mapper | `WorkspaceComposerService` — existing `mapProjectSummary`, `mapBriefSummary`; add `mapAnalysisSummary()` |
| UI component | `workspace-overview.tsx` (**Reused**) |
| Empty state | Brief incomplete → redirect unchanged; no analysis chip |
| Loading state | RSC page load |
| Failure state | `not_found`, `brief_required`, `persistence_error` — existing service codes |

---

### `analysis` (new top-level section)

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `ReferenceVideoAnalysis` from bundle |
| Repository | `WorkspaceRepository` → `AnalysisRepository.getLatestByReference` (via bundle) |
| Mapper | `mapAnalysisToViewModel()` in `analysis-view-model.ts` |
| UI component | `workspace-analysis-section.tsx` (container) + sub-panels below |
| Empty state | No reference / no analysis / job in progress — see sub-panels |
| Loading state | RSC; no fabricated partial analysis |
| Failure state | Active job `failed` / `retry_pending` — link to project job panel |

#### Sub-panel: Metadata

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `analysis.metadata` |
| Mapper | `mapAnalysisMetadataPanel()` |
| UI | `workspace-analysis-metadata.tsx` |
| Empty | Hidden when analysis null |
| Loading | Parent section loading |
| Failure | Parent job failure |

#### Sub-panel: Media summary

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `analysis.media` (excludes `storageLocator`) |
| Mapper | `mapAnalysisMediaPanel()` |
| UI | `workspace-analysis-media.tsx` |
| Empty | Hidden when analysis null |
| Notes | Upload locator never shown (internal) |

#### Sub-panel: Transcript

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `analysis.transcript` |
| Mapper | `mapAnalysisTranscriptPanel()` |
| UI | `workspace-analysis-transcript.tsx` |
| Empty | "No transcript available" when segments empty |
| Badges | `transcriptSource` → observed/platform label |

#### Sub-panel: Timeline & scenes

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `analysis.timeline`, `analysis.scenes` |
| Mapper | `mapAnalysisTimelinePanel()`, `mapAnalysisScenesPanel()` |
| UI | `workspace-analysis-timeline.tsx`, `workspace-analysis-scenes.tsx` |
| Empty | Zero segments → explanatory empty copy |
| Badges | Scene `confidence` per segment |

#### Sub-panel: Story, hooks, audience, CTA

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `analysis.story`, `analysis.hooks`, `analysis.audience`, `analysis.cta` |
| Mapper | `mapAnalysisStoryPanel()` |
| UI | `workspace-analysis-story.tsx` |
| Empty | Optional fields omitted; section shows available fields only |
| Badges | Derived content labeled |

#### Sub-panel: Camera & editing

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `analysis.camera`, `analysis.editing` |
| Mapper | `mapAnalysisProductionPanel()` |
| UI | `workspace-analysis-production.tsx` |
| Badges | Derived defaults from mock provider |

#### Sub-panel: Safety notice

| Field | Value |
|-------|-------|
| Status | **New** |
| Data source | `analysis.safety.transformationNotice` |
| Mapper | Pass-through |
| UI | Inline notice in analysis section header |
| Empty | Never empty when analysis exists (required schema field) |

#### Sub-panel: MVP+ (objects, characters, locations, lighting, emotions)

| Field | Value |
|-------|-------|
| Status | **Deferred** (collapsed optional accordion in PP-11 if time; otherwise omit from MVP UI) |
| Data source | `analysis.objects`, `characters`, `locations`, `lighting`, `emotions` |
| Mapper | `mapAnalysisExtendedPanel()` |
| UI | `workspace-analysis-extended.tsx` |
| Notes | Mock may return placeholders with `unsupported` confidence |

#### Sub-panel: SEO seeds

| Field | Value |
|-------|-------|
| Status | **Deferred** (roadmap: SEO panels deferred for PP-11) |
| Data source | `analysis.seoSeeds` |

---

### `providers`

| Field | Value |
|-------|-------|
| Status | **Existing** |
| Data source | Brief + provider catalogue via deterministic engine |
| Repository | `provider-catalogue-repository`, brief repo |
| Mapper | `createProviderRecommendationService` output (inside Composer) |
| UI | `workspace-provider-recommendations.tsx` (**Reused**) |
| Empty | Evaluation states from existing engine |
| Loading | RSC |
| Failure | Engine error → section notice |

**Note:** Recommendations remain **brief-driven**, not analysis-driven, in PP-11.

---

### `scenes`

| Field | Value |
|-------|-------|
| Status | **Existing** |
| Data source | Brief duration → scene decomposition service |
| Repository | Brief repo |
| Mapper | `createSceneDecompositionService` (Composer) |
| UI | `workspace-scene-roadmap.tsx` (**Reused**) |
| Empty | Existing evaluation states |
| Distinction | **Not** `analysis.scenes` — brief timing roadmap vs reference analysis scenes |

---

### `prompts`

| Field | Value |
|-------|-------|
| Status | **Existing** (static fixture) |
| Data source | `MockResultWorkspaceStaticFixture.samplePromptSections` |
| Repository | None — static fixture |
| Mapper | Composer passes fixture through |
| UI | `workspace-prompt-preview.tsx` (**Reused**) |
| Empty | N/A — fixture always present |
| Deferred replacement | PP-13 Package Engine |

---

### `continuity`

| Field | Value |
|-------|-------|
| Status | **Existing** (static fixture) |
| Data source | Static fixture |
| UI | `workspace-continuity-preview.tsx` (**Reused**) |
| Deferred | PP-13 |

---

### `audio-editing`

| Field | Value |
|-------|-------|
| Status | **Existing** (static fixture) |
| Data source | Static fixture |
| UI | `workspace-audio-editing-preview.tsx` (**Reused**) |
| Deferred | PP-13 / PP-14 |

---

### `quality`

| Field | Value |
|-------|-------|
| Status | **Existing** |
| Data source | Brief + scene decomposition → complexity/risk service |
| Mapper | `createComplexityRiskService` (Composer) |
| UI | `workspace-complexity-risk.tsx` (**Reused**) |
| Empty | Existing evaluation states |

---

## Shared chrome

| Element | Status | Source | UI |
|---------|--------|--------|-----|
| Section nav | **Reused** | `WORKSPACE_SECTIONS` + labels | `workspace-section-nav.tsx` — add `analysis` entry |
| Section heading | **Reused** | `WORKSPACE_SECTION_LABELS` | `workspace-section-heading.tsx` |
| Header | **Reused** | Project + brief title | `workspace-header.tsx` |
| Preview notice | **Reused** | `WORKSPACE_TRUTHFULNESS_NOTICES` — extend for analysis | `workspace-preview-notice.tsx` |
| Evaluation badge | **Reused** | Confidence / origin metadata | `workspace-evaluation-badge.tsx` |
| Sample badge | **Reused** | Static sections only | `workspace-sample-badge.tsx` |

---

## Project page (not workspace sections)

| Element | Status | Data source | Repository | UI |
|---------|--------|-------------|------------|-----|
| Reference intake | **New** | Form input | `ReferenceRepository` on submit | `reference-intake-form.tsx` |
| Rights attestation | **New** | Form checkbox + version | `AttestationRepository` | `rights-attestation-form.tsx` |
| Job status | **New** | `JobRecord` | `JobRepository.getActiveByProject` | `job-status-panel.tsx` |

---

## Mapper module ownership

| Module | Location (planned) | Input | Output |
|--------|-------------------|-------|--------|
| `mapAnalysisToViewModel` | `src/server/workspace/analysis-view-model.ts` | `ReferenceVideoAnalysis` | `AnalysisViewModel` |
| Composer merge | `src/server/workspace/workspace-composer-service.ts` | Bundle + brief + engines + fixture | `WorkspaceViewModel` (extends or replaces `MockResultWorkspaceViewModel`) |

---

## PP-10 reuse summary

| Display field | Produced by | Read by PP-11 |
|---------------|-------------|---------------|
| All `ReferenceVideoAnalysis` sections | PP-10 coordinator + mock provider | Mapper only — **no recomputation** |

---

## Consistency checklist

- [x] Composer reads analysis only via `WorkspaceRepository`
- [x] No section invokes coordinator or provider
- [x] Hybrid brief sections unchanged
- [x] Static fixture sections explicitly marked deferred for PP-13
- [x] Analysis section uses MVP subset per PP-10A §9.3
