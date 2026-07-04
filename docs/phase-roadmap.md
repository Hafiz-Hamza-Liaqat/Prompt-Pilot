# Phase Roadmap

**Project:** Prompt Pilot

Related documents: [Product Contract](product-contract.md) · [MVP Scope](mvp-scope.md) · [User Journey](user-journey.md) · [Implementation Checklist](implementation-checklist.md)

This roadmap describes phase scope and deliverables. Execution status is tracked in [Implementation Checklist](implementation-checklist.md), which is the authoritative status record.

Phases must not overlap: exactly one phase may be `IN_PROGRESS` at a time. Completing a phase does not automatically start the next phase.

---

## Milestone 0 — Product definition

### Phase 0 — Product contract and scope lock

- **Goal:** Define and lock product contracts before any application development.
- **Main deliverables:** README, product contract, MVP scope, user journey, glossary, safety boundaries, phase roadmap.
- **Completion gate:** All seven documentation files reviewed; terminology consistent; no application code exists.

### Phase 1 — Domain types and structured-output contracts

- **Goal:** Define TypeScript types, Zod schemas, and JSON contracts for all plan outputs.
- **Main deliverables:** Domain type definitions, validation schemas, example plan fixtures, schema documentation.
- **Completion gate:** Every Production Plan section has a typed schema; schemas validate example fixtures; no UI or API code.

---

## Milestone 1 — Technical foundation

### Phase 2 — Repository and Next.js foundation

- **Goal:** Initialize the application repository and Next.js project skeleton.
- **Main deliverables:** Next.js app, TypeScript config, linting, folder structure, environment template.
- **Completion gate:** App runs locally; CI lint passes; no product features implemented.

### Phase 3 — UI design system and application shell

- **Goal:** Establish Tailwind, shadcn/ui, layout, navigation, and theme.
- **Main deliverables:** Design tokens, base components, app shell, responsive layout.
- **Completion gate:** Shell renders on all target viewports; component Storybook or equivalent documented.

### Phase 4 — Supabase database and authentication

- **Goal:** Set up PostgreSQL schema, Row Level Security, and auth flows.
- **Main deliverables:** Database migrations, auth pages, session management, RLS policies.
- **Completion gate:** Users can sign up, sign in, sign out; RLS prevents cross-user access.

---

## Milestone 2 — Product UI

### Phase 5 — Dashboard and project management

- **Goal:** Build project list, create, rename, archive, and delete flows.
- **Main deliverables:** Dashboard page, project CRUD, empty states.
- **Completion gate:** User can create a project; refresh restores it; projects are user-scoped.

### Phase 6 — Guided creation wizard

- **Goal:** Implement the nine-step creation wizard with validation.
- **Main deliverables:** Wizard steps (Source through Review), form state, navigation.
- **Completion gate:** User can complete all wizard steps; brief persists on refresh.

### Phase 7 — Provider catalogue

- **Goal:** Store and display the five MVP provider capability records.
- **Main deliverables:** Provider data model, admin seed data, capability display.
- **Completion gate:** All five providers documented with versioned capabilities; no hard-coded rankings.

### Phase 8 — Mock result workspace

- **Goal:** Build the result workspace UI with fixture data.
- **Main deliverables:** All workspace sections from [User Journey](user-journey.md), interaction states.
- **Completion gate:** Every section renders from fixture; all major actions implement required states.

---

## Milestone 3 — Deterministic intelligence

### Phase 9 — Duration and scene decomposition

- **Goal:** Break target duration into an ordered scene timeline.
- **Main deliverables:** Decomposition algorithm, scene duration allocation, timeline UI binding.
- **Completion gate:** Scene durations sum to target duration; timeline renders correctly.

### Phase 10 — Complexity and risk scoring

- **Goal:** Implement deterministic Complexity Score and Production Risk Score.
- **Main deliverables:** Scoring rules, factor breakdown, workspace display.
- **Completion gate:** Scores are reproducible for identical inputs; factors are explainable.

### Phase 11 — Provider recommendation engine

- **Goal:** Recommend primary and alternative providers with rationale.
- **Main deliverables:** Fit scoring, recommendation explanation, alternative comparison.
- **Completion gate:** Recommendations are explainable; no universal "best provider" hard-coded.

---

## Milestone 4 — AI planning

### Phase 12 — AI provider boundary

- **Goal:** Integrate OpenAI Responses API with structured output enforcement.
- **Main deliverables:** API client, retry logic, schema-constrained calls, error handling.
- **Completion gate:** API returns schema-valid JSON; errors surface as recoverable states.

### Phase 13 — Structured plan generation

- **Goal:** Generate complete Production Plans from validated briefs.
- **Main deliverables:** Plan generation pipeline, all required plan sections populated.
- **Completion gate:** Generated plan passes schema validation; all sections present.

### Phase 14 — Scene editing and controlled regeneration

