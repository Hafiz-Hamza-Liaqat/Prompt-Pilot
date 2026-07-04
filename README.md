# ScenePilot

ScenePilot is a provider-neutral AI Video Production Planner, Tool Recommendation Engine, and Prompt Compiler. It helps users transform an idea, script, product page, article, or permitted link into a structured video-production brief, a recommended AI video-generation platform, provider-specific prompts, and platform-specific publishing guidance.

## Core value proposition

Users often know what they want to communicate but not how to plan, decompose, prompt, and adapt a video across AI generation platforms and social destinations. ScenePilot turns source material into an explainable, export-ready production plan — without generating any media itself.

## What this platform does not do

**ScenePilot does not generate videos or images.** It produces structured plans, prompts, and instructions that users copy into external AI video platforms such as Google Veo, OpenAI Sora, Runway, Kling, or Adobe Firefly.

## Technology direction (provisional)

The planned stack is documented for future phases only. Nothing is initialized in Phase 0.

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

**Phase 1 — Domain types and structured output contracts** (current)

TypeScript and Zod domain contracts with Vitest validation. No application UI or infrastructure in this phase.

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
