# Hybrid Result Workspace

## Purpose

The workspace preview combines real persisted input, a source-backed provider catalogue snapshot, deterministic scene timing, deterministic complexity and execution-risk assessment, and static sample layouts for prompts, continuity, and audio/editing guidance.

Phase 8 introduced the workspace shell with static sample scenes. Phase 9 replaced the sample scene roadmap with deterministic duration decomposition. Phase 10 replaced the static quality preview with rule-based complexity and execution-risk scoring.

## Real data displayed

- Authenticated project title, description, and archived state
- Completed video brief summary and enabled production requirements
- Read-only provider catalogue references (five providers)
- Deterministic scene roadmap calculated from the saved brief duration
- Deterministic production complexity and execution-risk assessment

## Static data displayed

- Sample prompt package sections
- Sample continuity checklist organization
- Sample audio and editing layout slots

## Truthfulness

- Scene timing is rule-based and not AI-generated
- Complexity and execution risk are planning heuristics, not success probabilities or quality scores
- No provider recommendation or ranking
- No prompt compilation
- No match scoring
- No persisted planning output
- No provider execution

Every workspace page shows a prominent **Planning workspace preview** notice. The scene section is labelled **Deterministic timing**. The complexity and risk section is labelled **Complexity and risk**. Remaining sample sections are marked **Sample** or **Interface preview**. The provider panel is labelled **Catalogue reference — not recommendations**.

See also [Duration and Scene Decomposition](./duration-scene-decomposition.md) and [Complexity and Risk Scoring](./complexity-risk-scoring.md).

## Persistence

No database migration stores workspace, scene decomposition, or scoring output. Prompt Pilot currently has seven application-owned public tables; none store scene timing or assessment scores. Static fixtures live in version-controlled application code at `src/fixtures/mock-result-workspace.ts`. Scene timing and complexity/risk assessments are derived on each request from the completed brief.

## Access

- Authenticated project owner only
- Completed brief required (`completed_at` must be set)
- Deleted projects are inaccessible
- Archived projects may view the workspace read-only

Route: `/projects/[projectId]/workspace?section=<section>`

## Replacement map

| Current preview | Future phase |
|---|---|
| Deterministic scene timing (structural only) | Creative scene content (Phase 13+) |
| Complexity and execution risk | Provider-specific suitability (Phase 11+) |
| Provider reference panel | Phase 11 provider recommendation |
| Sample prompt package | Phase 15 provider-specific prompt compilation |
| Continuity preview | Phase 16 continuity bible |
| Audio/editing preview | Phase 21 voiceover and editing roadmap |

## Deferred work

- Actual result generation and persistence
- Provider recommendation
- Creative scene descriptions
- Prompt compilation and export
- Sharing and provider execution
- Deployment
