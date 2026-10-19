# Architecture Audit Gate — PP-02 Step 1

**Phase:** PP-02 Step 1  
**Inputs:** PP-01 documents · Architecture Readiness Audit · `src/domain/*` · [domain-glossary.md](../domain-glossary.md)

---

## 1. Documents reviewed

| Source | Scope |
|---|---|
| `docs/pivot/01`–`07` | Product vision, PRS, features, architecture audit, cost, MVP, metrics |
| `docs/prompt-pilot-roadmap.md` | Forward phases 1–20 |
| Architecture Readiness Audit | Engineering gate (GO WITH CONDITIONS) |
| `src/domain/*` | 24 domain modules + `src/types/database.ts` |
| `docs/domain-glossary.md` | Legacy terminology |

---

## 2. Existing terminology audited

| Existing term | Location | PP-02 disposition |
|---|---|---|
| **Project** | `project.ts`, DB `projects` | **Retain** — workspace container |
| **Video Brief** | `videoBrief.ts`, `videoBriefDraft.ts`, DB `video_briefs` | **Retain** — user intent and wizard state; not the analysis object |
| **Source Analysis** | `sourceAnalysis.ts`, glossary | **Evolve into** ReferenceVideoAnalysis — text-centric subset today |
| **Production Plan** | glossary, `videoPlan.ts` | **Retain as aggregate export concept** — not the canonical analysis object |
| **Scene** (rich) | `scenePlan.ts` | **Retain** — lives in Blueprint Package output, not in ReferenceVideoAnalysis |
| **Scene decomposition / Scene timing** | `sceneDecomposition.ts` | **Retain** — deterministic timing spine; maps to ReferenceVideoAnalysis.Timeline/Scenes |
| **Compiled Prompt** | `compiledPrompt.ts` | **Retain** — unit inside Prompt Package output |
| **Provider** (catalogue) | `providerCatalogue.ts` | **Retain** — external AI video platform for recommendations/prompt syntax |
| **Publishing Destination** | `constants.ts` | **Retain** — where finished video publishes; distinct from Reference platform |
| **Workspace** | `mockResultWorkspace.ts`, UI | **Retain** — presentation shell for analysis + packages |
| **Provider recommendation** | `providerRecommendationEngine.ts` | **Retain** — deterministic engine; consumes brief + decomposition, not raw video |
| **Complexity / execution risk** | `complexityRiskAssessment.ts` | **Retain** — may consume ReferenceVideoAnalysis + brief in future |
| **Continuity Bible** | `continuityBible.ts` | **Retain** — Blueprint Package output, not analysis core |
| **Quality Audit** | `qualityAudit.ts` | **Retain** — package validation output |
| **Export metadata** | `videoPlan.ExportMetadata` | **Evolve into** Export entity |

---

## 3. Conflicting names identified

| Conflict | Parties | Resolution |
|---|---|---|
| **Analysis** vs **Source Analysis** vs **ReferenceVideoAnalysis** | Glossary "Source Analysis"; PP-01 "core analysis" | **Analysis** = process or job stage; **ReferenceVideoAnalysis** = canonical immutable snapshot object; **SourceAnalysis** = legacy text-only contract, deprecated for new work |
| **Scene** (narrative role enums) | `SCENE_ROLES` in decomposition vs `NARRATIVE_ROLES` in scenePlan | ReferenceVideoAnalysis uses **analysis scene segments**; Blueprint Package maps to **plan scenes** via adapter — do not merge enums in PP-02 |
| **Provider** vs **AI provider** (LLM) | Catalogue provider vs Gemini/OpenAI for analysis | Catalogue = **Video Provider**; AI boundary = **Analysis Provider** / **Compilation Provider** — separate glossary entries in PP-03 |
| **Package** vs **Production Plan** | New pivot term vs legacy aggregate | **Package** = typed generator output; **Production Plan** = optional umbrella export bundling multiple packages + brief |
| **Prompt** (Compiled Prompt) vs **Prompt Package** | Single scene prompt vs full studio output | **Prompt** = one compiled prompt artifact; **Prompt Package** = collection of prompts + negatives + metadata |
| **Workspace** vs **Project** | UI route vs data container | **Project** owns data; **Workspace** is the UI surface viewing current analysis + packages for a project |
| **Job** vs **brief completion** | Future async job vs wizard "Mark ready" | **Job** = async pipeline run; brief **Ready** state = separate user intent gate — may both exist on one project |
| **Fingerprint** vs **content hash** | New term | **Content Fingerprint** = canonical dedup identity; avoid "hash" alone in docs |

---

## 4. Duplicate concepts avoided

| Do not create | Use instead |
|---|---|
| `VideoAnalysis`, `MediaAnalysis`, `ContentAnalysis` as separate top-level objects | **ReferenceVideoAnalysis** (single canonical analysis snapshot) |
| Separate SEO analysis object | **SEO Package** generated from ReferenceVideoAnalysis |
| Duplicate scene model inside analysis and blueprint | Analysis **Scenes** (observed segments) → Blueprint **Scene plan** (prescriptive) via Package Engine |
| New "Reference" table concept name `MediaSource`, `InputAsset` | **Reference** (canonical intake entity) |
| Reimplement provider recommendation | Existing **ProviderRecommendationResult** |
| Persist analysis inside `video_briefs` row | **Reference** + **ReferenceVideoAnalysis** siblings under **Project** |
| `prompt_outputs` as informal term | **Prompt Package** per Package Engine contract |

---

## 5. Naming reuse map (PP-02 → existing code)

| PP-02 canonical | Nearest existing artifact |
|---|---|
| Reference | Partial: brief `source_type` + `source_url` / `source_text` |
| ReferenceVideoAnalysis | `SourceAnalysisSchema` (extend, do not parallel) |
| Job | None |
| Package | None (forbidden table names in inventory guard) |
| Export | `ExportMetadataSchema` |
| Fingerprint | None |
| Blueprint Package | `scenePlan`, `continuityBible` (outputs) |
| Prompt Package | `CompiledPromptSchema` (per-scene units) |

---

## 6. Step 1 acceptance

- [x] Existing terminology audited
- [x] Conflicting names identified with resolutions
- [x] Duplicate concepts avoided with explicit mapping
- [ ] Human approval of terminology resolutions
