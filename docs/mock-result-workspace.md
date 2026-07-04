# Mock Result Workspace

## Purpose

Phase 8 validates the future Prompt Pilot result information architecture without generating planning output. The workspace combines real project and completed-brief context with static sample layouts for scenes, prompts, continuity, audio/editing guidance, and quality review.

## Real data displayed

- Authenticated project title, description, and archived state
- Completed video brief summary and enabled production requirements
- Read-only provider catalogue references (five providers)

## Static data displayed

- Sample scene roadmap (four layout examples)
- Sample prompt package sections
- Sample continuity checklist organization
- Sample audio and editing layout slots
- Sample quality-review checklist

## Truthfulness

- No AI generation
- No provider recommendation or ranking
- No duration decomposition
- No prompt compilation
- No quality, risk, or match scoring
- No persisted planning output
- No provider execution

Every workspace page shows a prominent **Sample workspace preview** notice. Each sample section is marked **Sample** or **Interface preview**. The provider panel is labelled **Catalogue reference — not recommendations**.

## Persistence

Phase 8 creates **no database migration** and stores **no mock result data** in Supabase. The static fixture lives in version-controlled application code at `src/fixtures/mock-result-workspace.ts`.

## Access

- Authenticated project owner only
- Completed brief required (`completed_at` must be set)
- Deleted projects are inaccessible
- Archived projects may view the workspace read-only

Route: `/projects/[projectId]/workspace?section=<section>`

## Replacement map

| Phase 8 preview | Future phase |
|---|---|
| Sample scene roadmap | Phase 9+ duration and scene decomposition |
| Provider reference panel | Phase 11 provider recommendation |
| Sample prompt package | Phase 15 provider-specific prompt compilation |
| Continuity preview | Phase 16 continuity bible |
| Audio/editing preview | Phase 21 voiceover and editing roadmap |
| Quality preview | Phase 25 quality audit |

## Deferred work

- Actual result generation and persistence
- Recommendations and scoring
- Prompt compilation and export
- Sharing and provider execution
- Deployment
