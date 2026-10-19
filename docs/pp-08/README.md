# PP-08 — Job Orchestration Engine

**Status:** APPROVED  
**Dependencies:** PP-06 (Job Lifecycle), PP-07 (Media Intake boundaries)  
**Follow-up:** [PP-08.1 hardening](../pp-08.1/README.md)  
**Does not include:** Workers, uploads, AI, persistence, HTTP

---

## Objective

Implement the orchestration layer that **coordinates** all future processing pipelines. The orchestrator plans stages, delegates to domain service contracts, and propagates lifecycle transitions — it does **not** perform work.

---

## Deliverables

### Domain (`src/domain/orchestration/`)

| Module | Purpose |
|---|---|
| `models.ts` | `OrchestrationContext`, `OrchestrationRequest` variants, `OrchestrationResult` |
| `stages.ts` | `StageDefinition`, `PipelineStageId`, `DependencyGraph` |
| `execution-plan.ts` | `ExecutionPlan`, `StageCompletion`, plan progression helpers |
| `stage-planner.ts` | `StagePlanner`, reference-kind-aware stage lists |
| `events.ts` | `OrchestrationEvent` contract |
| `failure.ts` | Failure propagation, timeout policies |

### Server (`src/server/orchestration/`)

| Module | Purpose |
|---|---|
| `job-orchestrator.ts` | `JobOrchestrator` interface + DI tokens |
| `default-job-orchestrator.ts` | `DefaultJobOrchestrator` — coordinates PP-06 + PP-07 |
| `pipeline-coordinator.ts` | Stage → lifecycle transition planning (multi-hop BFS) |
| `orchestration-events.ts` | `OrchestrationEventPublisher`, subscriber contracts |
| `ports.ts` | Future ports: job persistence, analysis provider, package engine, persistence coordinator |

---

## Integration

```
Orchestrator
  ├── JobLifecycleService (PP-06) — transitions, cancel, retry, resume
  ├── MediaIntakeService (PP-07) — ownership/upload session contracts (planning only)
  ├── PipelineCoordinator — stage completion → JobTransitionRequest chain
  ├── StagePlanner — reference-kind execution plans
  └── OrchestrationEventPublisher — audit/event stream (in-memory default)
```

Future workers call `completeStage` with `StageCompletion` payloads. Port interfaces document which delegate executes each stage; no port implementations in PP-08.

---

## Pipeline stages

Linear pipeline aligned with PP-04B:

`validation → ownership → [media_intake] → fingerprint → cache_lookup → core_analysis → package_generation → persistence → workspace_refresh`

- `media_intake` omitted for non-upload reference kinds (`youtube_url`, `transcript`, `script`).
- Cache hit on `cache_lookup` skips `core_analysis` via `applyCacheShortCircuit`.
- **Link Intelligence** (`link_intelligence` stage) is implemented in [PP-05B](../pp-05/05b-link-intelligence-implementation.md). `youtube_url` plans include `link_intelligence` between `ownership` and `fingerprint`.

## Event contracts

See [PP-08.1 event matrix](../pp-08.1/README.md#event-emission-matrix). `timeout_scheduled` is reserved for the worker/scheduler boundary and is not emitted by the orchestrator.

---

## Tests

- `tests/orchestration/stagePlanner.spec.ts`
- `tests/orchestration/pipelineCoordinator.spec.ts`
- `tests/orchestration/failureHandling.spec.ts`
- `tests/orchestration/defaultJobOrchestrator.spec.ts`
- `tests/orchestration/mediaIntakeCoordination.spec.ts`

---

## Deferred

| Item | Phase |
|---|---|
| Worker execution loop | PP-08B / worker boundary |
| Port implementations (repos, AI, packages) | PP-05C, PP-10, PP-13 |
| HTTP status API | Later API phase |
| Upload byte transfer | PP-07B |
