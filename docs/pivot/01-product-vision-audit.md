# Product Vision Audit — Phase 1-A

**Project:** Prompt Pilot  
**Evolution:** AI Content Intelligence Platform  
**Status:** Documentation only — no implementation in this phase  
**Related:** [Product Requirements Specification](02-product-requirements-specification.md) · [Master Roadmap](../prompt-pilot-roadmap.md) · [Legacy Product Contract](../product-contract.md)

This document defines the **official product direction** after the pivot. It does not replace historical implementation documentation for Phases 0–11-B; it defines the contract for all future work.

---

## 1. Official product statement

**Prompt Pilot** is a provider-neutral **AI Content Intelligence Platform** that helps creators and teams understand public reference content, extract structured production intelligence, and produce **transformative, provider-ready prompt packages and repurposing outputs** — without generating, rendering, or hosting media itself.

Prompt Pilot analyzes **authorized inputs** (public platform links, user uploads, transcripts, and scripts), converts observations into structured intelligence, and compiles actionable creative and marketing artifacts for external tools.

---

## 2. Core problem statement

Creators and marketers face four recurring gaps:

1. **Reference understanding** — They see a video that works but cannot decompose *why* it works (hook, pacing, structure, visual language, audio, CTA).
2. **Production translation** — They cannot turn reference observations into a reproducible shot plan, scene roadmap, or AI-video prompt package.
3. **Platform fragmentation** — Each AI video, image, and content tool expects different prompt syntax, constraints, and workflow steps.
4. **Repurposing friction** — One reference asset should yield blog, social, SEO, and course outlines — but manual rework is slow and inconsistent.

Prompt Pilot addresses these gaps with **structured intelligence and compilation**, not media generation.

---

## 3. Value proposition

| For the user | Prompt Pilot delivers |
|---|---|
| Speed | Structured analysis and prompt packages in minutes, not hours of manual breakdown |
| Clarity | Observable vs inferred labels; explainable sections, not opaque AI prose |
| Neutrality | Provider-neutral recommendations and multi-provider prompt variants |
| Safety | Public-content boundaries, rights attestation, transformative-output rules |
| Reuse | Projects, workspace, and deterministic engines from the existing codebase |
| Honesty | No fake generation, no downloader, no watermark removal, no media hosting |

**One-line value proposition:** Turn reference content into a complete, copy-ready intelligence and prompt package for AI production and marketing — without Prompt Pilot generating media.

---

## 4. Target users

| Segment | Primary need |
|---|---|
| **YouTubers** | Decompose reference videos into hooks, retention patterns, and Veo/Runway-ready prompts |
| **Instagram creators** | Reel structure, carousel repurposing, visual/style breakdown |
| **TikTok creators** | Short-form hook/pacing analysis and vertical prompt packages |
| **Facebook creators** | Reel and feed adaptation, CTA and audience framing |
| **Marketing agencies** | Repeatable reference-to-brief workflows for client concepts |
| **AI filmmakers** | Scene roadmap, continuity, and provider-specific prompt variants |
| **Small businesses** | Product-demo and ad structure without a production team |
| **Course creators** | Reference-to-outline and module repurposing |
| **Freelancers** | Client-ready analysis, shot lists, and exportable prompt packages |

---

## 5. Supported platforms and inputs

### Current MVP (pivot target)

| Input | MVP status | Notes |
|---|---|---|
| **YouTube URL** | In MVP | Public video metadata and permitted analysis path only |
| **User video upload** | In MVP | User-owned upload with size/duration caps |
| **Audio upload** | In MVP | User-owned; transcription when permitted |
| **Transcript** | In MVP | Paste or upload; treated as untrusted input |
| **Script** | In MVP | Reuses existing brief `script` source pattern |

### Future (post-MVP)

| Input | Status |
|---|---|
| **Instagram URL** | Future — platform research and official API path required |
| **Facebook URL** | Future — platform research and official API path required |
| **TikTok URL** | Future — platform research and official API path required |

### Deferred

| Input | Status |
|---|---|
| **X (Twitter) API** | Deferred — no official integration in MVP; footer social link remains optional |

**Publishing destinations** (YouTube, TikTok, Instagram, etc.) remain distinct from **reference intake platforms** — see [Domain Glossary](../domain-glossary.md).

---

## 6. Out of scope (explicit non-goals)

Prompt Pilot will **not**:

| Boundary | Requirement |
|---|---|
| Social-media downloader | No bulk or programmatic download of third-party platform videos for redistribution |
| Piracy | No facilitation of unauthorized copying or reposting |
| Copyright circumvention | No instructions to replicate protected works exactly |
| Unauthorized platform access | No bypass of login walls, geo blocks, age gates, or private content |
| AI video generation | No in-app video rendering or provider job execution |
| AI image generation | No in-app image rendering |
| AI voice generation | No voice cloning or synthetic voice delivery |
| Watermark removal | No removal or bypass of watermarks |
| Identity cloning | No face, voice, or public-figure impersonation instructions |
| Media hosting | No CDN replacement for YouTube, TikTok, or user social accounts |
| Auto-publishing | No posting to social platforms on the user's behalf |

These boundaries apply to **all phases** unless explicitly approved through product and legal review.

---

## 7. Relationship to legacy documentation

| Document | Status after pivot |
|---|---|
| [product-contract.md](../product-contract.md) | **Superseded for forward work** by PRS and MVP definition; retained for historical context |
| [mvp-scope.md](../mvp-scope.md) | **Superseded for forward work** by [06-mvp-definition.md](06-mvp-definition.md) |
| [phase-roadmap.md](../phase-roadmap.md) | **Superseded** by [prompt-pilot-roadmap.md](../prompt-pilot-roadmap.md) for future phases |
| [implementation-checklist.md](../implementation-checklist.md) | Retains **historical** Phase 0–11-B status only |
| Implemented code (Phases 2–11-B) | **Reused** — auth, projects, brief wizard, workspace, catalogue, deterministic engines |

---

## 8. Phase 1-A acceptance criteria

- [x] Official product statement documented
- [x] Problem, value proposition, and target users defined
- [x] Supported platforms and deferred inputs listed
- [x] Out-of-scope boundaries explicit
- [x] Legacy doc relationship stated
- [ ] Human approval of product statement (required before Phase 2)
