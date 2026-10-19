# Product Requirements Specification — Phase 1-B

**Project:** Prompt Pilot — AI Content Intelligence Platform  
**Status:** Documentation only  
**Related:** [Product Vision Audit](01-product-vision-audit.md) · [Feature Inventory](03-feature-inventory.md) · [MVP Definition](06-mvp-definition.md)

---

## 1. Vision

Evolve Prompt Pilot from a video-production planning tool into an **AI Content Intelligence Platform** that ingests authorized reference content, produces structured analysis, and compiles provider-ready prompts and repurposing outputs — while preserving the non-generative product boundary and reusing existing authentication, projects, workspace, and deterministic engines.

---

## 2. Goals

| ID | Goal |
|---|---|
| G1 | Accept MVP inputs: YouTube URL, video upload, audio upload, transcript, script |
| G2 | Produce structured core analysis (transcript, timeline, scenes, hooks, CTA, etc.) |
| G3 | Generate content blueprint artifacts (storyboard, shot list, camera/lighting guidance) |
| G4 | Compile provider-neutral and provider-specific prompts (Prompt Studio) |
| G5 | Support basic repurposing outputs (blog, social scripts, outlines) in later MVP+ phases |
| G6 | Maintain provider-neutral recommendations using existing catalogue engine |
| G7 | Operate within $100–120 total budget for first 3–5 months (see cost audit) |
| G8 | Support BYOK for AI providers when implemented (user-supplied keys, server-only) |
| G9 | Never generate, render, or deliver media inside Prompt Pilot |

---

## 3. Product scope

### In scope (platform direction)

- Project-scoped content intelligence workflows
- Reference intake (link, upload, transcript, script)
- Structured analysis outputs with observed/inferred labeling
- Content blueprint and Prompt Studio compilation
- Marketing and SEO intelligence modules (phased)
- Repurposing engine (phased)
- Credits and usage tracking (phased)
- Export/copy of text and JSON packages

### Out of scope

