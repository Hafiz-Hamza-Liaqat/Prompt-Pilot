# PP-04I — Failure & Recovery Architecture

**Related:** [PP-02 job state machine](../pp-02/06-job-state-machine.md) · [PP-03 JobFailureSchema](../../src/domain/canonical/job.ts)

Failure modes, recovery expectations, and user experience. No implementation.

---

## 1. Failure taxonomy

| Category | Codes (PP-03) | Typical stage |
|---|---|---|
| Validation | `invalid_url`, `unsupported_platform`, `file_too_large`, `duration_exceeded` | Pre-job or `validated` |
| Access | `private_content`, `geo_blocked`, `content_removed` | Media Intake |
| Rights | `attestation_missing`, `policy_blocked` | Validation / Ownership |
| Processing | `transcription_failed`, `analysis_failed`, `package_generation_failed` | Analyzing / Generating Packages |
| Infrastructure | `timeout`, `worker_unavailable`, `storage_error` | Any |
| Cache | `cache_corrupt` | Fingerprinting / Cache |

---

## 2. Validation failures

| Aspect | Behavior |
|---|---|
| Detection | Request Validator + Link Intelligence |
| Job created? | Prefer **no** job for hard validation failures; optional job in `failed` for audit |
| User message | Safe, actionable (fix URL, reduce size) |
| Retry | User resubmits corrected input |
| Recovery | None automatic |

---

## 3. Ownership failures

| Aspect | Behavior |
|---|---|
| Detection | `requireUser()`, RLS, project archived/deleted |
| Job created? | No |
| User message | Auth or permission error |
| Retry | Re-authenticate or restore project |
| Recovery | N/A |

---

## 4. Upload failures

| Aspect | Behavior |
|---|---|
| Detection | Storage provider error, network drop, MIME mismatch |
| Job state | `failed` or remain in `uploading` for resume |
| User message | Retry upload |
| Retry | **Resume** uploading stage; new job if expired |
| Recovery | Partial upload discarded on expiry (`expired`) |
| Temp cleanup | Orchestrator deletes partial objects |

---

## 5. Provider failures (AI / platform)

| Aspect | Behavior |
|---|---|
| Detection | Provider timeout, invalid JSON, rate limit |
| Job state | `failed` or `retry_pending` if transient |
| User message | Generic processing error; no provider internals |
| Retry | Auto for transient (bounded); manual retry creates new job |
| Recovery | Checkpoint CP-2 if analysis already persisted |
| Budget | Fail closed when cost cap exceeded — `analysis_failed` |

---

## 6. Timeouts

| Scope | Policy (deferred values) |
|---|---|
| URL metadata fetch | Short timeout; fail validation/access |
| Core Analysis | Long timeout; checkpoint if partial schema |
| Package generation | Per-type timeout; partial success allowed |
| Queued job | Queue TTL → `expired` |
| Temp media | Storage TTL → `expired` if job incomplete |

---

## 7. Retry strategy

| Failure class | Auto-retry | Max attempts |
|---|---|---|
| Infrastructure transient | Yes | Deferred (PP-07) |
| Provider rate limit | Yes with backoff | Deferred |
| Validation | No | — |
| Access / rights | No | — |
| Analysis schema invalid | No | — |
| Package single-type failure | Retry type only | Per job |

Backoff and max retries: **deferred to PP-07 operations design**.

---

## 8. Cancellation

| Stage | Behavior |
|---|---|
| User cancel | Transition to `cancelled`; stop worker |
| Cleanup | Temp media removed; partial packages policy per product |
| Billing | Orchestration may still consume credits — product decision |
| Recovery | User submits new reference |

Cancellable states: `queued`, `preparing`, `uploading`, `fingerprinting`, `analyzing`, `generating_packages`.

---

## 9. Resume strategy

| Checkpoint | Resume after |
|---|---|
| CP-1 (fingerprint) | Worker crash before analysis |
| CP-2 (analysis saved) | Worker crash during packages |
| CP-3 (partial packages) | One package type failed |

Upload resume is **special case** — only `uploading` sub-flow.

---

## 10. Cache misses and corrupt entries

| Scenario | Behavior |
|---|---|
| Miss | Normal path to Core Analysis |
| Corrupt entry | `cache_corrupt`; treat as miss; invalidate entry |
| Hit but user force re-analyze | Skip cache by job flag |
| Hit, packages missing | Run package generation only |

---

## 11. Partial package failures

| Scenario | Behavior |
|---|---|
| Blueprint OK, Prompt failed | Job → `failed` or `retry_pending`; Blueprint persisted (CP-3) |
| User visibility | Show partial results in Workspace with warning |
| Retry | Orchestrator retries failed types only |
| Export | Only export-ready packages (`exportReady: true`) |

---

## 12. User-facing recovery expectations

| Terminal state | User actions |
|---|---|
| `failed` | View error code message; retry job; contact support if persistent |
| `cancelled` | Resubmit reference |
| `expired` | Resubmit; check file still available |
| `completed` | View workspace; export packages |
| Partial packages | Retry failed types; export successful packages |

---

## 13. Observability (deferred)

| Signal | Purpose |
|---|---|
| Job events log | Debug stage failures |
| Structured `DomainError` | API responses |
| Internal metrics | Cost, cache hit rate, failure codes |

Implementation: PP-07+.

---

## Step 04I acceptance

- [x] All failure categories covered
- [x] Retry, cancel, resume, cache, partial packages documented
- [x] Recovery expectations stated
- [x] No implementation
