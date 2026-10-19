# Final Runtime Architecture Review — PP-04

**Phase gate:** PP-04 completion before PP-05 implementation  
**Related:** [PP-04 index](README.md)

---

## 1. Runtime architecture summary

Prompt Pilot executes reference analysis as an **async Job** coordinated by a **Runtime Orchestrator**. A thin **API Layer** validates requests and delegates to the orchestrator. Pipeline **services** perform single stages; **repositories** persist entities. **Core Analysis** is the sole media interpretation stage. **Package Engine** generates typed outputs from `ReferenceVideoAnalysis` only. **Workspace Composer** assembles the read model for UI. **Provider Layer** isolates external AI, platform, and storage adapters.

Existing assets (auth, projects, brief wizard, deterministic engines, workspace shell) remain as **parallel paths** until migration adapters replace fixtures.

---

## 2. Execution pipeline summary

Linear pipeline with cache branch: Input → Validation → Ownership → Media Intake → Fingerprint → Cache → Core Analysis → Package Generation → Persistence → Workspace → Export → History.

Entry: reference submission. Exit: `completed`, `failed`, `cancelled`, `expired`. Retry creates new jobs; upload resume is special case. Checkpoints after fingerprint, analysis, and each package type.

---

## 3. Component responsibilities

| Component | One-line role |
|---|---|
| Frontend | UX; no business logic |
| API Layer | Auth + mapping + orchestrator invoke |
| Request Validator | Schema + policy gate |
| Orchestrator | Job state machine owner |
| Media Intake | Descriptors from URL/upload/text |
| Fingerprint Engine | Content identity |
| Cache Manager | Analysis reuse by fingerprint |
| Core Analysis Engine | ReferenceVideoAnalysis producer |
| Package Engine | Typed package producer |
| Export Engine | User delivery serialization |
| Persistence | Repository adapters |
| Workspace Layer | Read model composition |
| Provider Layer | External adapters |

Detail: [04a-runtime-component-architecture.md](04a-runtime-component-architecture.md).

---

## 4. Service boundaries summary

16 conceptual services with explicit **Must Never Do** rules. Key invariant: **no package service touches raw media or Core Analysis**. Link Intelligence and Media Intake isolated from Package Engine. Existing scene/scoring/recommendation services remain parallel evaluations.

Detail: [04c-service-boundaries.md](04c-service-boundaries.md).

---

## 5. Repository boundaries summary

Eight pivot repositories (Reference, Analysis, Package, Export, Job, Fingerprint, Cache optional, Workspace read). No SQL in PP-04. DDL design deferred to PP-05/07 track.

Detail: [04d-repository-boundaries.md](04d-repository-boundaries.md).

---

## 6. Governance rules summary

40 rules (G-01–G-40) covering layering, analysis boundary, dependencies, jobs, security, cache, contracts, and testing. Cornerstone: **packages only consume ReferenceVideoAnalysis**.

Detail: [04h-runtime-governance-rules.md](04h-runtime-governance-rules.md).

---

## 7. Risks discovered

| Risk | Severity | Mitigation |
|---|---|---|
| Orchestrator greenfield — largest implementation gap | Critical | PP-07 focused; sync mock for early E2E |
| Persistence not yet designed at SQL level | High | Start entity-table map at PP-05 kickoff |
| Dual path: brief wizard vs Reference intake | Medium | Workspace Composer merges UX (PP-10) |
| Partial package failure UX complexity | Medium | CP-3 + 04I policy |
| Sync mock temptation for production | High | G-18 + governance; async mandatory for prod |
| Service boundary drift without lint enforcement | Medium | Future import boundary tests |
| Terminology: old roadmap called PP-04 "Persistence" | Low | Resolved in 04J — runtime vs persistence split |

---

## 8. Deferred implementation decisions

| Topic | Phase |
|---|---|
| Table DDL + RLS | PP-05 design / PP-07 apply |
| Worker + queue technology | PP-07 |
| Storage bucket policies | PP-06 |
| SSRF implementation | PP-05 |
| Fingerprint algorithm | PP-08 |
| Cache backend | PP-08 |
| Mock analysis provider | PP-09 |
| Mock package generators | PP-12 |
| Real AI providers | PP-11, PP-14 |
| Timeout/retry numeric policy | PP-07 |
| Import boundary lint | PP-07 optional |

---

## 9. Readiness for implementation

| Criterion | Status |
|---|---|
| Runtime components defined | Yes |
| Pipeline entry/exit documented | Yes |
| Service/repo boundaries explicit | Yes |
| Orchestrator authority defined | Yes |
| Package dependency graph locked | Yes |
| Sequence diagrams for main flows | Yes |
| Governance rules for enforcement | Yes |
| Failure/recovery documented | Yes |
| PP-05/06/07 prerequisites identified | Yes |
| PP-03 contracts unchanged | Yes |
| No runtime code modified in PP-04 | Yes |
| Repository buildable | Yes (docs only) |

---

## 10. Gate verdict

### **GO WITH CONDITIONS**

**Rationale for GO:**

- PP-01–PP-03 provide stable domain and contract baseline.
- PP-04 completes the documentation arc before production code.
- Clear orchestrator-centric model prevents package/analysis boundary violations.
- Existing repository patterns (service + repository + Zod) extend naturally.
- Failure, cache, and retry policies inherit from PP-02 without contradiction.

**Conditions before PP-05 code:**

1. **Human sign-off** on PP-04 deliverables (this review).
2. **Begin persistence design spike** (entity-to-table map) in parallel with PP-05 — required before PP-07 migrations.
3. **Commit PP-01–PP-04 documentation baseline** when approved.
4. **First PP-05 PR** must cite governance rules G-01, G-24, G-25 for Link Intelligence.

**Rationale not unconditional GO:**

- Physical persistence design intentionally deferred — must not be skipped before PP-07.
- Worker topology undecided.
- No runtime code exists yet — first implementation tranche carries integration risk.

**Rationale not NO-GO:**

Architecture is complete, consistent with approved phases, and actionable for PP-05.

---

## Acceptance checklist

- [x] No production code written
- [x] No database changes
- [x] No API changes
- [x] No runtime behavior added
- [x] No business logic added
- [x] No UI behavior changed
- [x] Terminology matches PP-02 and PP-03
- [x] Documentation internally consistent
- [x] Repository remains buildable
- [x] PP-05 prerequisites identified
- [ ] Human approval recorded