See [Product Vision Audit — Out of scope](01-product-vision-audit.md#6-out-of-scope-explicit-non-goals).

---

## 4. Inputs

| Input | Format | Validation (future) | MVP |
|---|---|---|---|
| YouTube URL | HTTPS public URL | Allowlist, SSRF-safe, no credentials | Yes |
| Video upload | User file | Size, duration, MIME, malware scan policy | Yes |
| Audio upload | User file | Size, duration, MIME | Yes |
| Transcript | Text or file | Length limits, untrusted sanitization | Yes |
| Script | Text | Reuse brief script validation | Yes |
| Instagram URL | HTTPS | Platform research gate | Future |
| Facebook URL | HTTPS | Platform research gate | Future |
| TikTok URL | HTTPS | Platform research gate | Future |

---

## 5. Outputs

| Output category | Examples | MVP |
|---|---|---|
| Core analysis | Transcript, timeline, scenes, hooks, CTA, emotions | Partial — prioritized subset |
| Content blueprint | Storyboard, shot list, camera/lighting suggestions | Partial |
| Prompt Studio | Provider-neutral master prompt; Veo, Runway, Kling variants | Partial |
| Marketing | Hook analysis, retention notes | Deferred post-MVP core |
| SEO | Title, meta, keywords, tags | Deferred |
| Repurposing | Blog, LinkedIn, reel script | Deferred |

Full inventory: [Feature Inventory](03-feature-inventory.md).

---

## 6. User roles

| Role | Description | MVP |
|---|---|---|
| **Anonymous visitor** | Public pages, catalogue, sign-up | Yes (existing) |
| **Authenticated user** | Own projects, analyses, exports | Yes (existing) |
| **Admin** | Catalogue management, capability seeds | Deferred (Phase 23 in legacy roadmap) |
| **BYOK user** | Supplies own AI provider API keys | Future implementation |

No multi-tenant organization or team roles in MVP.

---

## 7. User journey (target)

```text
Sign up / Sign in
→ Create or open project
→ Add input (YouTube URL | upload | transcript | script)
→ Attest rights (public / authorized / transformative use)
→ Submit for analysis (async job)
→ Review core analysis + blueprint
→ View provider recommendations (existing engine)
→ Open Prompt Studio (compiled prompts)
→ Copy or export package
→ Optional: repurposing outputs (later phase)
```

Existing brief wizard steps (objective, destination, duration, requirements) may **prefill from analysis** or run in parallel — exact UX is a Phase 3+ design decision.

---

## 8. Credits concept

**Credits** are abstract units consumed by billable operations (analysis, compilation, repurposing). They decouple user-facing limits from raw AI token cost.

| Principle | Rule |
|---|---|
| Granularity | One analysis job = base credit cost + duration/size multiplier |
| Free tier | Limited monthly credits for local/MVP validation |
| BYOK | When user supplies provider keys, platform credits may apply only to orchestration/storage |
| Transparency | Show estimated credit cost before job submission |
| No real billing in MVP | Credits tracked in software; payment integration deferred |

Implementation: **not in Phase 1** — documented for Phase 14+ in master roadmap.

---

## 9. Pricing concept (future)

| Tier | Direction |
|---|---|
| Free | Limited analyses/month, watermarked export notice, BYOK optional |
| Pro | Higher limits, full Prompt Studio, repurposing modules |
| Agency | Multiple seats (deferred), priority queue (deferred) |

**MVP:** No payment processor. Document limits only. Monetization requires human approval and budget validation.

---

## 10. Future roadmap

Authoritative sequence: [prompt-pilot-roadmap.md](../prompt-pilot-roadmap.md).

High-level milestones:

1. Pivot foundation (this phase — documentation)
2. Contract rebase and domain design
3. Link intelligence and URL safety
4. Upload engine and storage boundary
5. Core analysis (mock → real AI)
6. Content blueprint
7. Prompt Studio
8. Marketing, SEO, repurposing modules
9. Credits, cost controls, BYOK
10. Acceptance and deployment (explicit approval)

---

## 11. Deferred features

| Feature | Reason deferred |
|---|---|
| Instagram / Facebook / TikTok URL intake | Official platform research and API path not approved |
| X API integration | Explicitly deferred |
| Real-time collaboration | Out of legacy non-goals |
| In-app media generation | Product boundary |
| Payment/billing | Budget and legal gate |
| Admin dashboard | Post-MVP operations |
| Full marketing/SEO/repurposing suite | MVP focuses on analysis + Prompt Studio core |

---

## 12. Acceptance criteria (platform level)

- User can complete MVP journey without Prompt Pilot generating media
- All outputs labeled observed vs inferred where applicable
- Rights attestation required before analysis jobs
- SSRF-safe URL handling before any fetch implementation
- RLS prevents cross-user data access
- Credit/cost estimate shown before job run (when credits engine exists)
- Export produces copy-ready text/JSON
- Regression: existing auth, projects, brief, workspace flows remain functional until intentionally migrated

---

## 13. Non-functional requirements

| Category | Requirement |
|---|---|
| Security | Server-only secrets; BYOK keys never exposed to browser; SSRF protection on URL intake |
| Privacy | Minimize persisted media; TTL on temp storage; delete with project |
| Performance | Async jobs for analysis; p95 job time target TBD in Phase 5 |
| Cost | Stay within $100–120 total for months 1–3–5 (see cost audit) |
| Accessibility | Maintain existing WCAG baseline from UI design system |
| Testing | Each implementation phase independently testable (Vitest + integration scripts + SQL) |
| Observability | Job status, failure reason, cost per job (when implemented) |
| Honesty | No fake progress bars implying video rendering |

---

## 14. Phase 1-B acceptance criteria

- [x] Vision, goals, scope documented
- [x] Inputs, outputs, roles, journey documented
- [x] Credits and pricing concepts documented (not implemented)
- [x] Roadmap reference, deferrals, acceptance and NFRs documented
- [ ] Human approval before Phase 2 implementation planning
