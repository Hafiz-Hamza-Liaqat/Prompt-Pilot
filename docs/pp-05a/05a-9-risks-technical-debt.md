# PP-05A-9 — Risks & Technical Debt

**Related:** [Architecture Readiness Audit](../pivot/04-architecture-audit.md) · [05a-7-migration-strategy.md](05a-7-migration-strategy.md)

---

## 1. High-risk persistence areas

| Area | Risk | Severity | Recommendation |
|---|---|---|---|
| **Job + orchestrator state** | Lost updates, duplicate packages on retry | Critical | Optimistic locking on job row; idempotent `packageId`/`analysisId` |
| **Analysis JSON size** | Large ReferenceVideoAnalysis rows exceed row limits | High | Monitor payload size; compress or section split in PP-05B if >512KB |
| **Cache + fingerprint scope** | Wrong scope leaks or misses hits | High | Enforce scope in repository queries; integration tests |
| **WorkspaceAsset TTL** | Orphan storage cost | High | Mandatory sweeper; link metadata to reference lifecycle |
| **Dual-read period** | Inconsistent workspace display | Medium | Single WorkspaceRepository composer; feature flag |
| **RLS on JSON tables** | Policy bugs expose other users' analysis | Critical | pgTAP per table; IDOR integration scripts |

---

## 2. Migration issues

| Issue | Impact | Mitigation |
|---|---|---|
| `FORBIDDEN_APPLICATION_TABLES` guard | CI fails if tables added without inventory update | PP-05B first PR updates inventory + migration together |
| Legacy brief coexistence | Two intake paths | Migration Phase A–D; don't merge brief into reference row |
| Empty pivot tables in Phase A | Orphan schema | Ship with hidden routes only |
| Rollback from Phase D | Users on canonical path | Keep dual-read flag 30 days |

---

## 3. Scalability concerns

| Concern | MVP | Future |
|---|---|---|
| Job history row growth | Unbounded per project | Partition by `created_at` or archive cold jobs |
| JobEvent volume | Multiple events per job | Batch or sample in production metrics |
| Analysis version history | All versions kept | Retention policy post-MVP |
| Package payload duplication | Full JSON per version | Accept for MVP; dedupe hashes later |
| ProviderUsage ledger | Low volume initially | Index by user_id + created_at |

---

## 4. Partitioning (future)

| Entity | Partition candidate | Trigger |
|---|---|---|
| Job / JobEvent | Time-based | >10M rows |
| ProviderUsage | Time-based | Billing scale |
| ReferenceVideoAnalysis | By project_id hash | Enterprise scale |

**MVP:** No partitioning — single Postgres instance.

---

## 5. Long-video storage implications

| Aspect | Implication |
|---|---|
| Temp upload size | Storage bucket limits; chunked upload metadata in WorkspaceAsset |
| Analysis duration | Larger transcript segments in JSON — watch row size |
| Job duration | Long-running jobs — worker heartbeat + checkpoint CP-2 |
| Media retention | **Short TTL** — analysis must not depend on media after CP-2 |
| Re-analysis | Requires re-upload if media expired |

---

## 6. Cache growth concerns

| Concern | Mitigation |
|---|---|
| Unbounded cache entries | TTL on CacheEntry; sweeper job |
| Per-user scope reduces hits | Accept until global cache ADR |
| Invalidation storms | Algorithm version bump → batch invalidate |
| Stale analysis reused | Pin `pipelineVersion` in cache entry; miss if mismatch |

---

## 7. Analysis version migration risks

| Risk | Mitigation |
|---|---|
| Schema contract bump (PP-03) | Store `pipelineVersion` + contract version on row |
| Old versions unreadable | Adapter layer reads old versions; migration job optional |
| isLatest flag drift | Transactional flip on insert |
| Package pinned to old version | By design — packages immutable |

---

## 8. Technical debt accepted (MVP)

| Debt | Reason |
|---|---|
| PackageManifest may embed in package row | Simpler MVP schema |
| WorkspaceRepository as service not table | Faster delivery |
| ProviderUsage schema before PP-18 enforcement | Forward-compatible ledger |
| No hard delete for jobs | Audit preference |

---

## 9. Recommendations summary

1. **PP-05B:** Define max JSON payload guidance and index strategy in DDL design doc.
2. **PP-07:** Implement job optimistic locking and idempotent inserts first.
3. **PP-06:** WorkspaceAsset TTL sweeper is day-one requirement.
4. **PP-08:** Cache TTL + invalidation integration tests before real AI.
5. **ADR:** Global cache scope before enabling cross-user CacheEntry.

---

## Step 05A-9 acceptance

- [x] Risks identified with recommendations
- [x] Scalability and long-video noted
- [x] No implementation
