# Application Foundation

**Project:** Prompt Pilot

Related documents: [Implementation Checklist](implementation-checklist.md) · [Structured Output Contracts](structured-output-contracts.md) · [Phase Roadmap](phase-roadmap.md)

Phase 2 established a minimal, production-buildable Next.js App Router foundation. Phase 3 adds the UI design system and public application shell. Phase 4 adds local Supabase database and authentication. Phase 5 adds secure project dashboard and management. Phase 6 adds the guided video-brief creation wizard.

---

## Architecture established

| Layer | Technology |
|---|---|
| Application framework | Next.js App Router |
| UI library | React |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix primitives) |
| Language | TypeScript (strict) |
| Linting | ESLint with `eslint-config-next` |
| Domain validation | Zod (Phase 1 contracts in `src/domain/`) |
| Database / Auth | Local Supabase (Phase 4) |
| Testing | Vitest + Supabase pgTAP SQL tests |

Central product identity lives in `src/config/site.ts` and is consumed by application metadata and the landing page.

---

## Current routes

| Route | Purpose |
|---|---|
| `/` | Public landing page with hero, workflow, capabilities, and scope sections |
| `/auth/sign-in` | Email/password sign in |
| `/auth/sign-up` | Account creation |
| `/auth/callback` | Auth code exchange |
| `/auth/error` | Safe authentication error page |
| `/account` | Protected account foundation with link to projects |
| `/projects` | Protected project dashboard (create, search, filter, sort, paginate) |
| `/projects/[projectId]` | Project detail, video brief status, edit, archive/restore, duplicate |
| `/projects/[projectId]/brief` | Wizard entry — redirects to first incomplete step or review |
| `/projects/[projectId]/brief/[step]` | Wizard step (`source` … `review`) |
| `/projects/[projectId]/delete` | Soft-delete confirmation |

The root layout includes a site header, skip navigation link, and site footer. Session refresh runs through `src/proxy.ts`. Project routes use a dedicated app header with Projects, Account, and sign-out navigation.

Framework-level boundaries (not separate URL routes):

| Boundary | File |
|---|---|
| Loading | `src/app/loading.tsx` |
| Error | `src/app/error.tsx` |
| Not found | `src/app/not-found.tsx` |

---

## Product honesty

The Phase 6 foundation explicitly does **not** include:

- Video generation
- Image generation
- AI provider connections or recommendations
- Cloud Supabase or deployment
- URL fetching or source extraction
- External API calls beyond local Supabase Auth

The landing page, marketing configuration, and `siteConfig` state that Prompt Pilot produces plans, recommendations, prompts, and instructions only.

---

## Commands

Repository scripts (Cursor runs these during phase verification):

```powershell
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run start
npm run supabase:start
npm run supabase:reset
npm run supabase:test
npm run verify:auth:local
npm run verify:projects:local
npm run verify:briefs:local
```

| Script | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run lint` | ESLint across the repository |
| `npm run typecheck` | TypeScript validation without emit |
| `npm test` | Vitest (domain + foundation + project tests) |
| `npm run build` | Production build |
| `npm run start` | Serve production build locally |
| `npm run verify:projects:local` | Local project RLS integration verification |
| `npm run verify:briefs:local` | Local video-brief RLS integration verification |

---

## Dependency health

| Check | Status (Phase 6) |
|---|---|
| ESLint baseline | 0 errors, 0 warnings |
| npm audit | 2 moderate (transitive PostCSS via Next.js); 0 high; 0 critical |
| Forced audit fix | Not used (`npm audit fix --force` rejected) |
| High/critical accepted | None |

See [Dependency Risk Register](dependency-risk-register.md) for decision records, dependency paths, and review triggers.

---

## Deferred work

| Area | Target phase |
|---|---|
| Provider catalogue and mock workspace | Phases 7–8 |
| AI planning and prompt compilation | Phases 12–16 |
| Deployment and GitHub push | Explicit user approval after project completion |

---

## Node.js requirement

```text
Node.js >= 20.9.0
```

Declared in `package.json` under `engines`.
