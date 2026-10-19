# PP-04 — Runtime Architecture & Execution Boundaries Index

**Phase:** PP-04 — Runtime Architecture & Execution Boundaries  
**Type:** Documentation only — no implementation  
**Status:** **APPROVED** — architecture foundation locked  
**Prerequisites:** PP-01 · PP-02 · PP-03 (approved baseline)  
**Superseded by for persistence detail:** [PP-05A](../pp-05a/README.md)

---

## Objective

Define **how Prompt Pilot executes work** from user input submission through completed outputs. Runtime architecture and boundaries only — no code, migrations, routes, or behavior changes.

---

## Deliverables

| ID | Document | Topic |
|---|---|---|
| 04A | [04a-runtime-component-architecture.md](04a-runtime-component-architecture.md) | Major runtime components |
| 04B | [04b-end-to-end-runtime-pipeline.md](04b-end-to-end-runtime-pipeline.md) | Canonical execution flow |
| 04C | [04c-service-boundaries.md](04c-service-boundaries.md) | Conceptual services |
| 04D | [04d-repository-boundaries.md](04d-repository-boundaries.md) | Conceptual repositories |
| 04E | [04e-runtime-orchestrator.md](04e-runtime-orchestrator.md) | Orchestrator responsibilities |
| 04F | [04f-package-dependency-graph.md](04f-package-dependency-graph.md) | Package dependency graph |
| 04G | [04g-runtime-sequence-diagrams.md](04g-runtime-sequence-diagrams.md) | Sequence diagrams |
| 04H | [04h-runtime-governance-rules.md](04h-runtime-governance-rules.md) | Architectural rules |
| 04I | [04i-failure-recovery-architecture.md](04i-failure-recovery-architecture.md) | Failure & recovery |
| 04J | [04j-roadmap-dependency-review.md](04j-roadmap-dependency-review.md) | Forward phase dependencies |
| — | [05-final-runtime-architecture-review.md](05-final-runtime-architecture-review.md) | Go / no-go gate |

---

## Relationship to prior phases

| Phase | PP-04 consumes |
|---|---|
| PP-01 | MVP scope, users, platforms, cost constraints |
| PP-02 | Domain language, ERM, pipeline, job states, cache, package engine |
| PP-03 | Zod contracts in `src/domain/canonical/` |

PP-04 **does not redefine** Reference, Analysis, Package, Job, or Fingerprint.

---

## Scope note: Persistence design

Conceptual **repository boundaries** are defined in 04D (no SQL). **Physical persistence design** (tables, RLS, migrations) remains a **first implementation tranche deliverable** required before Job Orchestration (PP-07). See [04j-roadmap-dependency-review.md](04j-roadmap-dependency-review.md).

---

## Acceptance

- [x] All deliverables 04A–04J complete
- [x] Final review with verdict
- [x] Roadmap updated
- [x] No production code, DB, API, or runtime changes
- [ ] Human approval recorded
