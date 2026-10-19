# ReferenceVideoAnalysis Specification — PP-02 Steps 2 & 3

**Project:** Prompt Pilot — AI Content Intelligence Platform  
**Status:** Canonical domain language — no implementation  
**Related:** [Audit gate](00-architecture-audit-gate.md) · [Entity model](02-entity-relationship-model.md) · [Package Engine](04-package-engine.md)

This document is the **single source of truth for domain vocabulary**. Every future module, API, and UI copy must use these definitions exactly.

---

## Part A — Canonical domain language

### Analysis

The **structured intelligence snapshot** produced by the Core Analysis stage from a **Reference**. An Analysis is immutable once saved under a version number. The canonical Analysis object is **ReferenceVideoAnalysis**.

Analysis does not include SEO packages, blueprints, or compiled prompts — those are **Packages**.

### Reference

The **user-submitted intake artifact** attached to a **Project**: a public platform URL (e.g. YouTube), user upload (video/audio), transcript, or script. A Reference records provenance, access status, and rights attestation — not interpretive content.

One Project may have multiple References over time; one Reference may produce multiple Analysis versions.

### Package

A **typed, versioned output** produced by the **Package Engine** from exactly one **ReferenceVideoAnalysis** (plus optional **Video Brief** context). Examples: SEO Package, Blueprint Package, Prompt Package, Marketing Package, Repurposing Package.

A Package is generated text/structured data — never media.

### Prompt

A **single provider-oriented instruction artifact**, typically one scene or one generation unit. In Prompt Pilot, the schema unit is **Compiled Prompt** (`mainPrompt`, `negativeConstraints`, etc.). Prompts appear inside a **Prompt Package**, not inside ReferenceVideoAnalysis.

### Export

A **user-facing delivery action or artifact** that serializes one or more Packages (and metadata) for copy or download. Export is not analysis; it is the handoff boundary to external tools.

### Job

An **asynchronous unit of work** that drives the AI Pipeline for one Reference (validate → intake → fingerprint → analyze → generate packages → save). Jobs have lifecycle states defined in [06-job-state-machine.md](06-job-state-machine.md).

### Fingerprint

A **stable content identity** derived from Reference intake material used for **cache lookup** and deduplication. Fingerprint is not analysis; it answers "have we processed this content before?"

### Workspace

The **authenticated UI surface** where a user views the current Project context: Reference status, ReferenceVideoAnalysis sections, Packages, and Exports. Workspace is presentation; it does not own business logic.

### Video Brief

**Retained legacy term.** The normalized user intent captured by the nine-step wizard (objective, destination, duration, requirements). Video Brief informs Package generation and deterministic engines but is **not** a substitute for ReferenceVideoAnalysis.

### Production Plan

**Retained legacy term.** An optional umbrella document bundling brief, analysis summaries, packages, and export metadata. New work should prefer explicit **Packages** over expanding Production Plan monolith.

---

## Part B — Canonical object: ReferenceVideoAnalysis

### Purpose

**ReferenceVideoAnalysis** is the heart of Prompt Pilot. Everything downstream — Blueprint, Prompt Studio, SEO, Marketing, Repurposing — **consumes this object only**. No Package Engine module may re-analyze the original video, audio, or URL directly.

### Boundary rules

1. Contains **observed facts** and **derived analysis** only.
2. Every field carries a **confidence** classification (see Confidence section).
3. No AI prompt text, no SEO titles, no blueprint shot instructions, no compiled provider prompts.
4. Immutable per `analysisVersion`; corrections create a new version.
5. Linked to exactly one **Reference** and one **Fingerprint**.

### Identity

| Field | Description |
|---|---|
| `analysisId` | Unique identifier for this analysis snapshot |
| `projectId` | Owning project |
| `referenceId` | Source reference |
| `fingerprintId` | Content fingerprint used |
| `analysisVersion` | Monotonic version for this reference (1, 2, 3…) |
| `pipelineVersion` | Core Analysis algorithm/provider version |
| `createdAt` | Snapshot timestamp |
| `supersedesAnalysisId` | Prior version if this is a re-analysis |

---

### Section: Metadata

Platform and reference facts not requiring interpretation.

