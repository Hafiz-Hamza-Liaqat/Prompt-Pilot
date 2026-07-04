# Domain Glossary

**Project:** ScenePilot

Related documents: [Product Contract](product-contract.md) · [MVP Scope](mvp-scope.md) · [User Journey](user-journey.md)

This glossary defines canonical product terminology. All documents and future code should use these terms consistently.

---

## Core concepts

### Video Brief

The normalized input describing what the user wants to create: source material, objective, destination, category, duration, style, and constraints. The brief is the input to plan generation.

### Production Plan

The complete structured output of ScenePilot. Contains all sections defined in [Product Contract — Definition of a successful production plan](product-contract.md#7-definition-of-a-successful-production-plan). A Production Plan is a document of prompts and instructions — not a rendered video file.

### Publishing Destination

Where the finished video will be published: YouTube, Instagram Reels, TikTok, a website, etc. Destinations define aspect ratio, duration norms, and **Platform Adaptation** rules.

> **Not to be confused with:** AI video **Provider** (Veo, Sora, Runway, etc.).

### Video Category

One of the 12 supported content types (e.g., product advertisement, explainer video). Categories influence complexity scoring, scene structure, and prompt templates.

---

## Scene and clip hierarchy

### Scene

A contiguous narrative unit within a Production Plan. Each scene has a duration, description, shots, and a provider-specific **Compiled Prompt**. Scenes are planned in ScenePilot; clips are generated externally.

### Shot

A single visual beat within a scene (e.g., wide establishing shot, product close-up). Shots inform prompt detail but are not individually generated in MVP unless decomposed into separate scenes.

### Clip

An individual video segment generated on an external AI video provider. A clip corresponds to one scene (or shot, if decomposed). ScenePilot produces the prompt; the provider produces the clip.

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

Structured extraction and normalization of user input (idea, script, URL content) into brief fields.

---

## Workflow and output

### Platform Adaptation

Adjustments to aspect ratio, duration, hook structure, captions, and CTA placement for a specific **Publishing Destination**.

### Editing Roadmap

Post-generation assembly instructions: clip order, transitions, VO placement, caption timing, and export settings for the destination.

### Generation Order

Recommended sequence for generating clips on the external provider, accounting for dependencies and continuity setup.

### Export

Copy or download of the complete Production Plan in structured format (JSON, Markdown, or clipboard-ready text).

### Capability Version

A versioned snapshot of a provider's documented capabilities. Admin updates create new versions; existing plans reference the version active at generation time.
