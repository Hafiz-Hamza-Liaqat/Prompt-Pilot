# PP-10 â€” Core Analysis

**Status:** DESIGN COMPLETE (PP-10A Â· PP-10A.1) Â· Implementation **COMPLETE** (PP-10)
**Design:** [10-core-analysis-design-audit.md](10-core-analysis-design-audit.md) Â· [Input assembly matrix](10a-input-assembly-matrix.md) Â· [PP-10A.1 hardening](10a1-core-analysis-design-hardening.md)
**Dependencies:** PP-02 analysis spec Â· PP-03 contracts Â· PP-04 Core Analysis boundary Â· PP-05B link + media handoff Â· PP-05C persistence Â· PP-08 orchestrator Â· PP-09B cache

---

## Purpose

Design and (in PP-10) implement **Core Analysis** â€” the sole pipeline stage allowed to interpret media or transcript into an immutable **`ReferenceVideoAnalysis`** snapshot (G-07). PP-10 ships a **mock provider** only; real AI is deferred to PP-12.

This track is **not** Package Engine, Workspace UI, Link Intelligence, or analysis cache lookup (PP-09 read path).

---

## Naming note

| ID | Meaning |
|----|---------|
| **PP-10A** | Core Analysis Design Audit â€” **COMPLETE** |
| **PP-10A.1** | Design hardening (audit remediations) â€” **COMPLETE** |
| **PP-10** | Core Analysis Implementation (mock provider) â€” **COMPLETE** |
| **PP-11** | Core Analysis UI & Workspace Integration |
| **PP-12** | Real AI Analysis Provider Boundary |

---

## Phases

| Phase | Goal | Status |
|-------|------|--------|
| **PP-10A** | Design audit â€” component model, ports, persistence, cache write, failures, tests | **COMPLETE** |
| **PP-10A.1** | Independent audit remediations (docs only) | **COMPLETE** |
| **PP-10** | `CoreAnalysisCoordinator`, `MockAnalysisProvider`, `executeCoreAnalysisStage`, port adapter, factory, unit + orchestration tests | **COMPLETE** |

---

## Architecture pattern (locked by PP-10A)

Mirrors Link Intelligence (PP-05B) and Cache (PP-09B):

```text
JobOrchestrator (workflow authority)
        â”‚
        â–¼
executeCoreAnalysisStage (thin runner)
        â”‚
        â”œâ”€â”€ CoreAnalysisCoordinator (orchestration of analysis + persist + cache write)
        â”‚       â”‚
        â”‚       â”œâ”€â”€ MockAnalysisProvider (PP-10) â€” DTO only, no I/O
        â”‚       â”œâ”€â”€ AnalysisRepository.insert (PP-05C)
        â”‚       â””â”€â”€ CacheCoordinator.writeEntry (PP-09B)
        â”‚
        â””â”€â”€ completeStage â†’ bind analysisId on context
```

The mock **provider** returns a `ReferenceVideoAnalysis` DTO only. **`CoreAnalysisCoordinator`** owns `AnalysisRepository.insert` and `CacheCoordinator.writeEntry`. **`executeCoreAnalysisStage`** owns workflow glue and `completeStage` (G-06).

---

## Fingerprint dependency

| Context | Fingerprint runtime required? |
|---------|------------------------------|
| PP-10A design | **No** |
| PP-10 isolated development / unit tests | **No** â€” test doubles inject `fingerprintId` + `fingerprintAlgorithmVersion` |
| PP-10 production E2E activation | **Yes** â€” G-30; analysis row and cache write both require fingerprint identity |

PP-10A does **not** design or implement fingerprint runtime. See [Â§7 in design audit](10-core-analysis-design-audit.md#7-fingerprint-dependency).

---

## Cache integration (PP-09)

| Path | Core Analysis behavior |
|------|------------------------|
| Cache **hit** | `core_analysis` **skipped** (`applyCacheShortCircuit`); no write |
| Cache **miss** | Mock provider runs â†’ persist analysis â†’ `CacheCoordinator.writeEntry` |
| Analysis **failure** | No persist, no cache write |

Full specification: [design audit Â§6](10-core-analysis-design-audit.md#6-cache-integration-pp-09).

---

## Dependencies

| Phase | Relationship |
|-------|--------------|
| PP-02 | ReferenceVideoAnalysis spec, pipeline stage definition, G-07 |
| PP-03 | `ReferenceVideoAnalysisSchema`, fixtures â€” **no schema changes in PP-10** |
| PP-04 | Core Analysis service boundary (04C Â§6), sequences (04G) |
| PP-05B | Link metadata + URL media descriptor handoff (`youtube_url`) |
| PP-05C | `AnalysisRepository`, `reference_analyses` table |
| PP-07 / PP-07B | Upload asset descriptors (`video_upload`, `audio_upload`) |
| PP-08 | `core_analysis` stage, `AnalysisProviderPort` stub, skip-on-cache-hit |
| PP-09B | Cache read path; **`writeEntry` on miss path (PP-10 wires it)** |
| Fingerprint runtime | Upstream for production â€” **not PP-10A / not blocking PP-10 tests** |

---

## Verification (design â€” PP-10A)

- [x] Component boundaries defined
- [x] Orchestration flow documented
- [x] Persistence ownership documented
- [x] Cache write sequencing documented
- [x] Failure model documented
- [x] Fingerprint dependency documented
- [x] Testing strategy documented
- [x] Explicit non-goals stated
- [x] No runtime implementation
- [ ] Human approval recorded

---

## Verification (implementation â€” PP-10)

```bash
npm run typecheck
npm test -- tests/analysis
npm test -- tests/cache tests/orchestration
```

| Check | Result |
|-------|--------|
| Analysis module (`src/server/analysis/`) | **PASS** |
| Unit + coordinator + stage-runner + adapter + factory tests (40) | **PASS** |
| Cache + orchestration regressions (46) | **PASS** |
| Typecheck | **PASS** |
| Full project build | **Pre-existing failure** â€” missing `upload-factory.js` / `upload-http.js` (PP-07B track, outside PP-10 scope) |

---

## Next phase

**PP-11 â€” Core Analysis UI & Workspace Integration** follows the master roadmap. Composition-root wiring, workers, and production orchestration integration are separate follow-on phases and do not require PP-10 architectural changes.