| Field | Description | Typical confidence |
|---|---|---|
| `referenceKind` | `youtube_url`, `video_upload`, `audio_upload`, `transcript`, `script` | observed |
| `platform` | Detected platform when URL (e.g. `youtube`) | observed |
| `canonicalUrl` | Normalized URL if applicable | observed |
| `platformContentId` | Platform video ID when safely derivable | observed |
| `title` | Title from metadata or user | observed / inferred |
| `authorLabel` | Channel/creator label when permitted | observed |
| `publishedAt` | Publication timestamp when permitted | observed |
| `durationSeconds` | Media duration | observed / measured |
| `aspectRatio` | Width:height classification | observed / measured |
| `language` | Primary language code | observed / inferred |
| `accessStatus` | `public`, `restricted`, `unavailable`, `blocked` | observed |
| `rightsAttestationId` | Link to user attestation record | observed |

---

### Section: Media

Describes the intake media characteristics — not the file bytes.

| Field | Description | Typical confidence |
|---|---|---|
| `mediaKind` | `video`, `audio`, `text` | observed |
| `resolution` | Pixel dimensions when video | measured |
| `frameRate` | FPS when known | measured |
| `hasVideoTrack` | Boolean | measured |
| `hasAudioTrack` | Boolean | measured |
| `storageLocator` | Opaque internal pointer to temp media (never exposed to client) | observed |

---

### Section: Transcript

Speech and text derived from media or supplied by user.

| Field | Description | Typical confidence |
|---|---|---|
| `transcriptText` | Full normalized transcript | observed / derived |
| `transcriptSegments` | Timecoded segments `{ startMs, endMs, text }` | observed / derived |
| `transcriptSource` | `user_supplied`, `platform_caption`, `speech_to_text` | observed |
| `transcriptLanguage` | Language of transcript | observed / inferred |

Transcript content is **untrusted input** for downstream compilation (prompt-injection aware).

---

### Section: Timeline

Continuous time model for the reference.

| Field | Description | Typical confidence |
|---|---|---|
| `totalDurationMs` | Total span | measured |
| `segments` | Ordered `{ startMs, endMs, label }` | derived |
| `averageShotLengthMs` | Mean cut length | measured / derived |
| `pacingLabel` | e.g. `fast`, `moderate`, `slow` | derived |

---

### Section: Scenes

Observed structural segments — **not** prescriptive plan scenes.

| Field | Description | Typical confidence |
|---|---|---|
| `sceneSegments` | Ordered list: `{ index, startMs, endMs, roleLabel, summary }` | derived |
| `sceneCount` | Integer | derived |
| `hookSegmentIndex` | Which segment is the hook | derived |
| `closingSegmentIndex` | Closing segment | derived |

**Note:** Roles here describe **observed structure**, not `SCENE_ROLES` from deterministic decomposition (that engine consumes **Video Brief** duration separately).

---

### Section: Objects

Notable visible objects or products.

| Field | Description |
|---|---|
| `detectedObjects` | `{ label, prominence, segmentIndexes[], confidence }` |

---

### Section: Characters

Non-identifying character presence.

| Field | Description |
|---|---|
| `characterPresence` | `{ description, segmentIndexes[], confidence }` — no names, no identity cloning data |

---

### Section: Locations

Settings and environments.

| Field | Description |
|---|---|
| `locations` | `{ label, segmentIndexes[], indoorOutdoor, confidence }` |

---

### Section: Camera

Observed cinematography language.

| Field | Description |
|---|---|
| `framingPatterns` | e.g. close-up dominant, wide establishing |
| `movementPatterns` | e.g. static, handheld, push-in |
| `anglePatterns` | e.g. eye-level, low angle |
| `subjectPlacement` | e.g. center-weighted, rule-of-thirds |

All **derived** unless measured from metadata.

---

### Section: Lighting

| Field | Description |
|---|---|
| `lightingMood` | e.g. high-key, low-key, natural |
| `lightingConsistency` | e.g. consistent, mixed |
| `colorTemperatureLabel` | warm / neutral / cool |

---

### Section: Editing

