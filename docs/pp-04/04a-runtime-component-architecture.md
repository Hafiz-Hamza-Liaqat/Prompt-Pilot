# PP-04A — Runtime Component Architecture

**Related:** [PP-02 AI pipeline](../pp-02/07-ai-pipeline.md) · [PP-03 contracts](../pp-03/README.md)

Conceptual runtime components for Prompt Pilot. **No implementation.**

---

## 1. Component map

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js App Router)                  │
│  Project UI · Reference intake · Job progress · Workspace · Export UI   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ HTTPS (server actions / API)
┌───────────────────────────────────▼─────────────────────────────────────┐
│                              API Layer                                   │
│  Thin controllers — auth context, request/response mapping only         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                         Request Validator                                │
│  Schema validation · policy gates · SSRF/url safety delegation          │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                        Runtime Orchestrator                              │
│  Job lifecycle · stage coordination · progress · retry/resume/cancel    │
└───────┬─────────┬─────────┬─────────┬─────────┬─────────┬───────────────┘
        │         │         │         │         │         │
        ▼         ▼         ▼         ▼         ▼         ▼
   Media      Fingerprint  Cache    Core      Package   Export
   Intake     Engine       Manager  Analysis  Engine    Engine
   Service                              Engine
        │         │         │         │         │         │
        └─────────┴─────────┴────┬────┴─────────┴─────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Persistence Layer      │
                    │   (repositories)         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Provider Layer         │
                    │   AI · Platform · Storage│
                    └──────────────────────────┘

Parallel (Workspace Layer — read path):
  Workspace Composer ──► deterministic engines (scene, scoring, recommendations)
