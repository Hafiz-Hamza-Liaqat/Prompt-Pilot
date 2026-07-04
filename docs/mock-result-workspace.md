# Hybrid Result Workspace

## Purpose

The workspace preview combines real persisted input, a source-backed provider catalogue snapshot, deterministic scene timing, and static sample layouts for prompts, continuity, audio/editing guidance, and quality review.

Phase 8 introduced the workspace shell with static sample scenes. Phase 9 replaced the sample scene roadmap with deterministic duration decomposition while keeping other sections as static fixtures.

## Real data displayed

- Authenticated project title, description, and archived state
- Completed video brief summary and enabled production requirements
- Read-only provider catalogue references (five providers)
- Deterministic scene roadmap calculated from the saved brief duration

## Static data displayed

- Sample prompt package sections
- Sample continuity checklist organization
- Sample audio and editing layout slots
- Sample quality-review checklist

## Truthfulness

- Scene timing is rule-based and not AI-generated
- No provider recommendation or ranking
- No prompt compilation
- No quality, risk, or match scoring
- No persisted planning output
- No provider execution

Every workspace page shows a prominent **Planning workspace preview** notice. The scene section is labelled **Deterministic timing**. Remaining sample sections are marked **Sample** or **Interface preview**. The provider panel is labelled **Catalogue reference — not recommendations**.

See also [Duration and Scene Decomposition](./duration-scene-decomposition.md).

## Persistence

No database migration stores workspace or scene decomposition output. The static fixture lives in version-controlled application code at `src/fixtures/mock-result-workspace.ts`. Scene timing is derived on each request from the completed brief duration.

## Access

- Authenticated project owner only
- Completed brief required (`completed_at` must be set)
- Deleted projects are inaccessible
- Archived projects may view the workspace read-only

Route: `/projects/[projectId]/workspace?section=<section>`

## Replacement map

| Current preview | Future phase |
|---|---|
| Deterministic scene timing (structural only) | Phase 10+ scoring and creative scene content |
| Provider reference panel | Phase 11 provider recommendation |
| Sample prompt package | Phase 15 provider-specific prompt compilation |
| Continuity preview | Phase 16 continuity bible |
| Audio/editing preview | Phase 21 voiceover and editing roadmap |
| Quality preview | Phase 25 quality audit |

## Deferred work

- Actual result generation and persistence
- Recommendations and scoring
- Creative scene descriptions
- Prompt compilation and export
- Sharing and provider execution
- Deployment
