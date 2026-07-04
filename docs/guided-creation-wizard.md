# Guided Creation Wizard

**Project:** Prompt Pilot

Related documents: [User Journey](user-journey.md) · [MVP Scope](mvp-scope.md) · [Structured Output Contracts](structured-output-contracts.md) · [Database and Auth Foundation](database-auth-foundation.md) · [Project Management Foundation](project-management-foundation.md) · [Implementation Checklist](implementation-checklist.md)

Phase 6 implements a secure, persistent, nine-step wizard that collects and validates AI video production requirements. Prompt Pilot does not generate videos or images, analyze URLs, recommend providers, or call AI models in this phase.

---

## Scope

Phase 6 delivers:

| Capability | Description |
|---|---|
| Persistent video-brief draft | One draft per project, saved to `public.video_briefs` |
| Nine-step workflow | Source through Review with server-enforced step order |
| Active-project editing | Brief creation and updates allowed only on active (non-archived) projects |
| Review | Structured summary of all saved fields with edit links to prior steps |
| Ready status | User marks a complete brief ready via the completion RPC |
| Reopening after edits | Any content change clears `completed_at` and returns the brief to draft |

This phase collects and validates user requirements only. It does not analyze sources, recommend providers, create scenes, compile prompts, or invoke external services. Completed brief data is stored in `public.video_briefs` only; scene timing added in Phase 9 is derived later and is not persisted.

---

## Supported sources

The wizard exposes exactly four source types:

| Source type | Input | Validation |
|---|---|---|
| Idea | Source text | Trimmed, 10–5,000 characters |
| Script | Source text | Trimmed, 10–20,000 characters |
| Product page URL | Source URL | HTTP/HTTPS only, max 2,048 characters, no credentials |
| Article URL | Source URL | HTTP/HTTPS only, max 2,048 characters, no credentials |

Only the field relevant to the selected source type is populated. The other source field is cleared on save.

### Intentional deferrals

- **URLs are stored and validated only.** Product and article URLs are not fetched, resolved, or extracted in Phase 6. Source-page extraction is deferred to Phase 17–19.
- **Templates are deferred.** The broader product contract includes `template` as a source type, but the wizard does not expose a disabled or fake template control. Template-based creation remains deferred until the approved template module (Phase 24).

---

## Wizard steps

| # | Step | Collects |
|---|---|---|
| 1 | `source` | Source type and idea, script, or URL |
| 2 | `objective` | Working title, objective, target audience |
| 3 | `destination` | Publishing destination and aspect ratio |
| 4 | `category` | Video category (12 MVP categories) |
| 5 | `duration` | Target duration (presets or custom 5–180 seconds) |
| 6 | `style` | Visual style and tone |
| 7 | `requirements` | Production requirement booleans |
| 8 | `priorities` | Budget priority, quality priority, optional constraints |
| 9 | `review` | Summary, edit links, and “Mark brief ready” completion |

The review step collects no new input fields. It validates the saved draft and performs the completion action.

Machine-safe step values and UI configuration live in `src/domain/videoBriefDraft.ts` and `src/config/video-brief-wizard.ts`.

---

## Data model

### `public.video_briefs`

| Property | Detail |
|---|---|
| Cardinality | One brief per project (`project_id` unique) |
| Ownership | Inherited from parent `public.projects`; no `owner_id` column on the brief |
| Cascade | Hard delete of a project removes its brief |
| Completion | `completed_at` set only when every required field is valid |
| Reopen | Database trigger clears `completed_at` when user-editable content changes |

Key columns: source fields, objective fields, destination fields, category, duration, style, **14** production-requirement booleans, budget and quality priorities, optional `user_constraints`, timestamps.

Production requirement count: **14**. The canonical keys, Zod schema, database-column mapping, checkbox parser, and UI labels live in the shared client-safe module `src/domain/productionRequirements.ts`. Both the final `VideoBriefSchema` and the wizard draft consume this module. Exhaustive parity tests guard UI, repository, and database mappings. Adding a new requirement requires an explicit product-contract and migration phase.

Draft input contracts are defined in `src/domain/videoBriefDraft.ts`. The final planning contract in `src/domain/videoBrief.ts` (`VideoBriefSchema`) remains authoritative for later phases and is not weakened by the draft layer.

