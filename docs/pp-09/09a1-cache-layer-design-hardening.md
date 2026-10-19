# PP-09A.1 — Cache Layer Design Hardening

**Status:** COMPLETE  
**Dependencies:** PP-09A (GO WITH CONDITIONS)  
**Scope:** Documentation only — **no runtime changes**.

---

## Audit conditions closed

| Condition | Resolution |
|-----------|------------|
| Fingerprint upstream dependency | Documented in [09-cache-layer-design-audit.md](09-cache-layer-design-audit.md) §5.0 and [README.md](README.md) |
| `cache_corrupt` semantics | Canonical G-33 behavior documented in all PP-09 docs |
| Roadmap / wording consistency | Phase 11 PP-05C wording fixed; Phase 13 global-cache reference corrected |

---

## Fingerprint runtime dependency (PP-09B prerequisite)

PP-09B **depends on** a fingerprint runtime capable of binding on `OrchestrationContext` **before** `cache_lookup`:

| Output | Purpose |
|--------|---------|
| `fingerprintId` | `EntityId` of active `ContentFingerprint` |
| `fingerprintAlgorithmVersion` | Monotonic version for G-32 keying and repository guard |

### Current state

| Component | Status |
|-----------|--------|
| `fingerprint` pipeline stage (PP-08) | Planned in stage planner |
| Fingerprint delegate / stage runner | **Not implemented** |
| `OrchestrationContext.fingerprintId` | **Not bound** today |

PP-09A design assumed these outputs; PP-09A.1 makes the gap explicit.

### Approved strategies until fingerprint runtime exists

PP-09B **must not** be blocked on full fingerprint production implementation. Until a fingerprint delegate exists, use one of:

1. **Test doubles** — inject `fingerprintId` + `fingerprintAlgorithmVersion` in unit/orchestration tests (primary strategy for PP-09B).
2. **Temporary integration stub** — approved composition-root stub that binds fixed fixture fingerprint values for local integration tests only (not production).

PP-09B does **not** implement fingerprint computation, persistence, or the `fingerprint` stage runner.

---

## Canonical G-33 / `cache_corrupt` behavior

All PP-09 documentation uses this **single** behavior:

```text
Cache entry found (repository hit)
    → load analysis by analysisId
    → validate (existence + schema when AnalysisRepository available)

If validation FAILS (corrupt):
    1. invalidate(cacheKey)          — soft invalidate via CacheRepository
    2. If invalidation SUCCEEDS:
         treat as CACHE MISS
         completeStage(cacheHit: false)
         continue to core_analysis
         (no job failure; no cache_corrupt on JobRecord)
    3. If invalidation FAILS:
         propagate job failure
         code: cache_corrupt
         category: cache
         retryable: true
```

| Outcome | Job failure? | Pipeline |
|---------|--------------|----------|
| Corrupt + invalidate OK | No | Miss → Core Analysis |
| Corrupt + invalidate fails | Yes (`cache_corrupt`) | Stage failure propagation |
| Repository/storage error on lookup | Yes (`storage_error`) | Stage failure propagation |
| Clean miss (no entry) | No | Miss → Core Analysis |

This aligns with PP-04B §5 (“Treat corrupt as miss”) while reserving `cache_corrupt` for **infrastructure failure during invalidation**, not for “bad analysis payload” alone.

---

## Documentation updates

| File | Change |
|------|--------|
| `09-cache-layer-design-audit.md` | §5.0 fingerprint dependency; §10.1 canonical corrupt semantics; §11.2 wording |
| `README.md` | PP-09A.1 status, prerequisite + corrupt summary |
| `prompt-pilot-roadmap.md` | Phase 13a; Phase 11 PP-05C COMPLETE wording |

---

## Verification

Documentation-only phase — no `npm test` required. Confirm no files under `src/server/cache/` were added.

---

## Remaining deferred work

| Item | Phase |
|------|-------|
| Cache Service runtime | PP-09B |
| Fingerprint stage runtime | Separate track (upstream of end-to-end cache) |
| Full analysis schema validation on hit | PP-09B stub → PP-10 hardening |
| PP-09B implementation | After PP-09A.1 approval |

**Stop after PP-09A.1.** Do not begin PP-09B.
