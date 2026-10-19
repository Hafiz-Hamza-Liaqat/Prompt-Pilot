# Cache Architecture — PP-02 Step 9

**Related:** [Content fingerprint](05-content-fingerprint.md) · [AI pipeline](07-ai-pipeline.md)

**No Redis. No database schema.** Architecture only.

---

## 1. Purpose

Reduce duplicate **Core Analysis** cost and latency by reusing **ReferenceVideoAnalysis** snapshots keyed by **Content Fingerprint**.

Cache does **not** store Packages by default — packages may be cheaper to regenerate from cached analysis than to cache separately (product decision per package type).

---

## 2. Cache key (conceptual)

```text
cacheKey = f(
  fingerprintAlgorithmVersion,
  fingerprintId
)
```

Optional scoping dimensions (policy — deferred):

| Scope | Effect |
|---|---|
| Global | Maximum deduplication; privacy implications |
| Per-user | Safer; less hit rate |
| Per-project | Most conservative |

**PP-02 default recommendation:** **Per-user cache scope** until legal review approves global sharing.

---

## 3. Cache entry structure (conceptual)

| Field | Description |
|---|---|
| `cacheKey` | Lookup key |
| `fingerprintId` | Source fingerprint |
| `analysisId` | Cached analysis snapshot reference |
| `analysisVersion` | Version pinned |
| `pipelineVersion` | Analysis pipeline version |
| `createdAt` | Entry creation |
| `lastHitAt` | Last successful lookup |
| `hitCount` | Usage counter |
| `expiresAt` | TTL deadline |
| `invalidatedAt` | Null or invalidation timestamp |
| `invalidationReason` | Enum |

---

## 4. Cache ownership

| Entity | Owner |
|---|---|
| Cache entry | Platform (system) |
| Analysis snapshot | Project that first created it — **or** shared read-only if global scope |
| Invalidation authority | System policy + admin |

User deletion of project **must not** silently delete shared cache entries other users depend on — use reference counting or scope isolation.

---

## 5. Cache lifecycle

```text
WRITE on analysis complete (cache miss path)
    │
    ▼
ACTIVE (TTL countdown)
    │
    ├── HIT → update lastHitAt, hitCount
    │
    ├── TTL expired → EXPIRED → purge
    │
    └── invalidation event → INVALIDATED → purge
```

---

## 6. Cache invalidation

| Event | Action |
|---|---|
| Fingerprint algorithm version change | Invalidate all entries with old version |
| Analysis pipeline version change (breaking) | Invalidate or mark stale — configurable per version policy |
| Platform content removed | Invalidate entries tied to platform content ID |
| Manual admin purge | Targeted or bulk |
| User force re-analyze | Bypass cache for that job only |

**Stale-while-revalidate:** optional — serve stale analysis while background re-analysis runs (deferred).

---

## 7. Cache versioning

Cache entries pin:

- `fingerprintAlgorithmVersion`
- `analysisId` + `analysisVersion`
- `pipelineVersion`

Package generation uses cached analysis **only** if pipeline version satisfies package generator compatibility matrix (defined in PP-03).

---

## 8. Cache dependencies

| Dependent | Depends on |
|---|---|
| Job Fingerprinting stage | Cache lookup service |
| Package Engine | Analysis (from cache or fresh) |
| Credits engine | Cache hit may reduce credit charge (policy) |
| Cost tracking | Hit/miss metrics |

---

## 9. Storage technology (deferred)

Implementation may use:

- Postgres cache table (simplest for MVP)
- Supabase + RLS scoped rows
- External Redis (only if budget and ops allow)

PP-02 does not choose technology.

---

## Step 9 acceptance

- [x] Cache key, ownership, lifecycle, invalidation, versioning documented
- [x] No technology selection
- [ ] Human approval on cache scope policy
