# Database and Authentication Foundation

**Project:** Prompt Pilot

Related documents: [Application Foundation](application-foundation.md) · [Implementation Checklist](implementation-checklist.md)

Phase 4 establishes a **local-only** Supabase database and email/password authentication foundation. Phase 5 adds the `public.projects` table with RLS and soft-delete RPC.

---

## Local architecture

| Component | Role |
|---|---|
| Supabase CLI | Local project configuration and migrations |
| Docker | Postgres, Auth, REST API, Studio containers |
| Postgres | Stores `public.profiles` and `public.projects` |
| Supabase Auth | Email/password signup, signin, signout |
| `@supabase/ssr` | Cookie-based session handling in Next.js |
| Next.js `proxy.ts` | Session refresh and `/account`, `/projects` route protection |

No hosted Supabase project is linked. No cloud deployment exists in this phase.

---

## Database schema

### `public.profiles`

| Column | Purpose |
|---|---|
| `id` | Primary key referencing `auth.users(id)` with `ON DELETE CASCADE` |
| `display_name` | Trimmed display name (2–80 characters) |
| `created_at` | Creation timestamp |
| `updated_at` | Maintained by `prompt_pilot_set_updated_at` trigger |

- No public email column
- No password, role, plan, or project fields
- Profile rows are created automatically by `prompt_pilot_handle_new_user` after Auth signup

### `public.projects`

| Column | Purpose |
|---|---|
| `id` | UUID primary key |
| `owner_id` | References `auth.users(id)` with `ON DELETE CASCADE` |
| `title` | Trimmed title (1–120 characters) |
| `description` | Optional description (max 500 characters) or `null` |
| `archived_at` | Archive timestamp; `null` = active |
| `deleted_at` | Soft-delete timestamp; `null` = visible |
| `created_at` | Creation timestamp |
| `updated_at` | Maintained by `prompt_pilot_set_updated_at` trigger |

See [Project Management Foundation](project-management-foundation.md) for dashboard and Server Action details.

### Row Level Security — profiles

- **Select:** authenticated users may read only `auth.uid() = id`
- **Update:** authenticated users may update only their own row (`USING` and `WITH CHECK`)
- **Insert/Delete:** not granted to normal authenticated users
- **Anonymous:** no profile access

### Row Level Security — projects

- **Select:** authenticated users may read own rows where `deleted_at IS NULL`
- **Insert:** authenticated users may insert own rows only
- **Update:** authenticated users may update own non-deleted rows; immutable columns protected by trigger
- **Soft delete:** `prompt_pilot_soft_delete_project()` RPC (security definer)
- **SQL DELETE:** not granted to authenticated users
- **Anonymous:** no project access

---

## Local environment

| File | Purpose |
|---|---|
| `.env.example` | Committed placeholders only |
| `.env.local` | Ignored; local public URL and publishable key only |

The application never uses the service-role key, database password, or JWT secret.

---

## Authentication flows

1. **Sign up** — `/auth/sign-up` creates an Auth user with `display_name` metadata; trigger creates profile
2. **Sign in** — `/auth/sign-in` establishes a cookie session
3. **Callback** — `/auth/callback` exchanges OAuth-style codes when required
4. **Sign out** — clears the session and returns to `/`
5. **Account** — `/account` requires authentication via `getUser()` and reads the current profile through RLS

---

## Security boundaries

- No raw Supabase provider errors shown to users
- No password or token logging
- Safe redirect helper blocks open redirects
- No service-role client in application code
- Cross-user profile access blocked by RLS (verified by SQL and integration tests)
- Local email confirmation disabled for deterministic testing only

---

## Local testing

Repository scripts:

```powershell
npm run supabase:start
npm run supabase:reset
npm run supabase:lint
npm run supabase:test
npm run supabase:types
npm run verify:auth:local
npm run verify:projects:local
npm run supabase:stop
```

Cursor runs the official phase verification pipeline during closure.

---

## Production differences deferred

- Email confirmation policy and SMTP
- Production redirect URLs
- Hosted Supabase project and secrets management
- CAPTCHA and rate-limit tuning
- OAuth providers
- Account recovery flows
- Deployment configuration

Production email-confirmation policy will be revisited before private beta.
