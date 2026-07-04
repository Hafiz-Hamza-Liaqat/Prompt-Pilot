# Product Contract

**Project:** Prompt Pilot

Related documents: [MVP Scope](mvp-scope.md) · [User Journey](user-journey.md) · [Domain Glossary](domain-glossary.md) · [Safety and Content Boundaries](safety-and-content-boundaries.md) · [Phase Roadmap](phase-roadmap.md)

---

## 1. Product definition

Prompt Pilot is a **provider-neutral AI video planning and prompt-compilation platform**.

It sits above AI video-generation providers (Google Veo, OpenAI Sora, Runway, Kling, Adobe Firefly) and helps users move from raw source material to a structured **Production Plan** — a complete package of brief, recommendations, scene roadmap, provider-specific prompts, continuity instructions, and editing and publishing guidance.

The application does **not** generate videos or images. Users copy generated prompts and instructions into the recommended external platform.

---

## 2. Core user problem

Users who want to create AI-assisted video content frequently struggle with problems the product is designed to solve:

- **Platform selection** — They do not know which AI video platform fits their goal, budget, duration, or visual style.
- **Scene decomposition** — They do not know how to divide a longer video into short generated clips that providers can actually produce.
- **Provider-specific prompting** — Each platform expects different prompt structure, constraints, and vocabulary.
- **Continuity** — They lack a system for preserving character, product, world, and style consistency across scenes.
- **Post-generation workflow** — They do not know how to prepare voiceover, captions, audio, and editing instructions alongside generation prompts.
- **Multi-platform adaptation** — They do not know how to adapt one concept for YouTube, Instagram, Facebook, TikTok, and other destinations.

---

## 3. Product promise

Prompt Pilot transforms source material through a defined pipeline:

```text
Idea, script, article, or product page
→ normalized video brief
→ complexity and risk analysis
→ provider recommendation
→ scene roadmap
→ provider-specific prompt package
→ editing and publishing instructions
```

Every step produces **structured, reviewable output** — not a single unstructured block of text.

---

## 4. Initial target users

| Segment | Typical need |
|---|---|
| Solo content creators | Turn an idea into a actionable generation plan |
| Social media marketers | Adapt one concept for multiple destinations |
| Small businesses | Promote products without a production team |
| Freelancers | Deliver structured briefs to clients or platforms |
| YouTube creators | Plan intros, trailers, and short-form content |
| UGC creators | Structure authentic-style ad concepts |
| Marketing agencies | Standardize AI video planning workflows |
| Beginners on AI video platforms | Learn how to prompt and decompose videos |

---

## 5. Core product principles

1. **Provider-neutral recommendations** — Recommendations are explainable and based on fit, not permanent rankings.
2. **Structured outputs** — Plans use defined sections and fields, not unstructured prose dumps.
3. **Explainable platform recommendations** — Every recommendation includes rationale the user can evaluate.
4. **No fake video-generation claims** — The product never implies it rendered media.
5. **No direct video or image generation** — All media creation happens on external platforms.
6. **Duration-aware multi-scene planning** — Scene durations sum to the target video duration.
7. **User-controlled editing** — Users review and edit scenes before export.
8. **Versioned provider information** — Provider capabilities are catalogued and versioned, not assumed static.
9. **Safe link ingestion** — URL intake follows strict safety boundaries (see [Safety and Content Boundaries](safety-and-content-boundaries.md)).
10. **Stable and testable interactions** — Every major action has defined interaction states.

---

## 6. Product non-goals

The first product version will **not**:

- Generate videos
- Generate images
- Edit video files
- Download social-media videos
- Clone voices
- Clone people or public figures
- Automatically publish to social platforms
- Provide a full timeline editor
- Build a mobile application
- Support real-time team collaboration
- Integrate every AI-video provider on the market

These are explicit boundaries, not deferred bugs.

---

## 7. Definition of a successful production plan

A valid **Production Plan** must contain all of the following:

| Section | Purpose |
|---|---|
| Project summary | One-paragraph overview of the video concept |
| Target platform | Primary **Publishing Destination** |
| Target audience | Who the video is for |
| Video objective | What the video should achieve |
| Duration | Total target duration |
| Aspect ratio | Format for the destination |
| Video category | One of the supported categories |
| Visual style | Agreed aesthetic direction |
| Complexity score | Deterministic difficulty rating |
| Production-risk score | Deterministic risk rating |
| Recommended provider | Primary AI video provider |
| Alternative provider | Secondary option with rationale |
| Recommendation explanation | Why the primary provider fits |
| Scene timeline | Ordered scenes with durations |
| Scene-specific prompts | Provider-specific **Compiled Prompts** per scene |
| Continuity instructions | **Continuity Bible** locks for character, product, world, style |
| Voiceover or dialogue guidance | Script, tone, and delivery notes |
| Audio guidance | Music, SFX, and mix direction |
| Editing roadmap | Assembly order and post-production steps |
| Quality warnings | **Prompt Quality Audit** findings |
| Export-ready structured content | Copyable, machine-readable plan output |

A plan that omits any critical section above is incomplete and must not be presented as finished.
