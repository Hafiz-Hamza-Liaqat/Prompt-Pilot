# Implementation Checklist

**Project:** Prompt Pilot

Related documents: [Phase Roadmap](phase-roadmap.md) · [Product Contract](product-contract.md) · [Structured Output Contracts](structured-output-contracts.md)

This file is the **single source of truth** for phase execution status. The roadmap describes scope; this checklist records what is done, ready, blocked, or in progress.

---

## Status legend

| Status | Meaning |
|---|---|
| `NOT_STARTED` | Work has not begun |
| `READY` | Prerequisites are satisfied; phase may start with approval |
| `IN_PROGRESS` | The only phase currently being implemented |
| `BLOCKED` | Work cannot safely continue |
| `DONE` | Implementation and all required verification passed |

---

## Global completion requirements

A phase may be marked `DONE` only when:

- Approved scope is complete
- Focused tests pass
- Relevant regression tests pass
- Typecheck passes
- Build passes when applicable
- `git diff --check` passes
- Required documentation is updated
- A local commit is created
- `git status --short` is clean
- Nothing is pushed
- Nothing is deployed

---

## Current phase contract

```text
Current phase: None
Next ready phase: Phase 7
Next phase after Phase 6 closure: Phase 7 — Provider Catalogue
```

---

## Phase checklist

| Phase | Title | Status | Verification evidence |
|---|---|---|---|
| 0 | Product Contract and MVP Scope Lock | DONE | Documentation commit `afba1ac` |
| 1 | Domain Types and Structured Output Contracts | DONE | 35 tests passed; typecheck passed; commit `8ada825` |
| 1-A | Contract Corrections | DONE | Quality-priority contracts separated; included in Phase 1 verified state |
| 1-B | Product Identity Migration and Phase Governance | DONE | Prompt Pilot identity migrated; governance rules and checklist added |
| 2 | Next.js Repository and Application Foundation | DONE | 42 tests passed; lint/typecheck/build passed; HTTP 200 smoke on :3100 |
| 2-A | Foundation Hygiene and Dependency-Risk Review | DONE | ESLint 0/0; 42 tests; typecheck/build/smoke passed; audit recorded |
| 3 | UI Design System and Application Shell | DONE | Tailwind v4; shadcn/Radix; button/badge/card/separator; 64 tests; lint 0/0; typecheck/build/smoke passed; audit reviewed; commit pending |
| 4 | Supabase Database and Authentication | DONE | Local Supabase; profiles migration; RLS 19/19; 83 unit tests; auth integration passed; commit `2ce05a8` |
| 5 | Dashboard and Project Management | DONE | Projects migration `20260704193000`; RLS 35/35 SQL; 122 unit tests; project integration passed; commit `891eb8a` |
| 6 | Guided Creation Wizard | DONE | Brief migration `20260704200000`; RLS 52/52 SQL; 213 unit tests; brief integration passed; auth/project regression passed; lint 0/0; typecheck/build/smoke passed; audit reviewed; local commit pending |
| 7 | Provider Catalogue | READY | Requires Phase 6 |
| 8 | Mock Result Workspace | NOT_STARTED | Requires Phase 7 |
| 9 | Duration and Scene Decomposition | NOT_STARTED | Requires Phase 8 |
| 10 | Complexity and Risk Scoring | NOT_STARTED | Requires Phase 9 |
| 11 | Provider Recommendation Engine | NOT_STARTED | Requires Phase 10 |
| 12 | AI Provider Boundary | NOT_STARTED | Requires Phase 11 |
| 13 | Structured Plan Generation | NOT_STARTED | Requires Phase 12 |
| 14 | Scene Editing and Controlled Regeneration | NOT_STARTED | Requires Phase 13 |
| 15 | Provider-Specific Prompt Compiler | NOT_STARTED | Requires Phase 14 |
| 16 | Continuity Bible | NOT_STARTED | Requires Phase 15 |
| 17 | Safe URL Intake | NOT_STARTED | Requires Phase 16 |
| 18 | Article and Product-Page Extraction | NOT_STARTED | Requires Phase 17 |
| 19 | Source-to-Video Planning | NOT_STARTED | Requires Phase 18 |
| 20 | Social-Platform Adaptation | NOT_STARTED | Requires Phase 19 |
| 21 | Voiceover and Editing Roadmap | NOT_STARTED | Requires Phase 20 |
| 22 | Export and Sharing | NOT_STARTED | Requires Phase 21 |
| 23 | Admin Capability Management | NOT_STARTED | Requires Phase 22 |
| 24 | Templates and Usage Limits | NOT_STARTED | Requires Phase 23 |
| 25 | Quality Evaluation System | NOT_STARTED | Requires Phase 24 |
| 26 | Security Hardening | NOT_STARTED | Requires Phase 25 |
| 27 | Reliability and Monitoring | NOT_STARTED | Requires Phase 26 |
| 28 | Full Playwright QA | NOT_STARTED | Requires Phase 27 |
| 29 | Local Release Readiness | NOT_STARTED | Requires Phase 28 |
| 30 | Controlled Private Beta Preparation | NOT_STARTED | Requires explicit approval |
| 31 | Public Launch Readiness | NOT_STARTED | Requires explicit approval |

**Notes:**

- Phase 29 is local release readiness, not deployment.
- Phases 30 and 31 must not deploy or push without explicit user approval.
- Exactly one phase may be `IN_PROGRESS` at a time.
