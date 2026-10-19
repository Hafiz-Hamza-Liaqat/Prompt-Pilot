# PP-08.1 — Orchestrator Hardening & Documentation Cleanup

**Status:** COMPLETE  
**Dependencies:** PP-08 (approved with conditions)  
**Scope:** Audit remediations only — no new runtime capabilities.

---

## Changes

| Area | Change |
|------|--------|
| PP-06 docs | README + roadmap updated — PP-08 orchestration complete; worker boundary still deferred |
| Event contracts | `stage_planned`, `stage_delegated`, `stage_failed` now emitted; `timeout_scheduled` explicitly deferred |
| Event typing | `OrchestrationOutcome.events` typed as `OrchestrationEventType[]` |
| PP-07 coordination | Comment clarifying event-only media cancel until session handles exist in context |
| Link Intelligence | PP-05B/05B.1 integrated — see pipeline below |
| Tests | `tests/orchestration/mediaIntakeCoordination.spec.ts` — mocked `MediaIntakeService` |

---

## Event emission matrix

| Event | Emitted by orchestrator | When |
|---|---|---|
| `orchestration_started` | Yes | `start()` |
| `stage_planned` | Yes | Handoff to next stage |
| `stage_delegated` | Yes | Handoff to next stage |
| `stage_completed` | Yes | Successful stage completion |
| `stage_skipped` | Yes | Skipped stage completion |
| `stage_failed` | Yes | Failure propagation |
| `failure_propagated` | Yes | After lifecycle failure transition |
| `retry_planned` | Yes | `planRetry()` |
| `cancellation_requested` | Yes | `cancel()` |
| `resume_planned` | Yes | `planResume()` |
| `orchestration_completed` | Yes | Terminal plan |
| `timeout_scheduled` | **Deferred** | Worker/scheduler arms deadlines (PP-08B+) |

---

## Link Intelligence pipeline (PP-05B / PP-05B.1)

`youtube_url` references include a `link_intelligence` stage and **omit** `media_intake` (upload path unchanged).

```
validation → ownership → link_intelligence → fingerprint → …
```

Within `link_intelligence` (orchestrator-owned via `executeLinkIntelligenceStage`):

1. **JobOrchestrator** transitions job to `preparing`.
2. **LinkIntelligenceCoordinator** normalizes URL, applies SSRF guards, fetches provider metadata, returns `LinkMetadata`.
3. **Media Intake handoff (PP-05B.1)** — production composition **must** inject `MediaIntakeService` into `executeLinkIntelligenceStage` via `{ mediaIntake }`. Maps `LinkMetadata` → `UrlMediaIntakeDescriptor` (pure, no fetch/persistence). See [PP-05 production composition](../pp-05/05b2-documentation-composition-hardening.md#production-composition-rule).
4. **JobOrchestrator** completes `link_intelligence`, binds `linkMetadataId` and `urlMediaDescriptorId` on `OrchestrationContext`, advances to `fingerprint`.

`video_upload` references skip `link_intelligence` and use `media_intake` as before.

---

## Verification

```bash
npm run typecheck
npm test -- tests/orchestration
npm test -- tests/link
npm test
```

---

## Still deferred

| Item | Phase |
|------|-------|
| `MediaIntakeService.cancelSession` invocation | PP-07B + orchestrator context extension |
| `timeout_scheduled` emission | Worker/scheduler boundary |
| Job lifecycle ↔ orchestration event unification | Post worker boundary |
| Link metadata cache backend | PP-05C |
| Vimeo provider | PP-05C |
