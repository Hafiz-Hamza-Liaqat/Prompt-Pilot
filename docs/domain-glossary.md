# Domain Glossary

**Project:** Prompt Pilot

Related documents: [Product Contract](product-contract.md) · [MVP Scope](mvp-scope.md) · [User Journey](user-journey.md)

This glossary defines canonical product terminology. All documents and future code should use these terms consistently.

**Foundation lock (PP-03):** Pivot terms from [PP-02](../pp-02/01-reference-video-analysis-specification.md) are authoritative for Reference, Analysis, Package, Job, and Fingerprint. Legacy terms below remain valid until Migration Phase E.

---

## Pivot concepts (PP-02 / PP-03)

### Reference

The **user-submitted intake artifact** attached to a **Project**: a public platform URL (e.g. YouTube), user upload (video/audio), transcript, or script. Records provenance, access status, and rights attestation — not interpretive content.

> **Not to be confused with:** **Video Brief** (user planning intent) or legacy brief `source_*` fields (being split to Reference entity).

### Reference Video Analysis

The **canonical structured intelligence snapshot** produced by Core Analysis from a Reference. Immutable per `analysisVersion`. Contains observed facts and derived analysis only — **no** compiled prompts, SEO packages, or blueprints.

Schema: `ReferenceVideoAnalysisSchema` in `src/domain/canonical/referenceVideoAnalysis.ts`.

### Analysis

Synonym for a saved **Reference Video Analysis** snapshot. The canonical object name is **ReferenceVideoAnalysis**.

### Package

A **typed, versioned output** from the **Package Engine** derived from exactly one Reference Video Analysis (plus optional Video Brief). Types: Blueprint, Prompt, SEO, Marketing, Repurposing. Never media.

Schema: `PackageEnvelopeSchema` in `src/domain/canonical/package.ts`.

### Package Engine

Conceptual generator layer that produces **Packages** from Reference Video Analysis. Must not access original video, audio, or platform APIs.

### Job

An **asynchronous unit of work** driving the AI Pipeline for one Reference: validate → intake → fingerprint → analyze → generate packages → save.

Schema: `JobRecordSchema` in `src/domain/canonical/job.ts`.

### Content Fingerprint

A **stable content identity** for cache lookup and deduplication. Not analysis; answers whether identical content was processed before.

Schema: `ContentFingerprintSchema` in `src/domain/canonical/contentFingerprint.ts`.

### Workspace

The authenticated UI where users view Project context: Reference status, Reference Video Analysis sections, Packages, and Exports. Presentation layer only.

---

## Core concepts

### Video Brief

The normalized input describing what the user wants to create: source material, objective, destination, category, duration, style, and constraints. The brief is the input to plan generation.

### Production Plan

