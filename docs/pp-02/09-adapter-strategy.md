# Adapter Strategy — PP-02 Step 10

**Related:** [ReferenceVideoAnalysis spec](01-reference-video-analysis-specification.md) · Architecture Readiness Audit

No code. Maps **existing runtime/domain models** to **PP-02 canonical model**.

---

## 1. Strategy summary

| Principle | Action |
|---|---|
| **Extend, don't parallel** | Evolve `SourceAnalysis` → ReferenceVideoAnalysis; do not maintain two analysis trees |
| **Adapter layer** | Translate live engine outputs ↔ canonical types at Workspace boundary |
| **Packages replace fixtures** | Static workspace prompt/continuity fixtures → Prompt/Blueprint Packages |
| **Brief remains** | Video Brief stays; optional input to Package Engine |
| **Deprecate gradually** | Legacy names remain until Migration Phase E |

---

## 2. Current domain models → canonical mapping

### Persisted / live runtime

| Current model | Role today | Canonical target |
|---|---|---|
| `ProjectRecord` | Container | **Project** (unchanged) |
| `PartialVideoBriefDraft` / DB `video_briefs` | Wizard state | **Video Brief** (unchanged) |
| Brief `source_*` fields | Intake | **Reference** (split to own entity) |
| — | Missing | **Reference**, **Job**, **Fingerprint**, **Package** |
| `SceneDecomposition` | Deterministic timing | Parallel **evaluation**; optional input to Blueprint Package — not a section inside ReferenceVideoAnalysis |
| `ComplexityRiskAssessment` | Scoring | Workspace **quality** section; may inform Marketing Package |
| `ProviderRecommendationResult` | Recommendations | Workspace **providers** section; informs Prompt Package variants |
| `MockResultWorkspaceViewModel` | UI aggregate | **Workspace** view model — compose from Analysis + Packages + engines |

### Schema-only (tests/fixtures)

| Current model | Canonical target |
|---|---|
| `SourceAnalysis` | Subset of **ReferenceVideoAnalysis** (text fields) |
| `VideoPlan` | Optional **Production Plan Export** bundling packages — not analysis |
| `Scene` / `SceneTimeline` | **Blueprint Package** payload |
| `CompiledPrompt` | **Prompt Package** payload unit |
| `ContinuityBible` | **Blueprint Package** subsection |
| `EditingRoadmap` | **Blueprint Package** or separate future package |
| `QualityAudit` | Package validation output or Export metadata |
| `ExportMetadata` | **Export** entity |
| `ProviderRecommendationSet` | Adapter from `ProviderRecommendationResult` when building Production Plan export |
| `ProviderCapability` | **Deprecate** — use `providerCatalogue` only |

---

## 3. Duplicate schema conflicts — resolution

| Conflict | Resolution |
|---|---|
| `ComplexityAssessment` in `videoPlan` vs `complexityRiskAssessment` live | **Live engine wins** at runtime; VideoPlan adapter copies live shape or drops legacy nested schema |
| `SCENE_ROLES` vs `NARRATIVE_ROLES` | Analysis **sceneSegments** use observed labels; Blueprint Package uses plan roles; adapter maps between |
| `ProviderRecommendationSet` vs `ProviderRecommendationResult` | Single runtime: **ProviderRecommendationResult**; export adapter produces set if needed |
| Workspace `static_fixture` sections | Replace with **Package**-backed sections marked `generatorKind` |

---

## 4. Compatibility strategy

### Phase A — Read adapters (no persistence change)

Workspace service reads:

- Brief from existing repo
- Engines computed on fly (existing)
- Mock packages from fixtures **shaped as** Package contract

### Phase B — Write adapters (new entities)

- Reference, Job, Analysis persisted
- Workspace reads analysis from new store
- Engines still from brief

### Phase C — Package adapters

- Prompt/Blueprint packages replace fixtures
- `WORKSPACE_SECTION_ORIGINS` updated: `static_fixture` → `package_engine`

---

## 5. Deprecation strategy

| Artifact | Deprecation |
|---|---|
| `SourceAnalysis` as standalone target | Mark deprecated in glossary when ReferenceVideoAnalysis ships |
| `providerCapability.ts` | No new imports; remove in Phase E |
| `MockResultWorkspace` fixture prompts | Remove when Prompt Package live |
| Brief as sole intake | UX deprecate `product_url`/`article_url` for pivot paths — code remains until Phase E |
| Forbidden table inventory entries | Amended in PP-04 migration design to allow `references`, `jobs`, `analyses`, `packages` |

---

## 6. Incremental migration approach

See [10-migration-strategy.md](10-migration-strategy.md).

**No big-bang:** Workspace continues to render during all adapter phases.

---

## 7. Workspace view model (target)

```text
WorkspaceViewModel
├── project
├── reference (latest or selected)
├── job (active or last completed)
├── analysis: ReferenceVideoAnalysis
├── packages: Package[] (by type)
├── evaluations
│   ├── sceneDecomposition (optional)
│   ├── complexityRisk (optional)
│   └── providerRecommendation (optional)
└── exportHistory
```

---

## Step 10 acceptance

- [x] Current models mapped
- [x] Conflicts resolved
- [x] Compatibility and deprecation documented
- [ ] Human approval
