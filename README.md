# Prompt Pilot

A provider-neutral prompt-engineering and video production workspace for crafting, refining, organizing, and reusing AI prompts.

Prompt Pilot helps creators, marketers, and developers transform source material, creative briefs, scripts, or reference links into structured, explainable video production briefs, platform recommendations, scene breakdowns, and optimized prompts for external generative AI platforms.

---

## Core Value Proposition

Creating generative AI videos often involves guesswork: understanding which provider fits a project's needs, structuring scene-by-scene timing, managing continuity, and formulating platform-specific prompts. Prompt Pilot brings engineering discipline to this workflow:
- Decomposes target durations into narrative-driven scenes with deterministic timing.
- Evaluates multi-dimensional complexity and execution risk.
- Recommends the most suitable AI video generation providers using verified platform capabilities and limitations.
- Prepares structured production briefs and export-ready prompt packages.

> **Operational Boundary:** Prompt Pilot is a planning, orchestration, and prompt compilation platform. It does **not** render or generate video/image files directly. Plans and prompts are compiled for use in external tools such as Google Veo, OpenAI Sora, Runway, Kling AI, and Adobe Firefly.

---

## Confirmed Features

- **Authentication & User Profiles:** Built on Supabase Auth with secure session persistence, protected routing, and user profile management.
- **Project Dashboard:** Full project lifecycle management (creation, listing, status updates, and soft deletion) with Row Level Security (RLS).
- **Guided 9-Step Creation Wizard:** A structured, multi-step brief creator capturing:
  1. Project Category (Explainer, Product, Narrative, Educational, Social)
  2. Source Intake (Direct brief, text script, reference URL)
  3. Objective & Core Message
  4. Target Duration & Constraints (15s to 120s presets)
  5. Publishing Destination & Aspect Ratio (YouTube 16:9, Shorts/Reels/TikTok 9:16, Square 1:1)
  6. Visual Style & Aesthetic Direction
  7. Budget & Speed Priorities
  8. Production Requirements (Character consistency, lip sync, camera control, first/last frame control)
  9. Comprehensive Brief Review & Submission
- **Deterministic Scene Decomposition Engine:** Algorithmic duration-to-scene breakdown assigning narrative roles (`hook`, `context`, `problem`, `development`, `climax`, `resolution`, `call_to_action`) and precise millisecond timing.
- **Complexity & Risk Scoring:** Multi-factor analysis scoring scene density, motion complexity, consistency demands, and execution risks.
- **Evidence-Backed Provider Recommendations:** Evaluates and ranks top AI video providers against project requirements, factoring in documented support levels, capability constraints, and freshness.
- **Curated Provider Catalogue:** Directory of documented AI video providers (Google Veo, OpenAI Sora, Runway, Kling, Adobe Firefly) with verified capability facts, source URLs, and freshness tracking (`fresh`, `due_soon`, `overdue`).
- **Interactive Result Workspace:** Unified workspace displaying brief summaries, scene timelines, complexity scorecards, and platform recommendations.
- **Reference Intake & Pipeline Orchestrator:** Modular pipeline architecture supporting reference link intake, media validation, state machine transitions (`idle`, `fingerprinting`, `analyzing`, `completed`, `failed`), and caching coordination.

---

## Verified Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) | `16.2.10` | App Router, Server Components & Actions |
| **UI Library** | [React](https://react.dev/) | `19.2.7` | UI component foundation |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `5.8.2` | Strict end-to-end type safety |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `4.3.2` | Modern utility-first CSS |
| **Components** | [shadcn/ui](https://ui.shadcn.com/) / [Radix UI](https://www.radix-ui.com/) | Latest | Accessible, headless UI primitives |
| **Icons** | [Lucide React](https://lucide.dev/) | `1.23.0` | Consistent icon system |
| **Validation** | [Zod](https://zod.dev/) | `3.24.2` | Runtime schema validation & contract enforcement |
| **Database & Auth** | [Supabase](https://supabase.com/) | `2.110.0` | PostgreSQL with Row-Level Security & Auth |
| **Test Runner** | [Vitest](https://vitest.dev/) | `3.2.6` | High-speed unit & invariant test suite |
| **Linting** | [ESLint](https://eslint.org/) | `9.39.4` | Flat config with Next.js Core Web Vitals & TypeScript rules |

---

## Project Structure

```text
Prompt-Pilot/
├── docs/                 # Architectural Decision Records (ADRs) and phase roadmaps
├── scripts/              # Verification and utility scripts
├── src/
│   ├── app/              # Next.js App Router (pages, layouts, server actions)
│   ├── components/       # Reusable UI components & feature widgets
│   ├── config/           # Static application configurations & constants
│   ├── domain/           # Core domain models, Zod schemas, algorithms & pure logic
│   └── server/           # Backend persistence, caching, analysis & orchestrators
├── supabase/             # Local database migrations, seed data & RLS policies
└── tests/                # Vitest test suites (100+ files, unit & integration tests)
```

---

## Getting Started

### Prerequisites

- **Node.js**: `>= 20.9.0`
- **npm**: `>= 10.0.0`
- **Supabase CLI** (optional, for local database development): `>= 2.0.0`

### 1. Clone & Install

```bash
git clone https://github.com/Hafiz-Hamza-Liaqat/Prompt-Pilot.git
cd Prompt-Pilot
npm install
```

### 2. Environment Configuration

Create a `.env.local` file by copying the provided example:

```bash
cp .env.example .env.local
```

Configure your local or remote Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 3. Run Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Build Commands

All quality gates are enforced and verified:

```bash
# Run TypeScript type check
npm run typecheck

# Run ESLint check
npm run lint

# Run full Vitest suite (100+ test suites, 1,280+ tests)
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

---

## Known Limitations & Roadmap

- **Media Rendering:** Prompt Pilot compiles prompt engineering instructions and video plans; it does not render video or image files directly.
- **Provider API Dispatch:** Provider recommendations are evidence-backed against verified capability matrices; direct API dispatch to third-party generation services is planned for future phases.
- **Workspace Fixtures:** Certain workspace sections (such as real-time audio generation previews and continuity bible asset extraction) currently operate in structured preview mode.

---

## Documentation Index

Detailed architectural documents, domain contracts, and RFCs are maintained in the [`docs/`](docs/) directory:

- [Product Contract](docs/product-contract.md) — Product definition, target users, and boundary constraints.
- [MVP Scope](docs/mvp-scope.md) — Confirmed input/output contracts, providers, and modules.
- [Domain Architecture (PP-02)](docs/pp-02/) — Domain models, canonical analysis structures, and pipeline concepts.
- [Canonical Contracts (PP-03)](docs/pp-03/) — Zod schemas, domain glossary, and ADRs.
- [Runtime Architecture (PP-04)](docs/pp-04/) — Execution boundaries, orchestrator patterns, and lifecycle models.
- [Master Roadmap](docs/prompt-pilot-roadmap.md) — Forward engineering phases and implementation status.

---

## License

This project is licensed under the MIT License.
