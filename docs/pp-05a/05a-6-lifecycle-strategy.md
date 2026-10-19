# PP-05A-6 — Lifecycle Strategy

**Related:** [05a-1-domain-to-persistence-mapping.md](05a-1-domain-to-persistence-mapping.md) · [PP-02 fingerprint lifecycle](../pp-02/05-content-fingerprint.md)

Lifecycle operations per persisted entity. **No implementation.**

Legend: ✅ allowed · ❌ forbidden in MVP · ⏳ deferred

---

## 1. Reference

| Operation | Policy |
|---|---|
| **Creation** | On user submission with attestation |
| **Update** | Access status, metadata corrections only |
| **Archive** | Via project archive — read-only |
| **Soft delete** | With project soft delete |
| **Hard delete** | ⏳ Retention job after project purge |
| **Expiration** | ❌ Reference row persists |
| **Versioning** | ❌ Row not versioned |
| **Retention** | Life of project + grace period |
| **Cleanup** | ⏳ Orphan cleanup if submission aborted |
| **Recovery** | Restore via project restore |

---

## 2. ReferenceVideoAnalysis

| Operation | Policy |
|---|---|
| **Creation** | Insert on Core Analysis complete (or cache attach) |
| **Update** | ❌ Immutable — `isLatest` flag flip only |
| **Archive** | Read-only when project archived |
| **Soft delete** | Hidden with project |
| **Hard delete** | ⏳ With project purge |
| **Expiration** | ❌ |
| **Versioning** | ✅ Monotonic per reference |
| **Retention** | All versions kept in MVP (history) |
| **Cleanup** | ⏳ Optional prune old versions post-MVP |
| **Recovery** | N/A — append new version |

---

## 3. Package / PackageManifest

| Operation | Policy |
|---|---|
| **Creation** | Insert on generation |
| **Update** | ❌ Immutable payload |
| **Archive** | Read-only |
| **Soft delete** | With project |
| **Hard delete** | ⏳ Project purge |
| **Expiration** | ❌ |
| **Versioning** | ✅ Per analysis + type |
| **Retention** | All versions in MVP |
| **Cleanup** | ⏳ |
| **Recovery** | Regenerate via new package version |

---

## 4. Job / JobEvent

| Operation | Policy |
|---|---|
| **Creation** | Orchestrator on submission |
| **Update** | Job: state/progress/failure only; Events: ❌ insert-only |
| **Archive** | Read-only |
| **Soft delete** | ❌ Jobs retained for audit |
| **Hard delete** | ⏳ After retention window (e.g. 90 days) |
| **Expiration** | ✅ `expired` terminal state |
| **Versioning** | New job per retry |
| **Retention** | Full history MVP |
| **Cleanup** | ⏳ Old terminal jobs |
| **Recovery** | Retry = new job |

---

## 5. Export

| Operation | Policy |
|---|---|
| **Creation** | User export action |
| **Update** | ❌ |
| **Archive** | N/A |
| **Soft delete** | ❌ |
| **Hard delete** | ⏳ Optional TTL on blob only |
| **Expiration** | WorkspaceAsset blob TTL if stored |
| **Versioning** | Each export distinct |
| **Retention** | Metadata long; blob short |
| **Cleanup** | Storage TTL job |
| **Recovery** | Re-export from packages |

---

## 6. ContentFingerprint

| Operation | Policy |
|---|---|
| **Creation** | Fingerprinting stage |
| **Update** | State transitions: candidate→active→invalidated |
| **Archive** | N/A |
| **Soft delete** | ❌ |
| **Hard delete** | ⏳ After invalidated + grace |
| **Expiration** | ✅ `expired` state |
| **Versioning** | Algorithm version → new row |
| **Retention** | Invalidated rows for audit |
| **Cleanup** | Scheduled expire sweep |
| **Recovery** | Recompute fingerprint |

---

## 7. CacheEntry

| Operation | Policy |
|---|---|
| **Creation** | On analysis cache write |
| **Update** | Hit stats only (`lastHitAt`, `hitCount`) |
| **Archive** | N/A |
| **Soft delete** | ❌ |
| **Hard delete** | On TTL expire / invalidation purge |
| **Expiration** | ✅ TTL mandatory |
| **Versioning** | Replaced on invalidation |
| **Retention** | TTL-bound |
| **Cleanup** | Scheduled sweeper |
| **Recovery** | Miss → re-analyze |

---

## 8. WorkspaceAsset

| Operation | Policy |
|---|---|
| **Creation** | Upload start / export blob |
| **Update** | Upload complete metadata |
| **Archive** | N/A |
| **Soft delete** | Mark expired |
| **Hard delete** | ✅ Storage object delete after TTL |
| **Expiration** | ✅ Mandatory (hours–days) |
| **Versioning** | Replace on re-upload |
| **Retention** | Minimal |
| **Cleanup** | Aggressive — primary cost control |
| **Recovery** | Re-upload |

---

## 9. ProviderUsage

| Operation | Policy |
|---|---|
| **Creation** | Append on provider call |
| **Update** | ❌ Ledger |
| **Archive** | N/A |
| **Soft delete** | ❌ |
| **Hard delete** | ⏳ Never in MVP |
| **Expiration** | ❌ |
| **Versioning** | N/A |
| **Retention** | Indefinite for billing audit |
| **Cleanup** | ⏳ |
| **Recovery** | N/A |

---

## 10. RightsAttestation

| Operation | Policy |
|---|---|
| **Creation** | On reference submission |
| **Update** | ❌ |
| **Retention** | Legal minimum — indefinite MVP |

---

## 11. Project / Video Brief (existing)

| Entity | Notes |
|---|---|
| **Project** | Existing archive/soft-delete — pivot entities follow |
| **Video Brief** | Existing upsert wizard — unchanged until Migration Phase E |

---

## Step 05A-6 acceptance

- [x] Lifecycle dimensions documented per entity
- [x] Immutable vs mutable columns implied
- [x] Cleanup/TTL aligned with PP-02/PP-04