### Archived-project behavior

| Operation | Active project | Archived project |
|---|---|---|
| Read brief | Allowed | Allowed |
| Insert brief | Allowed | Denied |
| Update brief | Allowed | Denied |
| Complete brief | Allowed | Denied |

### Soft-delete visibility

When a parent project is soft-deleted (`deleted_at IS NOT NULL`), its brief is hidden by RLS and cannot be read or updated.

---

## Security

| Control | Implementation |
|---|---|
| Row Level Security | Enabled and forced on `public.video_briefs` |
| Ownership | Access gated through parent project belonging to `(select auth.uid())` |
| No owner ID on brief | Caller identity comes from Auth, not form input |
| Anonymous access | Revoked on table and completion RPC |
| SQL DELETE | Not granted to authenticated users |
| Column-limited UPDATE | `completed_at`, `id`, `project_id`, and timestamps are not directly updatable |
| Completion RPC | `prompt_pilot_complete_video_brief(project_uuid)` — security definer, ownership and completeness checks |
| Server Actions | Each action calls `requireUser()` independently; no user-supplied owner IDs |
| No service-role client | Application uses authenticated server client only |
| No external URL fetch | Submitted URLs are validated and stored only |
| Error handling | Safe action states; no raw Supabase or Postgres messages exposed |

Completion uses the transaction-local session flag `prompt_pilot.completing_brief` (`set_config(..., true)`) so the reopen trigger does not clear `completed_at` during the approved completion update. The flag is cleared on success and in exception handlers.

---

## Application architecture

| Layer | Location |
|---|---|
| Draft domain contracts | `src/domain/videoBriefDraft.ts` |
| Wizard configuration | `src/config/video-brief-wizard.ts` |
| Repository interface | `src/server/briefs/video-brief-repository.ts` |
| Supabase repository | `src/server/briefs/supabase-video-brief-repository.ts` |
| Service boundary | `src/server/briefs/video-brief-service.ts` |
| Server Actions | `src/app/projects/[projectId]/brief/actions.ts` |
| Wizard routes | `src/app/projects/[projectId]/brief/page.tsx`, `[step]/page.tsx` |
| Wizard UI | `src/components/briefs/*` |

---

## Routes

| Route | Purpose |
|---|---|
| `/projects/[projectId]/brief` | Redirect to first incomplete step or review |
| `/projects/[projectId]/brief/[step]` | Single step form or review (`source` … `review`) |

Protected by existing `/projects/*` session refresh. Every page and Server Action authenticates independently.

---

## UX

| Behavior | Detail |
|---|---|
| Saved step progress | Each step persists on save; refresh restores the draft |
| Progressive enhancement | Forms use Server Actions with real pending states |
| Pending states | Submit buttons disabled while a save is in flight |
| Validation states | Field-level Zod messages; no raw database text |
| Reachable-step enforcement | Server redirects unreachable later steps to the first incomplete step |
| Earlier-step revisits | Completed prior steps remain navigable |
| Review and completion | Structured summary; “Mark brief ready” — not “Generate plan” or “Create video” |
| Progress indicator | Represents saved input-step completion only, not AI or media generation |
| Project detail status | Not started, Draft, or Ready with contextual action label |
| Archived projects | Status shown; editing blocked until project is restored |

Approved brief notices on project detail: `brief-ready`, `brief-reopened`, `project-archived`.

---

## Deferred functionality

Phase 6 explicitly does not implement:

| Area | Target phase |
|---|---|
| Provider catalogue | Phase 7 |
| Provider scoring and recommendations | Phases 10–11 |
| Scene planning and decomposition | Phase 9 (structural timing from saved duration only) |
| Prompt compilation | Phase 15 |
| AI generation and planning | Phases 12–13 |
| Source URL extraction (Firecrawl) | Phases 17–19 |
| Template library | Phase 24 |
| Sharing, teams, billing | Post-MVP |
| Deployment and cloud Supabase | Explicit user approval |

---

## Local verification

Phase closure includes SQL tests (`supabase/tests/database/video_briefs.test.sql`), unit tests under `tests/briefs/`, and local RLS integration via `npm run verify:briefs:local`.
