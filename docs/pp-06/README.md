# PP-06 — Job Lifecycle Infrastructure

**Status:** COMPLETE  
**Scope:** Domain models, state machine, lifecycle services (interfaces + pure default implementation). No persistence, workers, or AI.

## Deliverables

| Area | Location |
|------|----------|
| Job models & results | `src/domain/job/models.ts` |
| State machine | `src/domain/job/state-machine.ts` |
| Progress model | `src/domain/job/progress.ts` |
| Retry model | `src/domain/job/retry.ts` |
| Cancellation model | `src/domain/job/cancellation.ts` |
| Resume model | `src/domain/job/resume.ts` |
| Event contracts | `src/domain/job/events.ts` |
| Pure lifecycle engine | `src/domain/job/lifecycle-engine.ts` |
| Service interfaces | `src/server/job/job-lifecycle-service.ts` |
| Default service | `src/server/job/default-job-lifecycle-service.ts` |
| Tests | `tests/job/*.spec.ts` |

## Canonical alignment

- **Job state enum:** reuses locked `JOB_STATES` from `src/domain/canonical/constants.ts`
- **Job aggregate:** `JobRecord` from PP-03 — not redefined
- **Progress weights:** reuses `JOB_PROGRESS_STAGE_WEIGHTS` from PP-03

## PP-08 integration

`JobLifecycleService` is consumed by `DefaultJobOrchestrator` (PP-08) for transition validation, cancellation, retry, and resume coordination. The orchestrator applies lifecycle transitions; it does not replace lifecycle domain logic.

See [PP-08 orchestration](../pp-08/README.md) and [PP-08.1 hardening](../pp-08.1/README.md).

## Verification

```bash
npm run typecheck
npm test
```

## Deferred

- PP-05C persistence adapters (intentionally deferred)
- Worker execution loop (orchestrator worker boundary — post PP-08)
- Operational retry backoff tuning in production config
- Unified job lifecycle ↔ orchestration event stream

## Out of scope

SQL, migrations, repository implementations, AI providers, uploads, link intelligence, UI, workers.