```

---

## 2. Component catalog

### Frontend

| Attribute | Detail |
|---|---|
| **Responsibility** | Authenticated UX: project dashboard, reference submission, job status, analysis sections, package views, export actions |
| **Inputs** | User actions, session, project context |
| **Outputs** | Form submissions, polling/subscriptions for job progress, export requests |
| **Dependencies** | API Layer, existing Next.js App Router, Supabase Auth client |
| **Existing today** | Projects, brief wizard, hybrid workspace shell (`mock-result-workspace-service` preview) |
| **Not in scope** | Business logic, AI calls, direct storage access |

---

### API Layer

| Attribute | Detail |
|---|---|
| **Responsibility** | HTTP/server-action boundary: authenticate, authorize project ownership, map DTOs, invoke orchestrator or read services |
| **Inputs** | Authenticated requests with `projectId`, reference payloads, job commands |
| **Outputs** | JSON/view-model responses, job IDs, error envelopes (`DomainErrorSchema`) |
| **Dependencies** | Request Validator, Orchestrator, repositories (read), `requireUser()` |
| **Existing today** | Server actions for projects/briefs; **no** analysis API routes |
| **Must not** | Contain business logic, call AI providers, bypass orchestrator for pipeline stages |

---

### Request Validator

| Attribute | Detail |
|---|---|
| **Responsibility** | Validate incoming payloads against Zod contracts; enforce policy (size, duration, attestation, archived project) |
| **Inputs** | Raw request bodies, reference kind, URL strings, upload metadata |
| **Outputs** | Validated command objects or validation failure (`JobFailureCode`: validation category) |
| **Dependencies** | `ReferenceSchema`, canonical enums, Link Intelligence (URL path, PP-05) |
| **Existing today** | Brief draft validation; URL validation **not implemented** |
| **Must not** | Persist entities, invoke analysis |

---

### Runtime Orchestrator

| Attribute | Detail |
|---|---|
| **Responsibility** | Single coordinator for async Job pipeline; stage transitions per [PP-02 job state machine](../pp-02/06-job-state-machine.md) |
| **Inputs** | `Created` job + validated reference command |
| **Outputs** | Updated `JobRecord`, stage events, terminal states |
| **Dependencies** | All pipeline services, Job Repository, Cache Manager |
| **Existing today** | **None** — greenfield |
| **See also** | [04e-runtime-orchestrator.md](04e-runtime-orchestrator.md) |

---

### Media Intake Service

| Attribute | Detail |
|---|---|
| **Responsibility** | Resolve reference to media descriptors: temp upload location, platform metadata, normalized transcript |
| **Inputs** | Reference kind, URL, file handle, or text |
| **Outputs** | Media descriptors for Fingerprint Engine and Core Analysis (not raw bytes to Package Engine) |
| **Dependencies** | Link Intelligence (URL), Storage adapter (upload), Platform metadata provider |
| **Existing today** | Brief source fields only; **no** upload storage |
| **Must not** | Run Core Analysis, generate packages |

---

### Fingerprint Engine

| Attribute | Detail |
|---|---|
| **Responsibility** | Compute `ContentFingerprint` identity from intake descriptors |
| **Inputs** | Reference kind, normalized URL/content descriptors, algorithm version |
| **Outputs** | `ContentFingerprint` (`candidate` → `active`) |
| **Dependencies** | Fingerprint repository (future), algorithm version config |
| **Existing today** | **None** |
| **Must not** | Perform analysis; algorithm deferred to implementation |

---

### Cache Manager

| Attribute | Detail |
|---|---|
| **Responsibility** | Lookup/store analysis snapshots by fingerprint key per [PP-02 cache architecture](../pp-02/08-cache-architecture.md) |
| **Inputs** | `fingerprintId`, scope (default per-user) |
| **Outputs** | Hit → `analysisId`; Miss → continue pipeline |
| **Dependencies** | Analysis Repository, cache store (implementation deferred) |
| **Existing today** | **None** |
| **Must not** | Regenerate packages on hit unless requested |

---

### Core Analysis Engine

| Attribute | Detail |
|---|---|
| **Responsibility** | **Only** component that interprets media/transcript into `ReferenceVideoAnalysis` |
| **Inputs** | Media descriptors, optional platform metadata |
| **Outputs** | Immutable `ReferenceVideoAnalysis` snapshot |
| **Dependencies** | Provider Layer (AI adapter when enabled), Analysis Repository |
| **Existing today** | **None** (legacy `SourceAnalysis` is brief-only subset) |
| **Must not** | Compile prompts, generate SEO copy, access Package Engine outputs |

---

### Package Engine

| Attribute | Detail |
|---|---|
| **Responsibility** | Generate typed `PackageEnvelope` instances from analysis (+ optional brief/engine inputs) |
| **Inputs** | `ReferenceVideoAnalysis`, requested package types, optional Video Brief, optional engine outputs |
| **Outputs** | One or more immutable packages |
| **Dependencies** | Package Generator services (Blueprint, Prompt, SEO, …), Package Repository |
| **Existing today** | Schema-only; workspace fixtures |
| **Must not** | Read raw media, URL fetch, or re-run Core Analysis |

---

### Export Engine

| Attribute | Detail |
|---|---|
| **Responsibility** | Serialize selected packages to user-facing export formats |
| **Inputs** | Package IDs, export format, transformation notice |
| **Outputs** | `ExportRecord`, downloadable/copyable payload |
| **Dependencies** | Package Repository, Export Repository, History Service |
| **Existing today** | **None** |
| **Must not** | Modify analysis or packages |

---

### Persistence Layer (repositories)

| Attribute | Detail |
|---|---|
| **Responsibility** | CRUD for domain entities; RLS-scoped; no business rules |
| **Inputs** | Entity records from services |
| **Outputs** | Persisted entities, query results |
| **Dependencies** | Supabase Postgres (future tables) |
| **Existing today** | Projects, briefs, profiles, catalogue |
| **See also** | [04d-repository-boundaries.md](04d-repository-boundaries.md) |

---

### Workspace Layer

| Attribute | Detail |
|---|---|
| **Responsibility** | Compose read model for UI: latest analysis, packages, job status, deterministic engine evaluations |
| **Inputs** | Project ID, optional version selectors |
| **Outputs** | Workspace view model (sections, progress, badges) |
| **Dependencies** | Analysis/Package/Job repositories, existing scene/scoring/recommendation services |
| **Existing today** | `mock-result-workspace-service.ts` (fixtures + live engines) |
| **Must not** | Execute pipeline stages; write analysis |

---

### Provider Layer

| Attribute | Detail |
|---|---|
| **Responsibility** | External adapters: AI analysis, AI compilation, platform metadata, object storage |
| **Inputs** | Provider-specific requests behind interfaces |
| **Outputs** | Structured JSON or storage locators |
| **Dependencies** | Env config, BYOK (future), cost gates |
| **Existing today** | **None** for AI; Supabase Auth only |
| **Must not** | Write directly to persistence (services persist) |

---

## 3. Existing vs greenfield summary

| Component | Status |
|---|---|
| Frontend (partial) | **Existing** — extend for reference intake |
| API Layer | **Partial** — server actions pattern exists |
| Request Validator | **Partial** — brief validation only |
| Orchestrator | **Greenfield** |
| Media Intake | **Greenfield** |
| Fingerprint Engine | **Greenfield** |
| Cache Manager | **Greenfield** |
| Core Analysis Engine | **Greenfield** |
| Package Engine | **Greenfield** |
| Export Engine | **Greenfield** |
| Persistence (pivot entities) | **Greenfield** |
| Workspace Layer | **Partial** — adapter from fixtures to packages |
| Provider Layer | **Greenfield** |
| Deterministic engines | **Existing** — parallel evaluations |

---

## Step 04A acceptance

- [x] All major components identified
- [x] Responsibility, inputs, outputs, dependencies documented
- [x] Existing repository assets mapped
- [x] No implementation