- **Goal:** Allow users to edit scenes and regenerate affected sections.
- **Main deliverables:** Scene editor, partial regeneration, version tracking.
- **Completion gate:** Edited scenes update prompts; unaffected sections remain stable.

### Phase 15 — Provider-specific prompt compiler

- **Goal:** Compile scene descriptions into provider-formatted prompts.
- **Main deliverables:** Compiler per MVP provider, prompt package output.
- **Completion gate:** Every scene has a provider-specific Compiled Prompt.

### Phase 16 — Continuity Bible

- **Goal:** Generate and maintain character, product, world, and style locks.
- **Main deliverables:** Lock extraction, cross-scene consistency checks, Bible UI.
- **Completion gate:** All four lock types populated; continuity warnings surface gaps.

---

## Milestone 5 — Link intelligence

### Phase 17 — Safe URL intake

- **Goal:** Implement URL validation and safety checks per [Safety and Content Boundaries](safety-and-content-boundaries.md).
- **Main deliverables:** URL validator, SSRF protection, timeout and size limits.
- **Completion gate:** Private and localhost URLs blocked; permitted URLs accepted.

### Phase 18 — Article and product-page extraction

- **Goal:** Extract and sanitize content from permitted URLs via Firecrawl.
- **Main deliverables:** Extraction pipeline, content sanitization, brief pre-fill.
- **Completion gate:** Article and product URLs produce normalized brief fields.

### Phase 19 — Source-to-video planning

- **Goal:** Connect extracted source content to full plan generation.
- **Main deliverables:** Source Analysis integration, end-to-end URL-to-plan flow.
- **Completion gate:** User can create a complete plan from a product or article URL.

---

## Milestone 6 — Product completion

### Phase 20 — Social-platform adaptation

- **Goal:** Apply destination-specific adjustments for all MVP publishing destinations.
- **Main deliverables:** Adaptation rules per destination, aspect ratio and hook guidance.
- **Completion gate:** Each supported destination produces relevant adaptation output.

### Phase 21 — Voiceover and editing roadmap

- **Goal:** Generate VO scripts, audio guidance, and editing assembly steps.
- **Main deliverables:** VO generation, audio direction, Editing Roadmap and Generation Order.
- **Completion gate:** Plans include complete VO, audio, and editing sections.

### Phase 22 — Export and sharing

- **Goal:** Enable copy and structured export of complete plans.
- **Main deliverables:** Clipboard copy, JSON/Markdown export, export controls UI.
- **Completion gate:** User can copy or export full plan; export matches schema.

### Phase 23 — Admin capability management

- **Goal:** Admin UI for managing provider capability records.
- **Main deliverables:** Admin routes, capability CRUD, Capability Version history.
- **Completion gate:** Admin can update provider capabilities; versions are tracked.

### Phase 24 — Templates and usage limits

- **Goal:** Provide starter templates and enforce per-user usage limits.
- **Main deliverables:** Template library, usage counter, limit enforcement UI.
- **Completion gate:** Users can start from template; limits block overuse with clear messaging.

---

## Milestone 7 — Production readiness

### Phase 25 — Quality evaluation system

- **Goal:** Implement Prompt Quality Audit with automated warnings.
- **Main deliverables:** Audit rules, warning display, quality score factors.
- **Completion gate:** Audit runs on every plan; warnings are actionable.

### Phase 26 — Security hardening

- **Goal:** Audit and harden auth, RLS, input validation, and API boundaries.
- **Main deliverables:** Security review fixes, penetration test remediation.
- **Completion gate:** No critical security findings remain open.

### Phase 27 — Reliability and monitoring

- **Goal:** Add Sentry, health checks, and error recovery paths.
- **Main deliverables:** Sentry integration, logging, alerting, retry policies.
- **Completion gate:** Errors are captured; critical paths have recovery flows.

### Phase 28 — Full Playwright QA

- **Goal:** End-to-end test coverage for all critical user journeys.
- **Main deliverables:** Playwright test suite, CI integration.
- **Completion gate:** All critical journeys pass in CI.

### Phase 29 — Deployment

- **Goal:** Deploy to Vercel with production Supabase and environment config.
- **Main deliverables:** Vercel project, production env, deployment pipeline.
- **Completion gate:** Production URL serves the application; auth and DB connected.

### Phase 30 — Controlled private beta

- **Goal:** Onboard a limited set of real users and collect feedback.
- **Main deliverables:** Beta access controls, feedback channel, usage monitoring.
- **Completion gate:** Beta users complete end-to-end journeys; critical bugs resolved.

### Phase 31 — Public launch readiness

- **Goal:** Final polish, documentation, and go-live checklist.
- **Main deliverables:** Public landing page copy, support docs, launch checklist sign-off.
- **Completion gate:** All MVP completion criteria from [MVP Scope](mvp-scope.md) met; product ready for public access.
