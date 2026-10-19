# PP-03 — Canonical Contracts & Domain Glossary

**Phase:** PP-03 / Roadmap Phase 3 — Foundation Lock  
**Type:** Contracts only — no runtime behavior  
**Prerequisite:** PP-02 approved · [Domain architecture](../pp-02/README.md)

---

## Objective

Convert approved PP-02 architecture into shared Zod schemas, TypeScript types, glossary updates, compatibility documentation, and ADRs. All runtime behavior remains deferred.

---

## Deliverables

| Artifact | Location |
|---|---|
| Canonical Zod module | `src/domain/canonical/` |
| Domain glossary (PP-02 terms) | [domain-glossary.md](../domain-glossary.md) |
| Contract hierarchy update | [structured-output-contracts.md](../structured-output-contracts.md) |
| Legacy compatibility map | [compatibility.md](compatibility.md) |
| Architecture Decision Records | [../adr/](../adr/) |
| Contract tests | `tests/canonical/contracts.spec.ts` |
| PP-04 readiness | [04-pp04-readiness.md](04-pp04-readiness.md) |

---

## Canonical module map

```text
src/domain/canonical/
├── constants.ts              — Locked enums (job states, package types, confidence, …)
├── primitives.ts             — EntityId, versions, confidence map
├── reference.ts              — Reference entity
├── contentFingerprint.ts     — ContentFingerprint
├── analysisVersion.ts        — AnalysisVersion
├── referenceVideoAnalysis.ts — ReferenceVideoAnalysis (root analysis object)
├── packagePayloads.ts        — Typed package payloads
├── package.ts                — PackageEnvelope (discriminated union)
├── job.ts                    — JobRecord, JobFailure, DomainError
├── export.ts                 — ExportRecord
└── index.ts                  — Barrel export (re-exported from src/domain/index.ts)
```

---

## Rules (foundation lock)

1. **PP-02 terminology is authoritative** — do not introduce synonyms in schemas.
2. **ReferenceVideoAnalysis** contains observed/derived analysis only — no prompts or packages inside.
3. **Package Engine** consumes analysis via `PackageEnvelope` — payloads are outputs, not analysis.
4. **Legacy schemas remain** until Migration Phase E — `SourceAnalysis` is deprecated, not removed.
5. **No services, routes, repositories, workers, migrations, or UI** in PP-03.

---

## Acceptance

- [x] ReferenceVideoAnalysis Zod schema matches PP-02 sections
- [x] Package envelope discriminated union with five package types
- [x] ContentFingerprint, AnalysisVersion, Job, Export contracts
- [x] Job failure codes with category alignment validation
- [x] Domain glossary updated with PP-02 terms
- [x] Compatibility documentation and ADRs
- [x] Contract tests pass
- [ ] Human approval

---

## Next phase

**PP-04 — Persistence Design & Schema Inventory** requires ERM + migration strategy from PP-02.

See [12-final-architecture-review.md](../pp-02/12-final-architecture-review.md) for PP-04 readiness conditions.
