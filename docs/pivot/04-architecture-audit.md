# Architecture Audit — Phase 1-D

**Project:** Prompt Pilot — AI Content Intelligence Platform  
**Status:** Documentation only — **no code was modified**  
**Related:** [Application Foundation](../application-foundation.md) · [PRS](02-product-requirements-specification.md)

This audit maps **what exists today** (verified against the repository) versus **what must be built** for the pivot. It does not invent implemented modules.

---

## 1. Audit methodology

- Read-only inspection of `src/`, `supabase/`, `docs/`, `tests/`, and `scripts/`
- Cross-reference with [implementation-checklist.md](../implementation-checklist.md) (Phases 0–11-B DONE)
- Label each item: **Existing**, **Partial**, or **New (required)**

---

## 2. Reusable components (existing)

### Authentication — **Existing**

| Asset | Location / evidence |
|---|---|
| Email/password auth | `src/app/auth/*`, Supabase Auth |
| Session refresh | `src/proxy.ts` |
| Route protection | `requireUser()`, `/projects`, `/account` layouts |
| Profiles + RLS | `public.profiles`, pgTAP tests |
| Integration | `scripts/verify-local-auth.mjs` |

### Projects — **Existing**

| Asset | Location / evidence |
|---|---|
| Project CRUD | `src/server/projects/*`, `src/app/projects/*` |
| Archive, restore, duplicate, soft delete | Project actions, RPC |
| Dashboard query controls | Search, filter, sort, pagination |
| RLS owner isolation | `scripts/verify-local-projects.mjs` |

### Workspace model — **Partial (Existing shell)**

| Asset | Location / evidence |
|---|---|
| Hybrid workspace | `src/server/workspace/mock-result-workspace-service.ts` |
| Scene roadmap UI | Deterministic decomposition bound |
| Complexity/risk UI | Live scoring bound |
| Provider recommendations UI | Live engine bound |
| Prompt / continuity / audio sections | **Static fixtures only** — replace in pivot |

### Brief wizard — **Existing (extend for pivot)**

| Asset | Location / evidence |
|---|---|
| Nine-step wizard | `src/components/briefs/*` |
| Persistence | `supabase-video-brief-repository.ts` (`persistStep`) |
| Source types | `idea`, `script`, `product_url`, `article_url` |
| Integration | `scripts/verify-local-video-briefs.mjs` |

### Deterministic engines — **Existing**

| Engine | Service |
|---|---|
| Scene decomposition | `scene-decomposition-service.ts` |
| Complexity / risk | `complexity-risk-service.ts` |
| Provider recommendation | `provider-recommendation-service.ts` |
| Provider catalogue | `provider-catalogue-service.ts` |

### Domain contracts — **Partial (schema-heavy)**

| Contract | Runtime use |
|---|---|
| `productionRequirements`, `sceneDecomposition`, `complexityRiskAssessment`, `providerRecommendationEngine` | **Live** |
| `videoPlan`, `scenePlan`, `compiledPrompt`, `continuityBible`, `sourceAnalysis` | **Schema/tests only** — pivot compilation target |
| `mockResultWorkspace` | **Live** preview view model |

### Routing — **Existing**

Next.js App Router; public + authenticated routes documented in [application-foundation.md](../application-foundation.md).

### Documentation — **Existing**

Nineteen foundation docs under `docs/`; pivot docs under `docs/pivot/`.

### Testing framework — **Existing**

| Layer | Tool |
|---|---|
| Unit/domain | Vitest (1005+ tests at Phase 11-B) |
| SQL/RLS | pgTAP via `npm run supabase:test` (188 tests) |
| Integration | Eight `verify-local-*.mjs` scripts |
| Philosophy | Deterministic invariants, boundary scripts, honesty guards |

### Storage boundaries — **Partial**

| Asset | Status |
|---|---|
| Supabase Postgres | **Existing** — 7 application tables |
| Supabase Storage | **Not used** in application code yet |
| Temp media TTL policy | **New** — documented only |

---

## 3. Not yet implemented (do not assume reuse)

The following appear in the target architecture but **do not exist in the repository today**:

| Module | Status | Notes |
|---|---|---|
| **Jobs** | **New** | No job table, queue, or worker process |
| **Workers** | **New** | No background job runner |
| **BYOK** | **New** | No user API key storage or encryption boundary |
| **Feature flags** | **New** | No flag system |
| **Usage tracking** | **New** | No per-operation metering |
| **Credits engine** | **New** | No credit ledger |
| **Cost engine** | **New** | No cost aggregation |
| **Link fetch / SSRF gateway** | **New** | URLs validated only, never fetched |
| **Upload engine** | **New** | No file upload routes |
| **Media processing** | **New** | No ffmpeg/transcode pipeline |

Pivot implementation must **introduce** these modules using the same patterns as existing services (Zod contracts, repository interfaces, RLS, integration scripts).

---

## 4. New modules required (by domain)

### Link Intelligence — **New**

- URL normalization, platform detection, allowlist
- SSRF-safe metadata retrieval (YouTube first)
- Job state: validating → accessible → failed/blocked
- Reuse: brief URL validation patterns in `videoBriefDraft.ts`

### Upload Engine — **New**

- Signed upload or server-mediated upload to Supabase Storage
- MIME, size, duration validation
- Virus/malware policy (document only until ops approval)
- Reuse: project ownership and RLS

### Media Processing — **New**

- Transcode/extract audio frames per policy
- Temp storage with TTL
- Never expose raw provider keys to client

### Core Analysis — **New (AI boundary)**

- Structured `ReferenceVideoAnalysis` / extended `SourceAnalysis`
- Mock provider first, real AI behind env gate
- Observed vs inferred field labeling
- Reuse: workspace section layout; scene decomposition as timing spine

### Content Blueprint — **New**

- Storyboard, shot list, camera/lighting artifacts
- Maps to `scenePlan.Scene` contract over time
- Reuse: Phase 1 `scenePlan`, `continuityBible` schemas

### Marketing Engine — **New (Future)**

- Hook, retention, viral pattern modules
- Depends on core analysis

### SEO Engine — **New (Future)**

- Title, meta, keyword artifacts
- Depends on core analysis + optional destination context

### Prompt Studio — **New**

- Provider-neutral compiler + per-provider variants
- Reuse: `compiledPrompt.ts`, provider catalogue facts, recommendation engine
- Replace: static workspace prompt fixtures

### Repurposing Engine — **New (Future)**

- Template-driven text outputs from analysis snapshot
- No media generation

### Cost Engine — **New**

- Per-job token/API cost estimation and caps
- Aligns with budget audit ($100–120)

### Credits Engine — **New**

- Abstract credits consumed per operation
- Enforces free-tier limits before billing exists

---

## 5. Recommended layering (reuse-friendly)

```text
Presentation (Next.js App Router, existing layout/header/footer)
    ↓
Application services (existing: project, brief, workspace)
    ↓
NEW: Intake services (link, upload, transcript)
    ↓
NEW: Job orchestration (queue, worker, status)
    ↓
NEW: Analysis + compilation providers (mock → BYOK/real)
    ↓
Domain contracts (extend SourceAnalysis, CompiledPrompt, VideoPlan)
    ↓
Repositories + Supabase (existing patterns + new tables)
    ↓
Storage (new: temp uploads) + Postgres (existing)
```

---

## 6. Documentation reuse recommendations

| Action | Document |
|---|---|
| **Keep authoritative for implemented code** | `application-foundation.md`, `database-auth-foundation.md`, engine docs (scenes, scoring, recommendations) |
| **Supersede for forward product** | `product-contract.md`, `mvp-scope.md`, `phase-roadmap.md` |
| **Extend when implementing** | `structured-output-contracts.md`, `domain-glossary.md`, `safety-and-content-boundaries.md` |
| **Single forward roadmap** | `prompt-pilot-roadmap.md` |

Do **not** duplicate engine algorithm docs; link to them from pivot phases that extend behavior.

---

## 7. Phase 1-D acceptance criteria

- [x] Existing reusable components documented with evidence
- [x] Non-existent modules explicitly flagged (jobs, BYOK, flags, credits)
- [x] New modules listed with reuse notes
- [x] Layering and doc reuse recommendations stated
- [ ] Human approval of architecture direction before Phase 2