The complete structured output of Prompt Pilot. Contains all sections defined in [Product Contract — Definition of a successful production plan](product-contract.md#7-definition-of-a-successful-production-plan). A Production Plan is a document of prompts and instructions — not a rendered video file.

### Publishing Destination

Where the finished video will be published: YouTube, Instagram Reels, TikTok, a website, etc. Destinations define aspect ratio, duration norms, and **Platform Adaptation** rules.

> **Not to be confused with:** AI video **Provider** (Veo, Sora, Runway, etc.).

### Video Category

One of the 12 supported content types (e.g., product advertisement, explainer video). Categories influence complexity scoring, scene structure, and prompt templates.

---

## Scene and clip hierarchy

### Scene

A contiguous narrative unit within a Production Plan. Each scene has a duration, description, shots, and a provider-specific **Compiled Prompt**. Scenes are planned in Prompt Pilot; clips are generated externally.

### Shot

A single visual beat within a scene (e.g., wide establishing shot, product close-up). Shots inform prompt detail but are not individually generated in MVP unless decomposed into separate scenes.

### Clip

An individual video segment generated on an external AI video provider. A clip corresponds to one scene (or shot, if decomposed). Prompt Pilot produces the prompt; the provider produces the clip.

### Scene Timeline

The ordered list of scenes with start times, durations, and transitions. Total scene duration must equal the Production Plan target duration.

### Canonical Scene

The authoritative scene definition stored in the Production Plan. Edits create new versions; the canonical scene is the current source of truth for prompts and continuity.

---

## Duration distinction

| Term | Meaning |
|---|---|
| **Production Plan duration** | Total target length (e.g., 3 minutes). Assembled from multiple scenes/clips. |
| **Scene duration** | Length allocated to one scene (e.g., 10 seconds). |
| **Clip duration** | Length of one generated segment on an external provider. Often constrained by provider limits. |

Longer videos are assembled from multiple shorter scenes or clips. A 3-minute Production Plan may contain 18 scenes of 10 seconds each, each with its own prompt.

---

## Provider concepts

### Provider

An external AI video-generation platform: Google Veo, OpenAI Sora, Runway, Kling, or Adobe Firefly. Providers receive **Compiled Prompts**; they do not receive publishing-destination configuration directly.

> **Not to be confused with:** **Publishing Destination** (YouTube, Instagram, etc.).

### Provider Model

A specific model or tier within a provider (e.g., a named video model). Models have distinct capability profiles.

### Provider Capability

A documented feature or constraint of a provider or model: max clip duration, supported aspect ratios, text-to-video support, character consistency features, etc. Capabilities are versioned.

### Provider Recommendation

The system's suggested primary (and alternative) provider for a Production Plan, based on brief attributes and capability fit.

### Provider Fit Score

A deterministic numeric rating indicating how well a provider matches the plan's requirements. Not a universal quality ranking.

### Recommendation Confidence

A measure of how strongly the system supports its recommendation given available capability data. Low confidence triggers quality warnings.

---

## Prompt and continuity

### Prompt Compiler

The component that transforms scene descriptions and continuity locks into provider-specific **Compiled Prompts**. Output format varies by provider.

### Compiled Prompt

A ready-to-copy prompt formatted for a specific provider and scene. Includes visual description, style references, continuity anchors, and provider-specific constraints.

### Continuity Bible

A structured set of locks ensuring visual consistency across scenes:

| Lock | Preserves |
|---|---|
| **Character Lock** | Appearance, wardrobe, age, demeanor of people or characters |
| **Product Lock** | Branding, packaging, color, labeling of products |
| **World Lock** | Setting, location, time of day, environment details |
| **Style Lock** | Color grade, camera style, film stock, aesthetic treatment |

### Prompt Quality Audit

Automated review of compiled prompts for completeness, ambiguity, provider constraint violations, and continuity gaps. Produces **Quality warnings**.

---

## Scoring and analysis

### Complexity Score

Deterministic rating of how difficult the Production Plan is to execute: scene count, continuity requirements, visual effects, dialogue, etc.

### Production Risk Score

Deterministic rating of likelihood that the plan will fail or require significant rework: provider capability gaps, duration constraints, likeness concerns, etc.

### Source Analysis

**Legacy (deprecated for new modules).** Structured extraction and normalization of user input (idea, script, URL content) into brief fields. Evolves into **Reference Video Analysis** — see [compatibility.md](pp-03/compatibility.md).

Schema: `SourceAnalysisSchema` (deprecated) → target `ReferenceVideoAnalysisSchema`.

---

## Workflow and output

### Platform Adaptation

Adjustments to aspect ratio, duration, hook structure, captions, and CTA placement for a specific **Publishing Destination**.

### Editing Roadmap

Post-generation assembly instructions: clip order, transitions, VO placement, caption timing, and export settings for the destination.

### Generation Order

Recommended sequence for generating clips on the external provider, accounting for dependencies and continuity setup.

### Export

Copy or download of structured output. In the pivot model, an **Export** serializes one or more **Packages** (and metadata) for handoff to external tools — not a rendered video file.

Legacy: copy/download of the complete **Production Plan** (JSON, Markdown, or clipboard-ready text).

Schema: `ExportRecordSchema` in `src/domain/canonical/export.ts`.

### Capability Version

A versioned snapshot of a provider's documented capabilities. Admin updates create new versions; existing plans reference the version active at generation time.
