# PP-04E — Runtime Orchestrator

**Related:** [04b-end-to-end-runtime-pipeline.md](04b-end-to-end-runtime-pipeline.md) · [PP-02 job state machine](../pp-02/06-job-state-machine.md)

The **Runtime Orchestrator** is the single authority for pipeline execution. Documentation only.

---

## 1. Role

The Orchestrator is **not** a UI component and **not** an AI provider. It coordinates services, enforces job state transitions, and persists progress.

```text
API Layer ──► Orchestrator ──► Services ──► Repositories
                  │
                  ├── state machine
                  ├── progress
                  ├── retry / cancel / resume
                  └── failure recording
```

---

## 2. What starts execution?

| Trigger | Orchestrator action |
|---|---|
| Validated reference submission | Create `JobRecord` (`created` → `validated` → `queued`) |
| Worker picks up job | `queued` → first active stage |
| Retry command | New job with `retryOfJobId`; starts at `created` |
| Resume after crash | Worker claims job at last checkpoint |
| Sync mock (dev only) | Inline execution through all stages in request thread |

**Only the Orchestrator** may create pipeline jobs for reference analysis (not individual services).

---

## 3. Who coordinates stages?

| Responsibility | Owner |
|---|---|
| Stage ordering | Orchestrator |
| Service invocation | Orchestrator delegates to one service per stage |
| Parallel package types | Orchestrator may invoke Package Generator facade with type list; facade may run types sequentially in MVP |
| Brief/engine parallel path | **Not** orchestrated by main job unless explicitly requested as package inputs |

Stage graph is **linear with cache branch** — see [04b](04b-end-to-end-runtime-pipeline.md).

---

## 4. Who updates progress?

| Actor | Updates |
|---|---|
| Orchestrator | `JobRecord.progressPercent`, `JobRecord.state`, `updatedAt` |
| Job events (conceptual) | Append-only log: stage entered, stage completed, warnings |
| Frontend | Read-only poll/subscribe — never writes progress |

Progress weights from PP-02 — must not imply video rendering.

---

## 5. Who performs retries?

| Retry type | Handler |
|---|---|
| Automatic transient retry | Orchestrator or worker policy (max attempts deferred) |
| Manual user retry | API → Orchestrator creates new job |
| Upload resume | Orchestrator resumes `uploading` sub-state |
| Package partial retry | Orchestrator retries failed package types only (CP-3) |

Services **return errors**; Orchestrator **decides** retry vs fail.

---

## 6. Who resumes interrupted work?

| Scenario | Resume owner |
|---|---|
| Worker crash | New worker + Orchestrator loads checkpoint from Job Repository + persisted entities |
| Upload interrupt | Orchestrator + Media Intake Service |
| Deploy restart | Queue drains; jobs in active states reclaimed |

Checkpoints: post-fingerprint, post-analysis, post-each package type.

---

## 7. Who marks completion?

| Condition | Actor |
|---|---|
| All requested packages saved (or none requested) | Orchestrator → `saving` → `completed` |
| Cache hit with packages already present | Orchestrator may skip generation → `completed` |
| Export | **Does not** complete analysis job — separate Export flow |

`completed` requires `progressPercent === 100` per `JobRecordSchema`.

---

## 8. Who records failures?

| Actor | Records |
|---|---|
| Orchestrator | `JobFailure` on `failed` or `retry_pending` |
| Request Validator | Validation failure before job creation (may not create job) |
| Services | Structured error return — no direct job mutation |

Failure codes from `JOB_FAILURE_CODES` (PP-03). Category must align with code map.

---

## 9. Orchestrator dependencies

| Allowed | Forbidden |
|---|---|
| All pipeline services | Direct AI SDK calls (delegate to services) |
| Job, Reference, Analysis, Package, Fingerprint, Cache repositories | Frontend imports |
| Config (TTL, caps, feature flags) | Business logic in controllers |
| History Service (append) | Skipping state machine transitions |

---

## 10. Worker boundary (conceptual)

```text
┌──────────────┐     claim job      ┌─────────────────┐
│  Job Queue   │ ◄──────────────── │  Worker process │
│  (future)    │ ────────────────► │  invokes        │
└──────────────┘     heartbeat      │  Orchestrator   │
                                    └─────────────────┘
```

MVP may use sync mock worker; production requires async worker (PP-07).

---

## 11. Idempotency expectations

| Operation | Idempotency key |
|---|---|
| Create reference + job | Client submission token or dedupe window |
| Persist analysis | `analysisId` + version |
| Persist package | `packageId` |
| Cache write | `fingerprintId` + algorithm version |
| State transition | Job ID + expected prior state (optimistic lock) |

---

## Step 04E acceptance

- [x] Start, coordinate, progress, retry, resume, complete, fail documented
- [x] Single orchestrator authority explicit
- [x] Worker boundary noted
- [x] No implementation
