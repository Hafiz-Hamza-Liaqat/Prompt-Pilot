# PP-11A — Workspace Composer Design

**Status:** Supporting document for [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md)  
**Scope:** Workspace Composer only — documentation

---

## Purpose

The **Workspace Composer** is a **read-only composition service** that builds the workspace view model for UI rendering. It replaces the gradual retirement path of `mock-result-workspace-service.ts` (PP-04C §16) while preserving hybrid brief engines and static fixture sections until PP-13.

---

## Responsibilities

| # | Responsibility |
|---|----------------|
| 1 | Authenticate scope via caller (`userId`, `projectId`) — same as mock service |
| 2 | Load project record |
| 3 | Load completed brief (redirect/`brief_required` when hybrid sections need it) |
| 4 | Load `WorkspaceIntelligenceSnapshot` via `WorkspaceRepository.getIntelligenceBundle()` |
| 5 | Map `analysis` to `AnalysisViewModel` when present |
| 6 | Run deterministic engines (scenes, complexity/risk, recommendations) when brief data available |
| 7 | Attach static fixture sections (prompts, continuity, audio-editing) |
| 8 | Normalize active section from query param |
| 9 | Attach section origins and truthfulness metadata |

---

## Inputs

```typescript
// Conceptual — implementation in PP-11
type WorkspaceComposerLoadRequest = {
  userId: string;
  projectId: string;
  section?: string;
};

type WorkspaceComposerDeps = {
  workspaceRepository: WorkspaceRepository;
  projectRepository: ProjectRepository;
  briefRepository: VideoBriefRepository;
  providerCatalogueRepository: ProviderCatalogueRepository;
  sceneDecompositionService?: SceneDecompositionService;
  complexityRiskService?: ComplexityRiskService;
  providerRecommendationService?: ProviderRecommendationService;
  staticFixture: MockResultWorkspaceStaticFixture; // until PP-13
};
```

**Scope mapping:** `{ ownerId: userId, projectId }` → `OwnerScope` for pivot repositories.

---

## Outputs

```typescript
type WorkspaceComposerResult =
  | { ok: true; data: WorkspaceViewModel }
  | { ok: false; code: 'not_found' | 'brief_required' | 'persistence_error' | 'invalid_fixture' };

type WorkspaceViewModel = {
  project: WorkspaceProjectSummary;
  brief: WorkspaceBriefSummary;
  activeSection: WorkspaceSection; // includes 'analysis'
  analysis: AnalysisViewModel | null;
  intelligence: {
    referenceId: EntityId | null;
    analysisId: EntityId | null;
    activeJobState: JobState | null;
  };
  // Hybrid engine outputs (existing shapes)
  sceneDecomposition: …;
  complexityRiskAssessment: …;
  providerRecommendation: …;
  // Static fixture (existing)
  samplePromptSections: …;
  continuityItems: …;
  audioEditingItems: …;
  sectionOrigins: …;
  mode: 'hybrid_preview' | 'analysis_available'; // truthfulness
};
```

---

## Repositories consumed (read only)

| Repository | Method | Purpose |
|------------|--------|---------|
| `WorkspaceRepository` | `getIntelligenceBundle(scope)` | Primary intelligence aggregate |
| `ProjectRepository` | `getById(userId, projectId)` | Project summary |
| `VideoBriefRepository` | `getByProjectId(userId, projectId)` | Brief summary + engines |
| `ProviderCatalogueRepository` | catalogue reads | Recommendations engine |

**Not called directly by Composer:** `AnalysisRepository`, `ReferenceRepository`, `JobRepository` — accessed only through bundle (aggregate pattern per `SupabaseWorkspaceRepository`).

---

## Mapping responsibilities

| Mapping | Owner function | Input |
|---------|----------------|-------|
| Analysis display | `mapAnalysisToViewModel()` | `ReferenceVideoAnalysis` |
| Project | `mapProjectSummary()` | Reuse from mock service |
| Brief | `mapBriefSummary()` | Reuse from mock service |
| Scene roadmap | Scene decomposition service | Brief |
| Quality | Complexity/risk service | Brief + scenes |
| Providers | Recommendation service | Brief + catalogue |
| Static sections | Pass-through fixture | Config fixture |

Composer **orchestrates mappers** — it does not embed field-level analysis mapping logic.

---

## Explicit prohibitions

| Prohibition | Rationale |
|-------------|-----------|
| **No persistence writes** | Repositories read-only; PP-04D §9 |
| **No orchestration** | JobOrchestrator not injected |
| **No provider calls** | G-06 — no `MockAnalysisProvider`, no AI |
| **No cache writes or lookups** | Cache is pipeline concern (PP-09/PP-10) |
| **No analysis regeneration** | Display persisted snapshot only |
| **No package generation** | PP-13 |

---

## Relationship to orchestration `workspace_refresh` stage

`STAGE_DEFINITIONS.workspace_refresh` declares `delegatePort: 'workspace_composer'`. **PP-11 does not implement this stage runner.** Workspace display is refreshed by:

- Next.js `revalidatePath('/projects/[id]/workspace')` after job completion
- User navigation to workspace page → Composer load

A future phase may add `executeWorkspaceRefreshStage` that warms caches or denormalized views — out of PP-11 scope.

---

## Error handling

| Code | When |
|------|------|
| `not_found` | Invalid project or unauthorized |
| `brief_required` | Brief incomplete and page requires hybrid sections** |
| `persistence_error` | Repository failure |
| `invalid_fixture` | Static fixture schema mismatch |

**Analysis absent** is not an error — `analysis: null` with empty state in UI.

**Optional:** When user deep-links to `analysis` section without analysis, render empty state instead of `brief_required` if reference exists.

---

## DI and factory

```typescript
// Planned: src/server/workspace/workspace-composer-service.ts
export function createWorkspaceComposerService(
  deps: WorkspaceComposerDeps,
): WorkspaceComposerService;
```

Wired from `workspace/page.tsx`:

```text
createSupabasePivotRepositoryRegistry(supabase)
  → createWorkspaceComposerService({ workspaceRepository, … })
```

Mirrors `createMockResultWorkspaceService` factory pattern.

---

## Testing expectations

| Test file | Cases |
|-----------|-------|
| `tests/workspace/workspaceComposer.spec.ts` | Bundle with analysis; without analysis; brief+analysis coexistence; section normalization |
| `tests/workspace/analysisViewModel.spec.ts` | Mapper unit tests (Slice 1 — may run before Composer) |

Composer tests use in-memory repositories or registry test doubles — **never** call live coordinator.

---

## Consistency affirmation

- [x] Read-only composition service
- [x] Consumes `WorkspaceRepository` aggregate only for pivot entities
- [x] No PP-10 module imports except types
- [x] Aligns with PP-04C §15
