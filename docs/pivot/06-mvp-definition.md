# MVP Definition — Phase 1-F

**Project:** Prompt Pilot — AI Content Intelligence Platform  
**Status:** Frozen MVP scope (documentation only)  
**Related:** [Feature Inventory](03-feature-inventory.md) · [PRS](02-product-requirements-specification.md)

This document **freezes the pivot MVP**. It supersedes [mvp-scope.md](../mvp-scope.md) for all forward implementation.

---

## 1. MVP summary

Deliver a **project-scoped reference intelligence workflow** for authorized inputs that produces **core analysis**, a **content blueprint subset**, and a **Prompt Studio package** — reusing existing auth, projects, workspace shell, and provider recommendation engine — **without generating media**.

---

## 2. MVP inputs

| Input | In MVP | Notes |
|---|---|---|
| YouTube URL (public) | **Yes** | Metadata-first; no unauthorized download |
| User video upload | **Yes** | Size/duration capped |
| User audio upload | **Yes** | Transcription path when enabled |
| Transcript (paste/upload) | **Yes** | Untrusted input sanitization |
| Script | **Yes** | Extends existing brief source |
| Instagram / Facebook / TikTok URL | **No** | Future — platform research gate |
| X API | **No** | Deferred |
| Product URL / Article URL | **No** | Legacy brief sources remain in code but out of pivot MVP UX |

---

## 3. MVP outputs

### Core analysis (required)

- Normalized transcript (supplied or extracted when enabled)
- Timeline with segments
- Scene boundaries and roles (extend deterministic decomposition)
- Story structure (hook, body, CTA)
- Camera and editing style (high-level, transformative language)
- Audience summary
- Hooks and CTA pattern
- Observed vs inferred labels on every field

### Content blueprint (required subset)

- Storyboard (scene-level)
- Shot list
- Camera suggestions
- Master narrative summary

### Prompt Studio (required)

- Provider-neutral master prompt
- Minimum three provider variants: **Veo**, **Runway**, **Kling**
- Negative prompt constraints
- Rights/transformation notice in export

### Existing engines (retain)

- Deterministic scene timing (from brief duration when present)
- Complexity and execution-risk scores
- Evidence-backed provider recommendations

### Explicitly not in MVP output

- SEO package
- Full marketing suite
- Full repurposing suite
- Flux / Midjourney prompts
- Continuity bible generation (beyond basic notes)
- Persisted full `VideoPlan` aggregate

---

## 4. Deferred features (with reasons)

| Feature | Why deferred |
|---|---|
| Instagram, Facebook, TikTok URL intake | Official API/terms research incomplete; SSRF and access rules not approved |
| X API | Explicitly deferred; no approved developer access |
| SEO engine | Not required to validate core intelligence value; adds template scope |
| Marketing viral/competitor modules | Depends on stable analysis schema first |
| Repurposing (blog, newsletter, carousel, etc.) | Separate compiler templates; post-MVP |
| Product/article URL extraction (Firecrawl) | Legacy roadmap item; conflicts with pivot focus on video reference |
| Real payment/billing | Budget and legal gate |
| BYOK UI | Depends on analysis provider boundary |
| Background worker at scale | Mock/sync path sufficient for MVP validation |
| Admin catalogue UI | Catalogue seeded via migrations (existing) |
| Team/org roles | Out of scope |
| In-app AI media generation | Permanent product non-goal |
| Social video downloader | Legal and product boundary |
| Full `VideoPlan` persistence | Adapter work deferred until compilation stable |

---

## 5. MVP acceptance criteria

| ID | Criterion |
|---|---|
| AC1 | User can sign up, create project, add MVP input, and attest rights |
| AC2 | Analysis completes (mock or gated real AI) and displays structured sections |
| AC3 | Workspace shows core analysis + blueprint + Prompt Studio |
| AC4 | Provider recommendations still render for completed brief context |
| AC5 | User can copy/export prompt package as text/JSON |
| AC6 | No video, image, or voice is generated inside Prompt Pilot |
| AC7 | Cross-user access blocked by RLS |
| AC8 | Existing regression suite passes unless intentionally migrated with replacement tests |
| AC9 | Cost gate documented and enforced when real AI enabled |
| AC10 | All outputs use transformative language; no exact-copy instructions |

---

## 6. MVP success criteria (product)

| Metric | Target (initial — refine in Phase 1-G) |
|---|---|
| End-to-end completion rate | ≥ 60% of started analyses reach export |
| Time to first export | < 10 minutes (mock path); TBD real AI |
| User comprehension | User can explain what is observed vs inferred (qualitative) |
| Zero critical security issues | SSRF/upload gates pass review before fetch enabled |
| Budget | Stay within $100–120 envelope during MVP validation period |

---

## 7. Migration note (existing users)

Existing brief wizard and workspace **remain functional** during pivot implementation. MVP may introduce parallel "Reference analysis" path on project detail before replacing wizard entry UX — exact migration is Phase 3 design decision.

---

## 8. Phase 1-F acceptance criteria

- [x] MVP inputs and outputs frozen
- [x] Deferred features listed with reasons
- [x] Acceptance and success criteria documented
- [ ] Human sign-off on MVP cut line
