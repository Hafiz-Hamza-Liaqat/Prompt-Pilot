# PP-04B — End-to-End Runtime Pipeline

**Related:** [PP-02 AI pipeline](../pp-02/07-ai-pipeline.md) · [PP-02 job state machine](../pp-02/06-job-state-machine.md)

Canonical execution flow from user input to completed outputs. Extends PP-02 Step 8 with **runtime entry/exit points** and **operational boundaries**.

---

## 1. Pipeline diagram

```text
User Input
    │
    ▼
Validation ─────────────────────────────► FAILED (terminal)
    │
    ▼
Ownership Verification ────────────────► FAILED (terminal)
    │
    ▼
Media Intake ──────────────────────────► FAILED / EXPIRED
    │
    ▼
Fingerprint
    │
    ▼
Cache Lookup ─── HIT ──► (optional skip) ──► Package Generation
    │ MISS
    ▼
Core Analysis ─────────────────────────► FAILED
    │
    ▼
Package Generation ────────────────────► FAILED (partial allowed — see 04I)
    │
    ▼
Persistence (analysis + packages + cache write)
    │
    ▼
Workspace (read model refresh)
    │
    ▼
Export (user-initiated, post-job) ─────► optional parallel path
    │
    ▼
History (audit record)
    │
    ▼
Completed (Job terminal)
```

---

## 2. Entry points

| Entry | Trigger | Creates |
|---|---|---|
| **Reference submission (URL)** | User submits YouTube URL on project | Reference + Job (`created`) |
| **Reference submission (upload)** | User uploads video/audio | Reference + Job; may enter `uploading` first |
| **Reference submission (transcript/script)** | User pastes text | Reference + Job |
| **Job retry** | System or user after transient failure | New Job with `retryOfJobId` |
| **Re-analysis request** | User forces new analysis version | New Job even on cache hit |
| **Export request** | User selects packages after job complete | Export record (no new analysis job) |
| **Workspace read** | User opens project workspace | Read-only; no job |

**Not pipeline entry points:** Brief wizard steps (legacy parallel path); provider catalogue browse.

---

## 3. Exit points

| Exit | Condition | User-visible |
|---|---|---|
| **Completed** | All requested stages succeed; job `completed` | Yes — results in Workspace |
| **Failed** | Unrecoverable error with `JobFailure` | Yes — safe message + code |
| **Cancelled** | User cancels during active stages | Yes |
| **Expired** | Queue TTL or temp media TTL exceeded | Yes |
| **Export delivered** | Export Engine returns payload | Yes — copy/download |
| **Validation rejected (sync)** | Before job creation | Yes — inline form error |

---

## 4. Job state alignment

| Pipeline stage | Job state(s) | Progress weight (indicative) |
|---|---|---|
| Validation | `created` → `validated` | 5% |
| Ownership | part of `validated` | — |
| Media Intake | `preparing`, `uploading` | 10–15% |
| Fingerprint | `fingerprinting` | 20% |
| Cache Lookup | within `fingerprinting` | — |
| Core Analysis | `analyzing` | 55% |
| Package Generation | `generating_packages` | 85% |
| Persistence | `saving` | 95% |
| Completed | `completed` | 100% |

Source: [PP-02 §6 job progress](../pp-02/06-job-state-machine.md).

---

## 5. Retry boundaries

| Stage | Auto-retry | Manual retry | Notes |
|---|---|---|---|
| Validation | No | Resubmit | Fix input |
| Ownership | No | No | Auth failure is terminal for session |
| Media Intake | Yes (upload) | Yes | Resume upload only |
| Fingerprint | Yes (transient) | Yes | New job |
| Cache Lookup | Treat corrupt as miss | — | `cache_corrupt` → re-analyze |
| Core Analysis | Yes (transient infra) | Yes | Budget cap applies |
| Package Generation | Per-package retry | Yes | Partial failure handling |
| Persistence | Yes (transient) | Yes | Idempotent writes required |

**Retry creates new `jobId`** with `retryOfJobId` link — not in-place state rewind except upload resume.

---

## 6. Cancellation boundaries

User may cancel from: `queued`, `preparing`, `uploading`, `fingerprinting`, `analyzing`, `generating_packages`.

| Stage | On cancel |
|---|---|
| Before analysis persisted | No analysis artifact; temp media cleaned |
| After analysis, before packages | Analysis may remain if already saved — product policy |
| During package generation | Completed packages kept; incomplete discarded |

Cancellation → `cancelled` terminal state. No auto-retry from cancelled.

---

## 7. Resumable stages (checkpoints)

| Checkpoint | After stage | Resume behavior |
|---|---|---|
| CP-1 | Fingerprint committed | Skip re-intake if media still valid |
| CP-2 | Analysis persisted | Skip Core Analysis; run packages only |
| CP-3 | Per package type saved | Resume remaining package types |

Worker crash mid-job: new worker loads last checkpoint from Job + persisted entities.

Upload interrupt: resume **uploading** only — not full job restart.

---

## 8. Cache hit short path

```text
Fingerprint → Cache HIT → Load ReferenceVideoAnalysis
    │
    ├── User requested re-analysis → full Core Analysis path
    │
    └── Default → skip Analyzing → Generating Packages (if requested)
                              → Saving → Completed
```

Cache hit **never** skips Package Generation when packages were requested and not yet generated for this job.

---

## 9. Sync mock path (localhost MVP only)

| Constraint | Rule |
|---|---|
| Duration cap | Strict max duration for sync execution |
| Providers | Mock only |
| Worker | Inline orchestrator in request thread allowed |
| Production | **Must** use async worker |

Architecture Readiness Audit: long video requires async — production path assumes Job entity + worker.

---

## 10. Parallel paths (non-blocking)

| Path | Relationship to main pipeline |
|---|---|
| Brief wizard | Independent; informs Package Engine via optional dependency |
| Scene decomposition | Runs on brief duration; Workspace evaluation |
| Complexity / risk | Workspace evaluation |
| Provider recommendations | Workspace evaluation; Prompt Package input |
| Export | After job complete; separate command |

---

## Step 04B acceptance

- [x] Entry and exit points documented
- [x] Retry, cancel, resume boundaries defined
- [x] Aligned with PP-02 job states
- [x] Cache short path explicit
- [x] No implementation