| Field | Description |
|---|---|
| `cutRate` | Cuts per minute | measured / derived |
| `transitionStyles` | e.g. hard cut, fade, swipe |
| `rhythmLabel` | e.g. staccato, flowing |
| `onScreenTextPresence` | boolean + segment indexes |

---

### Section: Story

High-level narrative observation — transformative, not script reproduction.

| Field | Description |
|---|---|
| `narrativeStructure` | e.g. problem → solution → proof → CTA |
| `storySummary` | One-paragraph non-verbatim summary |
| `messageTheme` | Core message theme |

---

### Section: Hooks

| Field | Description |
|---|---|
| `hookStartMs` | Hook start time |
| `hookDurationMs` | Hook length |
| `hookPattern` | e.g. question, shock stat, visual reveal |
| `hookSummary` | Non-verbatim hook description |

---

### Section: Audience

| Field | Description |
|---|---|
| `inferredAudience` | e.g. small business owners, Gen Z viewers |
| `audienceSignals` | Evidence bullets |

All **inferred** unless user brief overrides.

---

### Section: Emotions

| Field | Description |
|---|---|
| `emotionalTone` | e.g. energetic, calm, urgent |
| `emotionalArc` | e.g. rising tension, stable upbeat |

---

### Section: CTA

| Field | Description |
|---|---|
| `ctaPresent` | boolean |
| `ctaSegmentIndex` | segment index |
| `ctaPattern` | e.g. direct ask, soft suggestion, link prompt |
| `ctaSummary` | Non-verbatim CTA description |

---

### Section: SEO Seeds

**Observed linguistic seeds only** — not an SEO Package.

| Field | Description |
|---|---|
| `topicPhrases` | Phrases suitable for later SEO expansion |
| `entityMentions` | Named entities when factual and permitted |
| `categoryHints` | Content category signals |

SEO Package **generates** titles/tags from these seeds.

---

### Section: Confidence

Cross-cutting model applied to every field or field group.

| Value | Meaning |
|---|---|
| `observed` | Directly from platform metadata, user input, or measurement |
| `measured` | Computed from media signal (duration, cut count, resolution) |
| `derived` | Inferred by rules or AI from observed/measured data |
| `unknown` | Not determined |
| `unsupported` | Cannot be determined for this reference kind |

Each section includes a `confidence` map or per-field confidence where material.

---

### Section: Fingerprint

| Field | Description |
|---|---|
| `fingerprintId` | Canonical fingerprint identifier |
| `fingerprintAlgorithmVersion` | Version of fingerprint scheme |
| `fingerprintInputs` | Descriptive list of inputs included (not the algorithm) |

---

### Section: Analysis Version

| Field | Description |
|---|---|
| `analysisVersion` | Integer version for this reference |
| `isLatest` | Whether this is the current version for the reference |
| `changeReason` | e.g. `initial`, `reanalysis`, `correction` |

---

### Safety and rights (required subsection)

| Field | Description |
|---|---|
| `restrictedElements` | logos, identifiable people, copyrighted characters detected or flagged |
| `safetyWarnings` | content policy warnings |
| `transformationNotice` | Statement that outputs must be transformative |

Maps conceptually to legacy `SourceAnalysis.safetyWarnings` but expanded.

---

## Part C — Relationship to legacy SourceAnalysis

| Legacy `SourceAnalysis` | ReferenceVideoAnalysis |
|---|---|
| `sourceType`, `originalInput` | Metadata + Reference entity |
| `sourceSummary`, `keyFacts` | Story + SEO Seeds |
| `productFeatures` | Objects |
| `audienceHints` | Audience |
| `visualOpportunities` | Camera + Lighting |
| `factualClaims` / `unverifiedClaims` | Story + Confidence |
| `safetyWarnings` | Safety subsection |

Legacy schema remains until migration Phase E; new modules target ReferenceVideoAnalysis only.

---

## Steps 2–3 acceptance

- [x] Canonical definitions for Analysis, Reference, Package, Prompt, Export, Job, Fingerprint
- [x] ReferenceVideoAnalysis sections defined without package outputs
- [x] Confidence model defined
- [x] Rule: packages consume ReferenceVideoAnalysis only; no re-analysis in Package Engine
- [ ] Human approval of canonical object boundaries
