# Structured Output Contracts

**Project:** Prompt Pilot

Related documents: [Product Contract](product-contract.md) · [MVP Scope](mvp-scope.md) · [Domain Glossary](domain-glossary.md) · [Phase Roadmap](phase-roadmap.md)

Phase 1 establishes the authoritative domain contracts for MVP structured video-plan output.

> **PP-03 update:** Pivot contracts live in `src/domain/canonical/`. Legacy hierarchy below remains for brief wizard and VideoPlan until Migration Phase E.

> **These contracts do not generate media, call AI providers, access a database, or expose application routes.**

---

## Canonical contract hierarchy (PP-03)

```text
ReferenceVideoAnalysisSchema (root analysis — pivot)
├── AnalysisMetadataSchema … AnalysisSafetySchema
├── AnalysisFingerprintRefSchema
└── AnalysisVersionSchema

PackageEnvelopeSchema (discriminatedUnion packageType)
├── BlueprintPackagePayloadSchema → SceneTimelineSchema, ContinuityBibleSchema
├── PromptPackagePayloadSchema → CompiledPromptSchema[]
├── SeoPackagePayloadSchema
├── MarketingPackagePayloadSchema
└── RepurposingPackagePayloadSchema

ContentFingerprintSchema · JobRecordSchema · ExportRecordSchema · ReferenceSchema
```

See [PP-03 compatibility](pp-03/compatibility.md) and [domain glossary](domain-glossary.md).

---

## Why Zod is the runtime source of truth

All domain shapes are defined as Zod schemas in `src/domain/`. Schemas validate parsed JSON at runtime and enforce cross-field rules that TypeScript alone cannot guarantee.

TypeScript types are always inferred from schemas:

```ts
import { VideoPlanSchema, type VideoPlan } from './src/domain/index.js';

const result = VideoPlanSchema.safeParse(input);
if (result.success) {
  const plan: VideoPlan = result.data;
}
```

Do not maintain parallel hand-written interfaces. If a field changes, update the Zod schema first and let types follow via `z.infer<typeof SchemaName>`.

For pivot modules, prefer:

```ts
import {
  ReferenceVideoAnalysisSchema,
  PackageEnvelopeSchema,
} from './src/domain/index.js';
```

---

## Legacy contract hierarchy (Phase 1)

```text
VideoPlanSchema (root)
├── VideoBriefSchema
│   ├── SourceAnalysisSchema
│   └── ProductionRequirementsSchema
├── ComplexityAssessmentSchema
├── ProductionRiskAssessmentSchema
├── ProviderRecommendationSetSchema
│   └── ProviderRecommendationSchema
├── StoryStructureSchema
├── SceneTimelineSchema
│   └── SceneSchema
│       └── CompiledPromptSchema
│           └── SuggestedSettingSchema
├── ContinuityBibleSchema
│   ├── CharacterLockSchema
│   ├── ProductLockSchema
│   ├── WorldLockSchema
│   └── StyleLockSchema
├── VoiceoverScriptSchema
├── AudioGuidanceSchema
├── EditingRoadmapSchema
│   └── ExportSettingsSchema
├── QualityAuditSchema
└── ExportMetadataSchema

Standalone catalogue contract:
└── ProviderCapabilitySchema
```

Supporting primitives live in `src/domain/common.ts`. Locked MVP enums and constant arrays live in `src/domain/constants.ts`.

---

## Locked enum values

### AI video providers (exactly five)

`google_veo` · `openai_sora` · `runway` · `kling` · `adobe_firefly`

### Publishing destinations

`youtube` · `youtube_shorts` · `instagram_reels` · `instagram_feed` · `facebook_reels` · `facebook_feed` · `tiktok` · `website` · `custom`

### Video categories

`product_advertisement` · `ugc_advertisement` · `cinematic_short` · `faceless_educational` · `explainer` · `product_demonstration` · `story_narrative` · `realistic_social_scene` · `youtube_intro_trailer` · `real_estate_showcase` · `news_informational_recap` · `app_software_promotion`

### Duration bounds

MVP custom durations must be whole seconds from **5** through **180**. Preset values: `5, 8, 10, 15, 20, 30, 45, 60, 90, 120, 180`.

### Other enums

| Group | Values |
|---|---|
| Source types | `idea`, `script`, `product_url`, `article_url`, `template` |
| Recommendation confidence | `low`, `medium`, `high` |
| Complexity levels | `simple`, `structured`, `advanced`, `production` |
| Risk levels | `low`, `medium`, `high`, `critical` |
| Narrative roles | `hook`, `setup`, `problem`, `solution`, `benefit`, `proof`, `transition`, `call_to_action`, `closing`, `custom` |
| Recommendation roles | `primary`, `alternative`, `budget_alternative` |
| Warning severities | `info`, `warning`, `error` |
| Aspect ratios | `16:9`, `9:16`, `1:1`, `4:5`, `custom` |
| Interaction states | `idle`, `validating`, `submitting`, `success`, `recoverable_error`, `blocked` |

### Budget priority

`free_only` · `low_cost` · `balanced` · `highest_quality` · `fastest`

Budget priority represents affordability or cost sensitivity when selecting providers and production approaches.

### Quality priority

