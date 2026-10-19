# PP-09 — Cache Layer

**Status:** IMPLEMENTATION COMPLETE (through PP-09B)  
**Design:** [09-cache-layer-design-audit.md](09-cache-layer-design-audit.md)  
**Hardening:** [09a1-cache-layer-design-hardening.md](09a1-cache-layer-design-hardening.md)  
**Dependencies:** PP-02 cache architecture · PP-04 Cache Service boundary · PP-05C persistence · PP-08 orchestrator

---

## Purpose

Design and (in PP-09B) implement the **Analysis Cache Layer** — fingerprint-driven lookup of `ReferenceVideoAnalysis` snapshots **before Core Analysis**, reducing duplicate analysis cost while enforcing per-user tenant isolation (G-31).

This track is **not** Link Intelligence metadata caching (`LinkMetadataCache` — separate port, PP-05).

---

## Naming note

| ID | Meaning |
|----|---------|
| **PP-09A** | Cache Layer Design Audit |
| **PP-09A.1** | Design hardening (fingerprint dependency, G-33 semantics, doc sync) |
| **PP-09B** | Cache Layer Implementation — **COMPLETE** |
| **PP-05C** | Persistence implementation — **COMPLETE** |

---

## Phases

| Phase | Goal | Status |
|-------|------|--------|
| **PP-09A** | Design audit | **COMPLETE** |
| **PP-09A.1** | Audit remediations (docs only) | **COMPLETE** |
| **PP-09B** | Runtime Cache Service + orchestrator delegate | **COMPLETE** |

---

## Fingerprint runtime prerequisite (PP-09B)

PP-09B requires **`fingerprintId`** and **`fingerprintAlgorithmVersion`** on orchestration context before `cache_lookup`.

The **`fingerprint` stage delegate is not implemented** today. Until it exists:

- **PP-09B tests** use injected fingerprint fixtures (test doubles).
- **Local integration** may use an approved temporary stub — not production.

PP-09A.1 does **not** implement fingerprint runtime. See [09a1 § Fingerprint runtime dependency](09a1-cache-layer-design-hardening.md#fingerprint-runtime-dependency-pp-09b-prerequisite).

---

## Canonical corrupt-cache behavior (G-33)

When a cache entry exists but analysis validation fails:

1. **Invalidate** the entry.
2. If invalidation succeeds → **cache miss** → continue to **Core Analysis** (no job failure).
3. If invalidation fails → job failure **`cache_corrupt`** (cache category, retryable).

Full specification: [09a1 § Canonical G-33 behavior](09a1-cache-layer-design-hardening.md#canonical-g-33--cache_corrupt-behavior).

---

## PP-05C reconciliation

Persistence PP-05C is **COMPLETE** in codebase and roadmap (`CacheRepository`, `cache_entries`, RLS). PP-09B adds Cache Service **above** the repository — no new DDL for MVP.

---

## Dependencies

| Phase | Relationship |
|-------|--------------|
| PP-02 | Cache key concept, per-user scope default, lifecycle |
| PP-03 | Analysis/fingerprint schemas for corrupt validation (G-33) |
| PP-04 | Cache Service boundary, G-15, G-30–G-33 |
| PP-05C | `CacheRepository`, `cache_entries`, RLS — **COMPLETE** |
| PP-06 | Job failure codes (`cache_corrupt` on invalidation failure only) |
| PP-08 | `cache_lookup` stage, `applyCacheShortCircuit` |
| Fingerprint runtime | **Upstream** — outputs required before cache lookup (not PP-09B scope) |
| PP-10A | Core Analysis design audit — **COMPLETE** |
| PP-10 | Core Analysis writes cache entries on miss path — [pp-10/README.md](../pp-10/README.md) |

---

## Verification (design — PP-09A / PP-09A.1)

- [x] No Cache Service runtime
- [x] Fingerprint dependency explicit
- [x] G-33 / `cache_corrupt` semantics unified
- [x] Roadmap synchronized
- [x] Cache Service runtime (PP-09B)
- [ ] Human approval recorded

---

## Verification (implementation — PP-09B, deferred)

```bash
npm run typecheck
npm test -- tests/cache
npm test -- tests/orchestration
npm test
```
