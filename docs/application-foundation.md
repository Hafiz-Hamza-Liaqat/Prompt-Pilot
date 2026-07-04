# Application Foundation

**Project:** Prompt Pilot

Related documents: [Implementation Checklist](implementation-checklist.md) · [Structured Output Contracts](structured-output-contracts.md) · [Phase Roadmap](phase-roadmap.md)

Phase 2 establishes a minimal, production-buildable Next.js App Router foundation around the existing Zod domain contracts.

---

## Architecture established

| Layer | Technology |
|---|---|
| Application framework | Next.js App Router |
| UI library | React |
| Language | TypeScript (strict) |
| Linting | ESLint with `eslint-config-next` |
| Domain validation | Zod (Phase 1 contracts in `src/domain/`) |
| Testing | Vitest |

Central product identity lives in `src/config/site.ts` and is consumed by application metadata and the landing page.

---

## Current routes

| Route | Purpose |
|---|---|
| `/` | Minimal truthful foundation landing page |

Framework-level boundaries (not separate URL routes):

| Boundary | File |
|---|---|
| Loading | `src/app/loading.tsx` |
| Error | `src/app/error.tsx` |
| Not found | `src/app/not-found.tsx` |

---

## Product honesty

The Phase 2 foundation explicitly does **not** include:

- Video generation
- Image generation
- AI provider connections
- Authentication
- Database access
- External API calls

The landing page and `siteConfig` state that Prompt Pilot produces plans, recommendations, prompts, and instructions only.

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
```

| Script | Purpose |
|---|---|
| `npm run dev` | Local development server |
| `npm run lint` | ESLint across the repository |
| `npm run typecheck` | TypeScript validation without emit |
| `npm test` | Vitest (domain + foundation tests) |
| `npm run build` | Production build |
| `npm run start` | Serve production build locally |

---

## Dependency health

| Check | Status (Phase 2-A) |
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
| Tailwind CSS and shadcn/ui | Phase 3 |
| Authentication and Supabase | Phase 4 |
| Dashboard, wizard, provider catalogue | Phases 5–8 |
| AI planning and prompt compilation | Phases 12–16 |
| Deployment and GitHub push | Explicit user approval after project completion |

---

## Node.js requirement

```text
Node.js >= 20.9.0
```

Declared in `package.json` under `engines`.
