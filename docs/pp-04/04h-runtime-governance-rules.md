# PP-04H — Runtime Governance Rules

**Related:** [Phase governance](../../.cursor/rules/phase-governance.mdc) · [PP-03 contracts](../pp-03/README.md)

Architectural rules for all implementation phases PP-05 onward. Violations require ADR amendment.

---

## 1. Layering rules

| ID | Rule |
|---|---|
| G-01 | **Controllers/API layer contains no business logic** — only auth, validation delegation, mapping, orchestrator invocation |
| G-02 | **Orchestrator contains no AI provider SDK calls** — delegates to services |
| G-03 | **Repositories never invoke AI** — persistence only |
| G-04 | **Services never import Frontend or React** |
| G-05 | **Frontend never calls AI providers or storage directly** |
| G-06 | **Provider adapters never write directly to persistence** — return results to services/orchestrator |

---

## 2. Analysis boundary rules

| ID | Rule |
|---|---|
| G-07 | **Only Core Analysis Service interprets media/transcript into ReferenceVideoAnalysis** |
| G-08 | **Package generators never analyze raw media** |
| G-09 | **Package generators never fetch URLs or platform APIs** |
| G-10 | **Packages only consume ReferenceVideoAnalysis** (+ declared optional brief/engine inputs by ID) |
| G-11 | **ReferenceVideoAnalysis is immutable** — corrections create new `analysisVersion` |
| G-12 | **SEO Seeds in analysis are not an SEO Package** — SEO Generator produces the package |

---

## 3. Dependency rules

| ID | Rule |
|---|---|
| G-13 | **Services must not create cyclic dependencies** — depend down-layer: API → Orchestrator → Services → Repositories → DB |
| G-14 | **Package Generator facade must not call Core Analysis** |
| G-15 | **Cache hit path must not silently skip requested package generation** |
| G-16 | **Deterministic engines (scene, scoring, recommendations) do not replace Core Analysis** |
| G-17 | **Legacy SourceAnalysis must not be extended** — use canonical contracts |

---

## 4. Job and pipeline rules

| ID | Rule |
|---|---|
| G-18 | **All production reference processing flows through Job entity** |
| G-19 | **Job state transitions only via Orchestrator** |
| G-20 | **Failed jobs must include JobFailure with aligned code/category** |
| G-21 | **Completed jobs must report 100% progress** |
| G-22 | **Retry creates new jobId** — not in-place rewind except upload resume |
| G-23 | **Progress UI must not imply video generation** |

---

## 5. Security and ownership rules

| ID | Rule |
|---|---|
| G-24 | **Every mutation verifies project ownership** (RLS + server check) |
| G-25 | **URL fetch only through Link Intelligence with SSRF guards** |
| G-26 | **Temp media has TTL** — no permanent user library in MVP |
| G-27 | **API keys (BYOK) never in client** |
| G-28 | **Transcript content treated as untrusted** (prompt-injection aware compilation) |
| G-29 | **storageLocator never exposed to client** |

---

## 6. Cache and fingerprint rules

| ID | Rule |
|---|---|
| G-30 | **Fingerprint computed before Core Analysis** |
| G-31 | **Default cache scope: per-user** until legal approves global |
| G-32 | **Fingerprint algorithm version bump invalidates old cache entries** |
| G-33 | **cache_corrupt treated as miss** — re-analyze |

---

## 7. Contract and terminology rules

| ID | Rule |
|---|---|
| G-34 | **All persisted pivot entities validate against PP-03 Zod schemas** |
| G-35 | **No new domain terms without glossary update** |
| G-36 | **PackageEnvelope discriminated union must be preserved** |
| G-37 | **Forbidden application tables respected until inventory amended** |

---

## 8. Testing and verification rules

| ID | Rule |
|---|---|
| G-38 | **Each implementation phase independently testable** |
| G-39 | **Integration scripts for new boundaries** (mirror existing `verify:*:local` pattern) |
| G-40 | **Regression: existing brief/project/workspace tests pass unless phase explicitly migrates** |

---

## 9. Enforcement

| Mechanism | When |
|---|---|
| Code review checklist | Every PR PP-05+ |
| Lint/import boundaries (future) | Optional eslint boundaries by folder |
| Architecture tests (future) | Forbidden import graph |
| ADR | Any rule exception |

---

## Step 04H acceptance

- [x] All governance rules documented with IDs
- [x] Aligned with PP-02/PP-03 boundaries
- [x] No implementation