`fastest` · `balanced` · `highest_quality`

Quality priority represents the speed-versus-output-quality preference for generation and planning. It is a separate runtime-validated contract from budget priority.

### Production requirements (exactly 14)

The canonical production-requirement count is **14**. Keys are defined once in `src/domain/productionRequirements.ts` and consumed by:

- `VideoBriefSchema.productionRequirements` (Phase 1 final contract)
- Wizard draft schemas (Phase 6)
- `public.video_briefs` `requires_*` columns
- Wizard UI labels and review rendering
- Repository read/write mappings

| Key | Database column |
|---|---|
| `characterConsistency` | `requires_character_consistency` |
| `productConsistency` | `requires_product_consistency` |
| `logoAccuracy` | `requires_logo_accuracy` |
| `exactTextVisibility` | `requires_exact_text_visibility` |
| `nativeAudio` | `requires_native_audio` |
| `dialogue` | `requires_dialogue` |
| `voiceover` | `requires_voiceover` |
| `lipSync` | `requires_lip_sync` |
| `multipleLocations` | `requires_multiple_locations` |
| `cameraControl` | `requires_camera_control` |
| `firstLastFrameControl` | `requires_first_last_frame_control` |
| `videoExtension` | `requires_video_extension` |
| `referenceImages` | `requires_reference_images` |
| `commercialUse` | `requires_commercial_use` |

New production requirements require an explicit product-contract decision and a dedicated migration phase. Provider catalogue capabilities must not silently extend this taxonomy.

---

## Root-level validation rules

`VideoPlanSchema` applies these cross-field checks via `superRefine`:

1. At least one scene exists.
2. Scene numbers are unique.
3. Scene numbers are sequential beginning at 1.
4. Generation-order values are unique.
5. Scene identifiers are unique.
6. Scenes are ordered by start time.
7. No scenes overlap.
8. The first scene begins at second 0.
9. The final scene ends at the brief duration.
10. The sum of scene durations equals the brief duration.
11. Every scene’s recommended provider exists in the recommendation set.
12. Every compiled-prompt provider exists in the recommendation set.
13. Root `projectId` matches `videoBrief.projectId`.
14. All referenced continuity-lock identifiers exist in the Continuity Bible.
15. `updatedAt` is not earlier than `createdAt`.

Scene-level checks in `SceneSchema`:

- `endSecond` > `startSecond`
- `durationSeconds` === `endSecond - startSecond`
- At least one compiled prompt per scene
- Each compiled prompt’s `sceneId` matches the scene identifier

Recommendation-set checks in `ProviderRecommendationSetSchema`:

- Exactly one primary recommendation
- At least one alternative recommendation
- No duplicate providers
- Primary must be eligible with no disqualification reasons

---

## Capability-version requirement

`ProviderCapabilitySchema` and `ProviderRecommendationSchema` both require a `capabilityVersion` / `capabilityVersionUsed` field using dotted numeric version strings (e.g. `1.0.0`).

Plans reference the capability version active at generation time. Admin updates in future phases create new versions without mutating historical plans.

---

## Compiler-version requirement

Each `CompiledPromptSchema` record includes a `compilerVersion` field. Prompt compiler upgrades in Phase 15 must bump this version so regenerated prompts are traceable.

---

## Example parsing usage

```ts
import { VideoPlanSchema } from '../src/domain/index.js';

const result = VideoPlanSchema.safeParse(rawJson);

if (!result.success) {
  console.error(result.error.flatten());
  throw new Error('Invalid video plan');
}

return result.data;
```

Use `safeParse` at system boundaries (API handlers, LLM output ingestion, export loaders). Use the valid fixture in `tests/fixtures/validVideoPlan.ts` as a reference shape.

---

## How future phases should consume contracts

| Phase | Usage |
|---|---|
| Phase 2–4 | Import domain types; no schema duplication in app shell |
| Phase 6 | Wizard form output should validate against `VideoBriefSchema` |
| Phase 7 | Seed provider records with `ProviderCapabilitySchema` |
| Phase 8 | Mock workspace renders validated `VideoPlan` fixtures |
| Phase 9–11 | Deterministic engines produce partial objects validated by sub-schemas |
| Phase 12–13 | LLM output must parse through `VideoPlanSchema` before persistence |
| Phase 15–16 | Prompt compiler and continuity modules emit `CompiledPromptSchema` and lock schemas |
| Phase 22 | Export serializes validated `VideoPlan` objects |

Import from the public barrel:

```ts
import { VideoPlanSchema, type VideoPlan } from '@/domain'; // path alias added in later phases
```

In Phase 1, import directly from `src/domain/index.js`.

---

## Intentionally unimplemented

The following remain out of scope for Phase 1:

- Next.js application shell, React components, and pages
- Supabase database schema, migrations, and Row Level Security
- Authentication and authorization
- API routes and server actions
- OpenAI Responses API integration
- Firecrawl link extraction
- Video or image generation
- Provider API calls and secrets
- Deployment configuration (Vercel, Sentry)
- UI interaction-state wiring (enum defined; UI deferred)
- Platform adaptation as a standalone schema (destination captured on brief; adaptation rules in Phase 20)

Phase 1 delivers schemas, validation, tests, and documentation only.
