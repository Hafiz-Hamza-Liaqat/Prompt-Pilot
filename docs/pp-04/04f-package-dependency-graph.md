# PP-04F — Package Dependency Graph

**Related:** [PP-02 Package Engine](../pp-02/04-package-engine.md) · [PP-03 PackageEnvelopeSchema](../../src/domain/canonical/package.ts)

All packages **derive from `ReferenceVideoAnalysis`**. No package consumes raw media.

---

## 1. Root dependency rule

```text
                    ReferenceVideoAnalysis
                    (required, pinned analysisId + analysisVersion)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  Blueprint Package    Prompt Package         SEO Package
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
  (optional brief)     (optional brief,     (optional brief
   optional scene       recommendations)      destination)
   decomposition)
        │                     │
        └──────────┬──────────┘
                   ▼
           Marketing Package
                   │
                   ▼
         Repurposing Package
         (optional Prompt Package by ID)
```

**Hard rule:** Every `PackageEnvelope.dependsOn` **must** include `reference_video_analysis`.

---

## 2. Package type dependency matrix

| Package type | Required inputs | Optional inputs | Never consumes |
|---|---|---|---|
| **Blueprint** | ReferenceVideoAnalysis | Video Brief, SceneDecomposition | Raw media, URL fetch |
| **Prompt** | ReferenceVideoAnalysis | Video Brief, ProviderRecommendationResult | Raw media |
| **SEO** | ReferenceVideoAnalysis (`seoSeeds`) | Video Brief (destination) | Raw media |
| **Marketing** | ReferenceVideoAnalysis | ComplexityRiskAssessment, Video Brief | Raw media |
| **Repurposing** | ReferenceVideoAnalysis | Prompt Package (by ID), Video Brief | Raw media |

---

## 3. Engine outputs (not analysis sections)

Deterministic engines produce **parallel evaluations** — not substitutes for ReferenceVideoAnalysis:

```text
Video Brief ──────► Scene Decomposition ────┐
                                              ├──► optional Package inputs
ReferenceVideoAnalysis ───────────────────────┘
Video Brief ──────► Complexity / Risk ───────► Marketing Package (optional)
Video Brief + Catalogue ─► Recommendations ────► Prompt Package (optional)
```

Engines **must not** write into ReferenceVideoAnalysis at runtime.

---

## 4. Regeneration dependencies (PP-02 rules)

| Event | Package impact |
|---|---|
| New analysis version | **All** package types must regenerate; old packages preserved |
| Same analysis, new generator version | New `packageVersion` per type |
| Brief edit only | Regenerate packages that declare `video_brief` in `dependsOn` |
| Cache hit (same analysis) | Skip analysis; packages generated if missing for job |

---

## 5. MVP package subset

Per PP-02 final review conditions, MVP minimum:

| Package | MVP |
|---|---|
| Blueprint | **Yes** |
| Prompt | **Yes** |
| SEO | MVP+ (Phase PP-16) |
| Marketing | MVP+ (Phase PP-15) |
| Repurposing | MVP+ (Phase PP-17) |

MVP job default package request: `['blueprint', 'prompt']`.

---

## 6. Forbidden dependency edges

| From | To | Reason |
|---|---|---|
| Any Package Generator | Media Intake | Violates analysis boundary |
| Any Package Generator | Core Analysis | Re-analysis forbidden |
| SEO Generator | Raw transcript fetch | Must use analysis transcript section |
| Prompt Generator | YouTube API | Must use analysis snapshot |
| Package Generator | Package Generator (chain) | Repurposing may **read** Prompt Package record only — not invoke Prompt Generator inline without orchestrator |

---

## 7. Contract enforcement

`PackageEnvelopeSchema` fields:

- `dependsOn[]` — `{ entity, id, version? }`
- `inputManifest[]` — declarative audit trail
- `analysisId` + `analysisVersion` — pinned snapshot

Orchestrator validates dependencies exist before invoking Package Generator facade.

---

## Step 04F acceptance

- [x] All packages derive from ReferenceVideoAnalysis
- [x] Raw media exclusion explicit
- [x] Optional engine/brief dependencies documented
- [x] MVP subset noted
