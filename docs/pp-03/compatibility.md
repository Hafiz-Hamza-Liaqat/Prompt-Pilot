# Legacy Compatibility — PP-03

**Related:** [Adapter strategy (PP-02)](../pp-02/09-adapter-strategy.md) · [PP-03 index](README.md)

This document maps **existing domain contracts** to **canonical PP-03 contracts**. No runtime adapters are implemented in PP-03.

---

## 1. Schema coexistence rules

| Rule | Detail |
|---|---|
| Single analysis target | New code targets `ReferenceVideoAnalysisSchema`; do not extend `SourceAnalysisSchema` |
| Legacy VideoPlan | Remains valid for historical tests; future Production Plan export may bundle Packages |
| Package payloads reuse legacy units | `CompiledPromptSchema`, `ContinuityBibleSchema`, `SceneTimelineSchema` embedded in package payloads |
| No duplicate analysis trees | Adapters translate at boundaries — see PP-02 adapter strategy |

---

## 2. Legacy → canonical mapping

| Legacy schema | Status | Canonical target |
|---|---|---|
| `SourceAnalysisSchema` | **Deprecated** | Subset of `ReferenceVideoAnalysisSchema` (story, audience, objects, safety) |
| `VideoPlanSchema` | Active (legacy) | Optional export bundle; not analysis |
| `CompiledPromptSchema` | Active | `PromptPackagePayloadSchema.compiledPrompts[]` |
| `ContinuityBibleSchema` | Active | `BlueprintPackagePayloadSchema.continuityBible` |
| `SceneTimelineSchema` | Active | `BlueprintPackagePayloadSchema.sceneTimeline` |
| `SceneDecomposition` (engine) | Active runtime | Parallel evaluation; optional Package dependency |
| `ComplexityRiskAssessment` | Active runtime | Workspace quality; optional Marketing Package input |
| `ProviderRecommendationResult` | Active runtime | Prompt Package variant selection |
| `MockResultWorkspaceViewModel` | Active UI fixture | Future: compose from Analysis + Packages |

---

## 3. Field-level SourceAnalysis mapping

| SourceAnalysis field | ReferenceVideoAnalysis section |
|---|---|
| `sourceType`, `originalInput` | `Reference` entity + `metadata` |
| `sourceTitle` | `metadata.title` |
| `sourceSummary` | `story.storySummary` |
| `keyFacts` | `story` + `seoSeeds.topicPhrases` |
| `productFeatures` | `objects.detectedObjects` |
| `audienceHints` | `audience.audienceSignals` |
| `visualOpportunities` | `camera` + `lighting` |
| `factualClaims` | `story` (with confidence) |
| `unverifiedClaims` | `story` + confidence `unknown` |
| `safetyWarnings` | `safety.safetyWarnings` |
| `sourceReferences` | `metadata` + Reference provenance |

---

## 4. Import guidance

```ts
// Preferred — canonical contracts
import {
  ReferenceVideoAnalysisSchema,
  PackageEnvelopeSchema,
  JobRecordSchema,
} from '@/domain'; // or src/domain/index.js

// Legacy — brief wizard and VideoPlan only
import { SourceAnalysisSchema, VideoPlanSchema } from '@/domain';
```

**Do not** import `SourceAnalysisSchema` in new pivot modules (Reference, Job, Package Engine, Cache).

---

## 5. Deprecation timeline

| Phase | Action |
|---|---|
| PP-03 (now) | Mark `SourceAnalysisSchema` deprecated in JSDoc; glossary updated |
| PP-04 | Persistence design adds `references`, `jobs`, `analyses`, `packages` tables |
| Migration B | Dual-read adapters at Workspace boundary |
| Migration E | Remove `SourceAnalysis` from active paths |

---

## 6. Enum alignment notes

| Topic | Legacy | Canonical |
|---|---|---|
| Scene roles (plan) | `NARRATIVE_ROLES` | Blueprint Package (prescriptive) |
| Scene roles (observed) | — | `AnalysisSceneSegment.roleLabel` (free text + derived) |
| Brief source types | `SOURCE_TYPES` | Unchanged — Video Brief only |
| Reference kinds | — | `REFERENCE_KINDS` (intake) |

Brief `SOURCE_TYPES` and Reference `REFERENCE_KINDS` are **intentionally separate** — brief captures user intent; Reference captures intake artifact kind.
