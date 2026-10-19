# Job State Machine — PP-02 Step 7

**Related:** [AI pipeline](07-ai-pipeline.md) · [Entity model](02-entity-relationship-model.md)

---

## 1. Job definition

A **Job** is one asynchronous execution of the [AI pipeline](07-ai-pipeline.md) for a single **Reference** within a **Project**.

Jobs are **idempotent by design intent**: retried jobs receive new `jobId` but may short-circuit at fingerprint cache.

---

## 2. Primary lifecycle (happy path)

```text
Created
    │
    ▼
Validated          (URL/upload/transcript checks, rights attestation)
    │
    ▼
Queued             (accepted, waiting for worker capacity)
    │
    ▼
Preparing          (resolve reference, allocate temp resources)
    │
    ▼
Uploading          (skip for URL; active for user file intake completion)
    │
    ▼
Fingerprinting     (compute fingerprint, cache lookup)
    │
    ├── Cache HIT (short path) ──► GeneratingPackages (optional skip Analyzing)
    │
    ▼
Analyzing          (Core Analysis → ReferenceVideoAnalysis)
    │
    ▼
GeneratingPackages (Package Engine — one or more types)
    │
    ▼
Saving             (persist analysis + packages + cache)
    │
    ▼
Completed
```

---

## 3. Terminal and error states

| State | Meaning | User-visible |
|---|---|---|
| **Failed** | Unrecoverable error; `failureCode` + safe message | Yes |
| **Cancelled** | User or system cancelled before completion | Yes |
| **Expired** | Exceeded TTL (queued too long, temp media expired) | Yes |
| **RetryPending** | Marked for automatic or manual retry | Internal / optional UI |

---

## 4. Failure codes (conceptual)

| Code category | Examples |
|---|---|
| Validation | `invalid_url`, `unsupported_platform`, `file_too_large`, `duration_exceeded` |
| Access | `private_content`, `geo_blocked`, `content_removed` |
| Rights | `attestation_missing`, `policy_blocked` |
| Processing | `transcription_failed`, `analysis_failed`, `package_generation_failed` |
| Infrastructure | `timeout`, `worker_unavailable`, `storage_error` |
| Cache | `cache_corrupt` — treat as miss and re-analyze |

---

## 5. Retry behavior

| From state | Retry creates |
|---|---|
| Failed (transient) | New Job in `Created` with `retryOfJobId` |
| RetryPending | Worker picks up → `Queued` |
| Cancelled | No auto-retry |
| Completed | New job only if user requests re-analysis |

**Max retries** and backoff: deferred to PP-05 (operations).

---

## 6. Progress model

Job exposes **progress** as weighted stages (not media rendering):

| Stage | Indicative weight |
|---|---|
| Validated | 5% |
| Preparing | 10% |
| Uploading | 15% |
| Fingerprinting | 20% |
| Analyzing | 55% |
| GeneratingPackages | 85% |
| Saving | 95% |
| Completed | 100% |

Progress UI must **not** imply video generation.

---

## 7. Cancellation

User may cancel from: `Queued`, `Preparing`, `Uploading`, `Fingerprinting`, `Analyzing`, `GeneratingPackages`.

Cancellation transitions to **Cancelled**; partial temp resources cleaned up.

---

## 8. Resume

**Resume** applies when:

- Worker crash mid-job → new worker may resume from last persisted checkpoint (implementation phase)
- Upload interrupted → resume upload stage only

Checkpoint boundaries (conceptual): post-Fingerprinting, post-Analyzing, post-each Package type.

---

## 9. Relationship to brief wizard

| Concept | Independent |
|---|---|
| Job pipeline | Reference-driven |
| Brief "Mark ready" | User intent for legacy workspace gate |

A project may have **Completed** analysis job while brief remains **Draft** — product UX merges these in Workspace.

---

## Step 7 acceptance

- [x] Happy path states defined
- [x] Error states defined
- [x] Retry, cancel, progress, resume documented
- [ ] Human approval
