# Prompt Pilot

Prompt Pilot is a provider-neutral AI Video Production Planner, Tool Recommendation Engine, and Prompt Compiler. It helps users transform an idea, script, product page, article, or permitted link into a structured video-production brief, a recommended AI video-generation platform, provider-specific prompts, and platform-specific publishing guidance.

## Core value proposition

Users often know what they want to communicate but not how to plan, decompose, prompt, and adapt a video across AI generation platforms and social destinations. Prompt Pilot turns source material into an explainable, export-ready production plan — without generating any media itself.

## What this platform does not do

**Prompt Pilot does not generate videos or images.** It produces structured plans, recommendations, prompts, and production instructions that users copy into external AI video platforms such as Google Veo, OpenAI Sora, Runway, Kling, or Adobe Firefly.

## Technology direction (provisional)

The planned stack is documented for future phases. Phase 3 integrates Tailwind CSS v4 and shadcn/ui (Radix). Phase 4 adds a local Supabase database and authentication foundation.

| Layer | Direction |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend / data | Supabase PostgreSQL and Auth |
| AI planning | OpenAI Responses API |
| Link intake | Firecrawl |
| Validation | Zod |
| Testing | Vitest, Playwright |
| Hosting / ops | Vercel, Sentry |

## Development status

**Phase 11-B — Global navigation and workflow repair** (current)

Local Supabase Auth, project dashboard, guided video brief wizard, public provider catalogue, and global navigation shell. Authenticated users with a completed brief can open the hybrid result workspace at `/projects/[projectId]/workspace`. Scene timing, complexity/execution-risk assessments, and provider recommendations are calculated deterministically from the saved brief and catalogue; prompt, continuity, and audio/editing sections remain static preview fixtures. No planning output is persisted or AI-generated.

Public site configuration lives in `src/config/public-site.ts`, including footer navigation and the official Prompt Pilot X profile URL (`OFFICIAL_X_PROFILE_URL`). When the X URL is unset, the footer omits the social link rather than publishing a placeholder.

## Local development foundation

```powershell
npm install
npm run dev
```

Cursor runs lint, typecheck, test, and build verification during phase closure.

## Documentation

| Document | Description |
|---|---|
| [Product Contract](docs/product-contract.md) | What the product is, who it serves, and what success looks like |
| [MVP Scope](docs/mvp-scope.md) | Locked inputs, outputs, categories, providers, and modules |
| [User Journey](docs/user-journey.md) | Primary workflow, wizard steps, and result workspace |
| [Domain Glossary](docs/domain-glossary.md) | Canonical product terminology |
| [Safety and Content Boundaries](docs/safety-and-content-boundaries.md) | Link, copyright, identity, and honesty constraints |
| [Phase Roadmap](docs/phase-roadmap.md) | Milestones from product definition through launch |
| [Structured Output Contracts](docs/structured-output-contracts.md) | Zod schemas and validation rules for video plans |
| [Implementation Checklist](docs/implementation-checklist.md) | Authoritative phase execution status |
| [Application Foundation](docs/application-foundation.md) | Next.js foundation, routes, and commands |
| [UI Design System](docs/ui-design-system.md) | Tailwind v4, shadcn/ui, tokens, and layout components |
| [Database and Auth Foundation](docs/database-auth-foundation.md) | Local Supabase, profiles schema, RLS, and Auth flows |
| [Project Management Foundation](docs/project-management-foundation.md) | Project dashboard, CRUD, archive, duplicate, soft delete |
| [Guided Creation Wizard](docs/guided-creation-wizard.md) | Nine-step video brief wizard, persistence, and completion |
| [Provider Catalogue](docs/provider-catalogue.md) | Source-backed read-only AI video provider catalogue |
| [Mock Result Workspace](docs/mock-result-workspace.md) | Hybrid workspace preview with deterministic scene timing |
| [Duration Scene Decomposition](docs/duration-scene-decomposition.md) | Deterministic scene-count, role, and timing algorithm |
| [Complexity and Risk Scoring](docs/complexity-risk-scoring.md) | Deterministic production complexity and execution-risk assessment |
| [Provider Recommendation Engine](docs/provider-recommendation-engine.md) | Evidence-backed offering-level provider recommendations |
| [Dependency Risk Register](docs/dependency-risk-register.md) | Vulnerability review decisions and follow-up triggers |
