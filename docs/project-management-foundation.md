# Project Management Foundation

**Project:** Prompt Pilot

Related documents: [Database and Auth Foundation](database-auth-foundation.md) · [Application Foundation](application-foundation.md) · [Implementation Checklist](implementation-checklist.md)

Phase 5 establishes secure, persistent project management for authenticated users on the local Supabase stack. Phase 6 adds video-brief status and wizard entry on the project detail page. Phase 8 adds a completed-brief gate and link to the result workspace preview. Phase 9 updates supporting copy to describe deterministic scene timing alongside remaining static preview sections.

---

## Scope

Authenticated users can:

- Open a protected project dashboard at `/projects`
- Create a project with title and optional short description
- List only their own non-deleted projects
- Search by title and description
- Filter active, archived, or all projects
- Sort by updated time, creation time, or title
- Open a project detail page
- Rename a project and update its description
- Archive and restore projects
- Duplicate a project with a deterministic copied title
- Soft-delete a project through an explicit confirmation page

Phase 5 does **not** include AI planning, provider recommendations, or any media generation. Phase 6 adds video-brief collection on active projects only; see [Guided Creation Wizard](guided-creation-wizard.md).

---

## Data model

### `public.projects`

| Column | Purpose |
|---|---|
| `id` | UUID primary key |
| `owner_id` | References `auth.users(id)` with `ON DELETE CASCADE` |
| `title` | Trimmed title (1–120 characters, no control characters) |
| `description` | Optional trimmed description (max 500 characters) or `null` |
| `archived_at` | `null` = active; non-null = archived |
| `deleted_at` | `null` = visible; non-null = soft-deleted |
| `created_at` | Creation timestamp |
| `updated_at` | Maintained by `prompt_pilot_set_updated_at` trigger |

Application status is derived from `archived_at`:

```text
archived_at IS NULL     → active
archived_at IS NOT NULL → archived
```

No separate status column exists. Titles are not globally unique per user.

---

## Security

| Control | Implementation |
|---|---|
| Row Level Security | Enabled and forced on `public.projects` |
| Anonymous access | Revoked |
| SELECT | Own rows where `deleted_at IS NULL` |
| INSERT | Own rows only (`owner_id = auth.uid()`) |
| UPDATE | Own non-deleted rows; immutable columns protected by trigger |
| SQL DELETE | Not granted to authenticated users |
| Soft delete | `prompt_pilot_soft_delete_project()` security-definer RPC |
| Owner filter | Repository queries always filter by trusted `owner_id` |
| Server Actions | Each action independently calls `requireUser()` via `getUser()` |
| Inaccessible projects | Return `notFound()` — no cross-user enumeration |
| Service role | Not used in application code |

Soft delete uses a security-definer function because PostgreSQL requires updated rows to satisfy SELECT policies; setting `deleted_at` would otherwise violate the SELECT policy on the new row.

---

## Application architecture

| Layer | Location |
|---|---|
| Domain contracts | `src/domain/project.ts` |
| Repository interface | `src/server/projects/project-repository.ts` |
| Supabase repository | `src/server/projects/supabase-project-repository.ts` |
| Service boundary | `src/server/projects/project-service.ts` |
| Authorization helper | `src/server/auth/require-user.ts` |
| Server Actions | `src/app/projects/actions.ts` |
| Dashboard | `src/app/projects/page.tsx` |
| Detail | `src/app/projects/[projectId]/page.tsx` |
| Delete confirmation | `src/app/projects/[projectId]/delete/page.tsx` |

---

## Pagination

- Fixed page size: **12**
- Maximum page: **10,000**
- Default sort: `updated_desc`
- Default filter: `active`
- Server-side bounded queries only

---

## User experience states

| State | Behavior |
|---|---|
| Empty | No projects exist for the user |
| Filter empty | No active or archived projects in current filter |
| Search empty | No matches for the search term |
| Pending | Submit buttons disabled via `useFormStatus` |
| Success | Approved `notice` query parameters only |
| Validation failure | Field-level messages from Zod; no raw database text |
| Persistence error | Safe recoverable error code |

---

## Video brief integration

The project detail page (`/projects/[projectId]`) displays a **Video brief** section:

| Brief status | User action (active project) |
|---|---|
| Not started | Start video brief → `/projects/[projectId]/brief` |
| Draft | Continue video brief → wizard entry redirect |
| Ready | Review video brief → wizard entry redirect |

Archived projects show status without an editing action. Restore the project before editing the brief.

Approved brief notices: `brief-ready`, `brief-reopened`.

---

## Deferred features

- Provider catalogue and recommendations (Phases 7–11)
- AI planning and prompt compilation (Phases 12–16)
- Sharing, teams, and workspaces
- Billing and usage limits
- Cloud Supabase deployment
