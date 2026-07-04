# Hybrid Result Workspace

## Purpose

The workspace preview combines real persisted input, deterministic scene timing, deterministic complexity and execution-risk assessment, evidence-backed provider recommendations, and static sample layouts for prompts, continuity, and audio/editing guidance.

Phase 11 replaced the catalogue-reference provider panel with offering-level evidence-backed recommendations derived from the saved brief and current catalogue snapshot.

## Real data displayed

- Authenticated project title, description, and archived state
- Completed video brief summary and enabled production requirements
- Deterministic scene roadmap calculated from the saved brief duration
- Deterministic production complexity and execution-risk assessment
- Evidence-backed provider and offering recommendations with official source links

## Static data displayed

- Sample prompt package sections
- Sample continuity checklist organization
- Sample audio and editing layout slots

## Truthfulness

- Scene timing, complexity, execution risk, and provider recommendations use transparent deterministic rules
- Recommendations are evidence-backed planning heuristics, not success probabilities or quality scores
- No provider execution or account verification
- No prompt compilation
- No persisted planning output

Every workspace page shows a prominent **Planning workspace preview** notice.

See also [Duration and Scene Decomposition](./duration-scene-decomposition.md), [Complexity and Risk Scoring](./complexity-risk-scoring.md), and [Provider Recommendation Engine](./provider-recommendation-engine.md).

## Persistence

No database migration stores workspace, scene decomposition, scoring, or recommendation output. Prompt Pilot currently has seven application-owned public tables. Derived outputs are recalculated on each request.

Route: `/projects/[projectId]/workspace?section=<section>`

## Deferred work

- Provider execution
- Prompt compilation and export
- Recommendation persistence
- Sharing
- Deployment
