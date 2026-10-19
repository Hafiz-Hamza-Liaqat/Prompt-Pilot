# Package Engine — PP-02 Step 5

**Related:** [ReferenceVideoAnalysis spec](01-reference-video-analysis-specification.md) · [Entity model](02-entity-relationship-model.md)

---

## 1. What is a Package?

A **Package** is a **typed, immutable, versioned output document** produced by the **Package Engine** from:

1. Exactly one **ReferenceVideoAnalysis** snapshot (required), and  
2. Optionally one **Video Brief** and **deterministic engine outputs** (complexity, recommendations, decomposition).

A Package is **generated intelligence for action** — prompts, blueprints, SEO copy, marketing copy, repurposing formats. It is never media.

**Rule:** The Package Engine **must not** access original video, audio, URL fetch, or platform APIs. It reads only ReferenceVideoAnalysis (+ declared optional inputs).

---

## 2. Shared Package contract

Every package type implements the same envelope:

| Field | Description |
|---|---|
| **Identity** | |
| `packageId` | Unique package instance ID |
| `packageType` | Enum: see §3 |
| `projectId` | Owning project |
| `referenceId` | Source reference |
| `analysisId` | Source analysis snapshot |
| `analysisVersion` | Pinned analysis version |
| **Version** | |
| `packageVersion` | Monotonic version for this type + analysis |
| `generatorVersion` | Package Engine / template version |
| `supersedesPackageId` | Prior package if regenerated |
| **Generator** | |
| `generatorKind` | `mock`, `rules`, `ai_compilation` |
| `generatorProvider` | e.g. `prompt-pilot-mock`, `gemini` (when AI) |
| **Dependencies** | |
| `dependsOn` | List of `{ entity, id, version }` — analysis, brief, decomposition, recommendation |
| **Inputs** | |
| `inputManifest` | Declarative list of input objects consumed (IDs only) |
| **Outputs** | |
| `payload` | Type-specific structured body (see §3) |
| **Metadata** | |
| `createdAt` | Timestamp |
| `createdByJobId` | Job that produced this package |
| `confidenceSummary` | Inherited / propagated confidence notes |
| `transformationNotice` | Required legal/product notice |
| `exportReady` | Boolean — safe for user export |

---

## 3. Package types

### Blueprint Package

**Purpose:** Prescriptive production plan derived from observed analysis.

| Output payload (conceptual) | Maps to legacy |
|---|---|
| Storyboard frames per scene segment | New structure |
| Shot list | New + `scenePlan` influence |
| Camera / lens suggestions | Blueprint-only |
| Lighting plan | Blueprint-only |
| Character descriptions (non-cloning) | `continuityBible` influence |
| VO structure (text) | `VoiceoverScript` influence |
| Music mood / SFX notes | `AudioGuidance` influence |

### Prompt Package

**Purpose:** Provider-ready compiled prompts.

| Output payload | Maps to legacy |
|---|---|
| Master provider-neutral prompt | New |
| Per-scene compiled prompts | `CompiledPrompt[]` |
| Negative constraints | `CompiledPrompt.negativeConstraints` |
| Provider variants (Veo, Runway, Kling, …) | Multiple `CompiledPrompt` grouped |
| Reference asset instructions (textual) | `referenceAssetInstructions` |

### SEO Package

**Purpose:** Discoverability artifacts from SEO Seeds in analysis.

| Output payload |
|---|
| SEO title candidates |
| Meta description candidates |
| Keywords, semantic keywords, long-tail |
| Tags, hashtags |
| Publishing checklist |

### Marketing Package

**Purpose:** Audience and performance-oriented copy.

| Output payload |
|---|
| Hook analysis depth |
| Retention risk notes |
| Audience persona expansion |
| Viral pattern notes (careful: no deceptive claims) |

### Repurposing Package

**Purpose:** Cross-format text outputs.

| Output payload |
|---|
| Blog outline |
| Newsletter draft structure |
| LinkedIn post |
| Facebook post |
| Instagram carousel outline |
| Reel script / TikTok script |
| Podcast outline |
| Course outline |

One **Repurposing Package** may contain multiple **format sections**, each versioned together under one package envelope.

---

## 4. Package Engine behavior (conceptual)

```text
ReferenceVideoAnalysis + optional Brief/engines
        │
        ▼
  Select packageType(s)
        │
        ▼
  Validate dependencies present
        │
        ▼
  Run generator (mock | rules | AI)
        │
        ▼
  Validate payload against package schema
        │
        ▼
  Persist Package (immutable)
        │
        ▼
  Expose to Workspace
```

Multiple package types may be requested in one **Job** stage: `Generating Packages`.

---

## 5. Regeneration rules

| Action | Behavior |
|---|---|
| New analysis version | All packages must regenerate; old packages remain for history |
| Same analysis, new generator version | New `packageVersion`; prior preserved |
| User edits brief only | Packages that declare brief dependency may regenerate selectively |

---

## Step 5 acceptance

- [x] Package defined as shared contract
- [x] Five package types described with payloads
- [x] Engine consumes ReferenceVideoAnalysis only
- [ ] Human approval of package type list
