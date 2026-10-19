# PP-02 — Domain Architecture Index

**Phase:** PP-02 — Domain Model & Core Analysis Architecture  
**Type:** Documentation only — no implementation  
**Prerequisite:** PP-01 (Product Pivot Foundation) · Architecture Readiness Audit  
**Related:** [PP-01 pivot docs](../pivot/) · [Master roadmap](../prompt-pilot-roadmap.md)

---

## PP-02 deliverables

| Step | Document | Purpose |
|---|---|---|
| 1 | [00-architecture-audit-gate.md](00-architecture-audit-gate.md) | Terminology audit, conflicts, reuse |
| 2–3 | [01-reference-video-analysis-specification.md](01-reference-video-analysis-specification.md) | Canonical domain language + analysis object |
| 4 | [02-entity-relationship-model.md](02-entity-relationship-model.md) | Conceptual relationships (not SQL) |
| 5 | [04-package-engine.md](04-package-engine.md) | Package contract and types |
| 6 | [05-content-fingerprint.md](05-content-fingerprint.md) | Fingerprint lifecycle and cache lookup |
| 7 | [06-job-state-machine.md](06-job-state-machine.md) | Job lifecycle and error paths |
| 8 | [07-ai-pipeline.md](07-ai-pipeline.md) | End-to-end platform pipeline |
| 9 | [08-cache-architecture.md](08-cache-architecture.md) | Cache key, ownership, invalidation |
| 10 | [09-adapter-strategy.md](09-adapter-strategy.md) | Legacy domain → canonical model |
| 11 | [10-migration-strategy.md](10-migration-strategy.md) | Phased migration sequence |
| 12 | [11-roadmap-dependency-review.md](11-roadmap-dependency-review.md) | PP-03+ dependencies on PP-02 |
| 13 | [12-final-architecture-review.md](12-final-architecture-review.md) | Go / no-go gate |

---

## Canonical rule

Every future document and module **must** use the definitions in [01-reference-video-analysis-specification.md](01-reference-video-analysis-specification.md). Do not introduce synonyms without glossary update.

---

## Status

| Item | Status |
|---|---|
| PP-02 documentation | **COMPLETE** (pending human approval) |
| Implementation | **NOT AUTHORIZED** |
