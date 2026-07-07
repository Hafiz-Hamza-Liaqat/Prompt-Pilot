# PP-10A â€” Core Analysis Design Audit

**Phase:** Design only
**Status:** COMPLETE
**Rule:** No runtime code, no schema changes, no HTTP, no UI, no workers, no fingerprint implementation, no cache redesign.

**Related:** [PP-02 ReferenceVideoAnalysis spec](../pp-02/01-reference-video-analysis-specification.md) Â· [PP-04C service boundaries](../pp-04/04c-service-boundaries.md) Â· [PP-04B pipeline](../pp-04/04b-end-to-end-runtime-pipeline.md) Â· [PP-04G sequences](../pp-04/04g-runtime-sequence-diagrams.md) Â· [PP-05B Link Intelligence](../pp-05/05b-link-intelligence-implementation.md) Â· [PP-09 cache layer](../pp-09/09-cache-layer-design-audit.md) Â· [PP-08 orchestrator](../pp-08/README.md) Â· [Pivot MVP definition](../pivot/06-mvp-definition.md)

---

## Executive summary

**Core Analysis** is the sole stage permitted to interpret intake material into **`ReferenceVideoAnalysis`** (G-07). PP-08 already plans the `core_analysis` stage, delegates it to `analysis_provider`, and skips it on cache hit. PP-05C provides **`AnalysisRepository`**. PP-09B provides cache lookup and **`CacheCoordinator.writeEntry`** for the miss-path populate step.

**What is missing:** the Core Analysis **service runtime** â€” coordinator, mock provider, stage runner, and port adapter â€” following the same pattern as Link Intelligence and Cache.

PP-10 will implement:

- `CoreAnalysisCoordinator` â€” assembles inputs, invokes provider, validates output, persists, writes cache
- `MockAnalysisProvider` â€” deterministic fixture-driven analysis (no AI)
- `executeCoreAnalysisStage` â€” thin workflow glue calling coordinator then `JobOrchestrator.completeStage`
- `createAnalysisProviderPort` â€” adapts coordinator to existing `AnalysisProviderPort`

**Recommended port strategy:** **Option B** â€” keep `AnalysisProviderPort` thin; use internal `AnalyzeReferenceInput` on the coordinator (mirrors `LinkIntelligenceRequest` vs `AnalyzeLinkInput`).

**Persistence canonical sequence:**

```text
MockAnalysisProvider â†’ ReferenceVideoAnalysis DTO
    â†’ AnalysisRepository.insert()
    â†’ CacheCoordinator.writeEntry()
    â†’ orchestrator.completeStage()
```

The provider **never** persists. Cache write happens **only after successful insert**, **never on failure**.

---

## 1. Core Analysis architecture

### 1.1 Component model

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     JobOrchestrator (PP-08)                      â”‚
â”‚  Plans stages Â· skip core_analysis on cache hit Â· completeStage  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                â”‚
                                â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚           executeCoreAnalysisStage (PP-10 runner)                â”‚
â”‚  Context â†’ coordinator input Â· failure mapping Â· completeStage   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                â”‚
                                â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚              CoreAnalysisCoordinator (PP-10)                     â”‚
â”‚  Input assembly Â· provider dispatch Â· Zod validate Â· persist     â”‚
â”‚  Â· cache write Â· version assignment                              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚                             â”‚
        â–¼                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ MockAnalysis     â”‚    â”‚ AnalysisRepository (PP-05C)               â”‚
â”‚ Provider         â”‚    â”‚ CacheCoordinator.writeEntry (PP-09B)      â”‚
â”‚ (DTO only)       â”‚    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### 1.2 Pipeline position

```text
â€¦ â†’ cache_lookup â”€â”€HITâ”€â”€â–º package_generation â†’ â€¦
                 â””â”€â”€MISSâ”€â”€â–º core_analysis â†’ package_generation â†’ â€¦
```

On cache hit, PP-08 `applyCacheShortCircuit` adds `core_analysis` to `skippedStageIds` and binds `analysisId` from cache lookup. Core Analysis **does not run** and **does not write cache**.

### 1.3 Reference to existing orchestrator behavior (PP-08 â€” do not redefine)

Already implemented:

- `core_analysis` in `PIPELINE_STAGE_IDS` after `cache_lookup`
- `STAGE_DEFINITIONS.core_analysis.delegatePort` = `'analysis_provider'`
- `dependsOn: ['cache_lookup']`, `skippable: true`
- Cache miss â†’ next stage `core_analysis`; job state â†’ `analyzing`
- `DEFAULT_STAGE_TIMEOUT_POLICIES` includes `core_analysis: 600_000` ms

---

## 2. Component ownership

### 2.1 Ownership matrix

| Component | Owns | Must never |
|-----------|------|------------|
| **JobOrchestrator** | Stage progression, skip-on-cache-hit, failure propagation, binding `analysisId` on context after stage completion | Call AI; persist analysis; write cache; interpret media |
| **executeCoreAnalysisStage** | Map context â†’ coordinator input; invoke coordinator; map errors â†’ `JobFailure`; call `completeStage`; enrich returned context with `analysisId` | Contain analysis logic; call repositories directly (delegates to coordinator) |
| **CoreAnalysisCoordinator** | Input resolution (context + repos); provider selection; output Zod validation; `analysisId` / version assignment; orchestrate insert + cache write in order; return success/failure codes | Advance job state; skip cache write on failure; call Package Engine; fetch URLs |
| **MockAnalysisProvider** | Deterministic `ReferenceVideoAnalysis` DTO from assembled intake view; observed/inferred/confidence labeling rules for mock | Persist; write cache; network I/O; call orchestrator; read repositories |
| **AnalysisRepository** | Immutable insert/read of `ReferenceVideoAnalysis` rows | Generate analysis; invoke AI; write cache entries |
| **CacheCoordinator.writeEntry** | Create cache row keyed by fingerprint + scope after analysis exists | Run Core Analysis; skip insert guard; advance job state |

### 2.2 Governance alignment

| Rule | Application |
|------|-------------|
| **G-06** | Provider returns DTO; coordinator persists |
| **G-07** | Only Core Analysis interprets media/transcript into analysis |
| **G-11** | Insert new snapshot; never mutate existing analysis row |
| **G-17** | Do not extend `SourceAnalysisSchema` |
| **G-29** | `storageLocator` on analysis.media is internal; never API-facing |
| **G-30** | Fingerprint identity required on persisted analysis (production path) |

---

## 3. AnalysisProviderPort architecture

### 3.1 Current state (PP-08 stub)

`AnalysisProviderPort` exists in `src/server/orchestration/ports.ts`:

```typescript
export type AnalysisProviderRequest = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  requestedAt: IsoDateTime;
};

export type AnalysisProviderResult = OrchestrationResult<{
  analysisId: EntityId;
  completedAt: IsoDateTime;
}>;

export type AnalysisProviderPort = {
  readonly providerId: string;
  analyze(request: AnalysisProviderRequest): Promise<AnalysisProviderResult>;
};
```

This is **insufficient** for standalone port invocation without `OrchestrationContext` â€” unlike `CacheLookupRequest`, it lacks fingerprint and reference-kind fields.

### 3.2 Option A â€” extend `AnalysisProviderRequest`

Add fields to the orchestrator delegate request:

```typescript
export type AnalysisProviderRequest = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
  requestedAt: IsoDateTime;
  // optional handles for input resolution
  linkMetadataId?: EntityId;
  urlMediaDescriptorId?: EntityId;
};
```

| Pros | Cons |
|------|------|
| Port is self-contained for worker delegation | Port surface grows with every intake path |
| Symmetric with `CacheLookupRequest` | Duplicates fields already on `OrchestrationContext` |
| | Future upload/transcript handles require further port churn |

### 3.3 Option B â€” thin port + internal `AnalyzeReferenceInput` (recommended)

Keep `AnalysisProviderPort` unchanged. Define coordinator input internally:

```typescript
/** Internal â€” CoreAnalysisCoordinator only (PP-10). */
export type AnalyzeReferenceInput = {
  jobId: EntityId;
  referenceId: EntityId;
  projectId: EntityId;
  ownerId: EntityId;
  referenceKind: ReferenceKind;
  fingerprintId: EntityId;
  fingerprintAlgorithmVersion: MonotonicVersion;
  occurredAt: IsoDateTime;
  /** Resolved intake â€” coordinator loads missing pieces from repos when absent. */
  intake: ReferenceIntakeView;
};

/** Normalized intake snapshot for mock/AI providers â€” not a new domain entity. */
export type ReferenceIntakeView = {
  linkMetadata?: LinkMetadata;
  urlDescriptor?: UrlMediaIntakeDescriptor;
  uploadAsset?: Pick<TemporaryAsset, 'assetId' | 'mimeType' | 'byteSize' | 'durationSeconds' | 'storageLocator'>;
  transcriptText?: string;
  scriptText?: string;
  rightsAttestationId?: EntityId;
};
```

Port adapter (`createAnalysisProviderPort`) maps the thin orchestrator request to the coordinator for **DI registration only**. The canonical execution path is **`executeCoreAnalysisStage` â†’ `CoreAnalysisCoordinator.analyzeReference()`** â€” mirroring `executeLinkIntelligenceStage` â†’ `LinkIntelligenceCoordinator.analyzeLink()`, which bypasses the port at runtime.

| Pros | Cons |
|------|------|
| Matches Link Intelligence: `LinkIntelligenceRequest` (port) vs `AnalyzeLinkInput` (coordinator) | Port alone cannot run analysis without context â€” acceptable because stage runner always has context |
| Intake evolution stays in coordinator, not orchestrator contracts | Worker boundary must pass context or pre-resolved `AnalyzeReferenceInput` (PP-10 scope: stage runner) |
| Minimal PP-08 contract churn | |

### 3.4 Recommendation: **Option B**

**Justification:**

1. **Established precedent** â€” PP-05B uses a rich coordinator input and a port adapter that maps the thinner orchestrator request.
2. **Input assembly is inherently contextual** â€” upload assets and transcript text are not yet fully bound on `OrchestrationContext`; forcing them onto the port duplicates repository-resolution logic at the worker boundary.
3. **PP-12 swap** â€” Real AI provider replaces `MockAnalysisProvider` behind the same coordinator; port stability matters less than coordinator contract stability.
4. **Cache port already carries fingerprint** â€” Core Analysis stage runner reads fingerprint from context (same as `executeCacheLookupStage`); no need to duplicate on analysis port for MVP.

**PP-10 implementation note:** Optionally add `referenceKind` and fingerprint fields to `AnalysisProviderRequest` in a **PP-10.1 hardening** pass if worker-only port invocation becomes a requirement â€” not required for PP-10 MVP.

### 3.5 Port result shape

Keep existing `AnalysisProviderResult`:

```typescript
{ analysisId: EntityId; completedAt: IsoDateTime }
```

Full `ReferenceVideoAnalysis` is persisted before the port returns; consumers load via `AnalysisRepository` using `analysisId` on context.

---

## 4. Input assembly

PP-10A documents input sources **without modifying** `OrchestrationContext`. Gaps are resolved in PP-10 via coordinator repository loads or stage-runner-local resolution.

### 4.1 Fields on `OrchestrationContext` today

| Field | Set by | Used for |
|-------|--------|----------|
| `ownerId`, `projectId`, `referenceId` | Job start | Scope on all paths |
| `job` | Lifecycle | Job identity, state |
| `plan.referenceKind` | Stage planner | Branching intake assembly |
| `linkMetadataId` | `link_intelligence` stage | YouTube path â€” load metadata |
| `urlMediaDescriptorId` | Link stage + media handoff | YouTube path â€” load descriptor |
| `uploadSessionId` | Upload API (optional) | Upload path â€” resolve to asset |
| `fingerprintId`, `fingerprintAlgorithmVersion` | Fingerprint stage (or test double) | Analysis identity + cache write |
| `analysisId` | Cache hit only | Skip Core Analysis |

### 4.2 Repository loads (coordinator responsibility)

| Data | Repository / source | Reference kinds |
|------|---------------------|-----------------|
| Link metadata | In-memory from prior stage **or** future persistence; PP-10 may accept handoff via stage input cache | `youtube_url` |
| URL media descriptor | Reconstruct from `LinkMetadata` via `resolveUrlReferenceFromLinkMetadata` if ID matches linkMetadataId; else load when persisted | `youtube_url` |
| Upload asset | `UploadSessionRepository.findById` via `context.uploadSessionId` (completed session: `storageLocator`, MIME, size); optional `WorkspaceAssetRepository.findById` when asset row ID is known | `video_upload`, `audio_upload` |
| Transcript / script text | `ReferenceRepository` (reference payload) | `transcript`, `script` |
| Rights attestation | `ReferenceRepository` | All kinds |
| Prior analysis version | `AnalysisRepository.getLatestByReference` | Re-analysis / version increment |

### 4.3 Per reference kind

#### YouTube URL (`youtube_url`)

```text
OrchestrationContext
  linkMetadataId â”€â”€â–º LinkMetadata (stage handoff or repo)
  urlMediaDescriptorId â”€â”€â–º UrlMediaIntakeDescriptor
  fingerprintId / fingerprintAlgorithmVersion
        â”‚
        â–¼
ReferenceIntakeView { linkMetadata, urlDescriptor, rightsAttestationId }
```

**Observed fields source:** platform metadata (title, duration, author, access status).
**Derived fields source:** mock rules from metadata + fixture templates.

#### Uploaded media (`video_upload`, `audio_upload`)

```text
OrchestrationContext
  uploadSessionId â”€â”€â–º UploadSessionRepository (completed session)
  fingerprintId / fingerprintAlgorithmVersion
        â”‚
        â–¼
ReferenceIntakeView { uploadAsset fields from session, rightsAttestationId }
```

**Gap (documented, not fixed in PP-10A):** context carries `uploadSessionId` but not `assetId`. PP-10 coordinator resolves intake from the **completed upload session** (`storageLocator`, `mimeType`, `expectedBytes` / `uploadedBytes`). When a `WorkspaceAssetRecord` exists, coordinator may load it by known `assetId` as a secondary path.

**Observed fields source:** MIME, byte size, duration from asset metadata.
**Derived fields source:** mock templates; no real frame/audio analysis in PP-10.

#### Transcript (`transcript`)

```text
ReferenceRepository â”€â”€â–º transcript text
fingerprintId / fingerprintAlgorithmVersion
        â”‚
        â–¼
ReferenceIntakeView { transcriptText, rightsAttestationId }
```

**Observed fields source:** user-supplied text, normalized.
**Derived fields source:** mock timeline/scene inference from text structure (deterministic rules).

#### Script (`script`)

Same as transcript with `scriptText` and `referenceKind: 'script'`. Mock may treat script as authoritative for story/hook sections with `observed` confidence where text explicitly states structure.

### 4.4 Context gaps summary (PP-10 resolves, PP-10A does not change context)

| Gap | PP-10 resolution |
|-----|------------------|
| No `assetId` on context | Coordinator | Load completed upload via `UploadSessionRepository.findById(uploadSessionId)` |
| No transcript/script on context | Coordinator loads from `ReferenceRepository` |
| Link metadata not persisted | Stage runner passes metadata from link stage outcome into coordinator input **or** coordinator reconstructs from URL descriptor |
| Fingerprint not bound in production | Test doubles for PP-10 tests; **production E2E requires upstream fingerprint runtime** (does not block PP-10 implementation or tests) |

---

## 5. Persistence sequencing

### 5.1 Canonical sequence (cache miss path)

```text
1. executeCoreAnalysisStage invoked (context.analysisId must be unset)
2. CoreAnalysisCoordinator.assemble intake
3. MockAnalysisProvider.analyze(intake) â†’ ReferenceVideoAnalysis DTO (unsaved)
4. ReferenceVideoAnalysisSchema.safeParse(dto) â€” fail â†’ analysis_failed
5. AnalysisRepository.insert(scope, dto) â€” fail â†’ storage_error / scope_violation
6. CacheCoordinator.writeEntry({ scope, fingerprintId, fingerprintAlgorithmVersion,
                                  analysisId, analysisVersion, pipelineVersion, expiresAt })
   â€” fail â†’ storage_error (analysis row exists; cache orphan acceptable â€” no duplicate analysis insert)
7. orchestrator.completeStage({ stageId: 'core_analysis', outcome: 'success' })
8. Return context with analysisId bound
```

### 5.2 Ownership rules

| Step | Owner |
|------|-------|
| DTO construction | MockAnalysisProvider |
| Schema validation | CoreAnalysisCoordinator |
| `analysisId` assignment | Coordinator (before insert) |
| `version.analysisVersion` / `isLatest` | Coordinator (query latest + increment) |
| `AnalysisRepository.insert` | CoreAnalysisCoordinator |
| `setLatestVersion` | Coordinator after insert (same transaction policy as PP-05C) |
| `CacheCoordinator.writeEntry` | CoreAnalysisCoordinator |
| `completeStage` | executeCoreAnalysisStage â†’ JobOrchestrator |

### 5.3 Reconciliation with PP-04B / PP-04G

PP-04G sequence shows analysis persist + cache write **before** package generation. PP-04B lists a late aggregate `persistence` stage for packages.

**Canonical rule for PP-10:**

- **Analysis persist + cache write** â€” end of `core_analysis` stage (this document)
- **Package persist** â€” `persistence` stage (PP-13+)
- **No duplicate analysis insert** in later stages

### 5.4 Cache hit path

No Core Analysis invocation. No insert. No cache write. Context carries `analysisId` from cache lookup.

### 5.5 Idempotency

PP-10 MVP: coordinator generates new `analysisId` per successful run. Retry creates new job (G-22). Duplicate insert on same `analysisId` is a persistence error â€” coordinator does not silently overwrite.

---

## 6. Cache integration (PP-09)

### 6.1 Read path (PP-09B â€” unchanged)

`executeCacheLookupStage` runs before Core Analysis. On hit, `core_analysis` is skipped.

### 6.2 Write path (PP-10 wires)

After successful `AnalysisRepository.insert`:

```typescript
await cacheCoordinator.writeEntry({
  scope: { ownerId, projectId },
  fingerprintId,
  fingerprintAlgorithmVersion,
  analysisId: analysis.analysisId,
  analysisVersion: analysis.version.analysisVersion,
  pipelineVersion: analysis.pipelineVersion,
  expiresAt, // design default: now + 90 days â€” align with PP-09 Â§4.3
});
```

### 6.3 Rules

| Rule | Detail |
|------|--------|
| Write after insert | Cache entry references persisted `analysisId` |
| No write on provider failure | Provider error â†’ no insert, no cache |
| No write on validation failure | Zod fail â†’ `analysis_failed`, no I/O |
| No write on insert failure | `storage_error`; no cache write attempted |
| No write on cache hit | Stage skipped entirely |
| No duplicate persistence | Provider does not insert; cache coordinator does not insert analysis rows |
| Reuse existing API | `CacheCoordinator.writeEntry` only â€” no cache redesign |
| Per-user scope | G-31 â€” `scope.ownerId` in cache key |

### 6.4 Failure ordering

If **insert succeeds** but **cache write fails**:

- Job fails with `storage_error` (retryable)
- Analysis row remains (orphan cache â€” acceptable; next run may miss cache and skip re-analysis if analysis already latest â€” product policy: PP-10 logs warning; manual cache backfill deferred)

PP-10 tests must cover this path.

---

## 7. Fingerprint dependency

| Statement | Detail |
|-----------|--------|
| **Structural for production** | G-30; `ReferenceVideoAnalysis.fingerprintId` required; cache write requires fingerprint key |
| **Not required for PP-10A** | Design-only phase |
| **Not required for isolated PP-10 dev** | Unit/integration tests inject fingerprint fixtures (same strategy as PP-09B) |
| **Not designed in PP-10A** | Fingerprint Service runtime is out of scope |
| **Test doubles** | `executeCoreAnalysisStage` input override: `{ fingerprintId, fingerprintAlgorithmVersion }` mirroring `CacheLookupStageInput` |

Production E2E activation of Core Analysis requires upstream fingerprint stage binding context before `cache_lookup` and `core_analysis`.

---

## 8. Failure model

Reuse existing canonical job failure codes from `src/domain/canonical/job.ts`.

### 8.1 Mapping table

| Condition | Job failure code | Category | Retryable | Stage |
|-----------|------------------|----------|-----------|-------|
| Provider throws / returns error | `analysis_failed` | processing | Per policy | `core_analysis` |
| Zod validation fails on DTO | `analysis_failed` | processing | false | `core_analysis` |
| Mock transcript path cannot normalize text | `transcription_failed` | processing | false | `core_analysis` |
| Missing required intake (no asset, no text) | `analysis_failed` | processing | false | `core_analysis` |
| Missing fingerprint on context (production guard) | `analysis_failed` | processing | false | `core_analysis` |
| `AnalysisRepository.insert` error | `storage_error` | storage | true | `core_analysis` |
| Scope violation on insert | `policy_blocked` | policy | false | `core_analysis` |
| `CacheCoordinator.writeEntry` error | `storage_error` | storage | true | `core_analysis` |
| Orchestrator lifecycle rejection | (orchestration error) | â€” | â€” | propagated by runner |

### 8.2 Codes explicitly not used by Core Analysis

| Code | Reason |
|------|--------|
| `cache_corrupt` | Cache layer only (G-33 invalidation failure) |
| `invalid_url` | Link Intelligence / validation stages |
| `unsupported_platform` | Link Intelligence |

### 8.3 New codes

**None required for PP-10.** Do not add failure codes unless PP-12 introduces distinct AI provider categories.

### 8.4 Stage runner failure propagation

Mirror `executeCacheLookupStage` / `executeLinkIntelligenceStage`:

```typescript
orchestrator.propagateFailure({
  context,
  failure: mappedJobFailure,
  occurredAt,
  stageId: 'core_analysis',
});
```

---

## 9. Output assembly (MockAnalysisProvider)

### 9.1 Schema compliance

Mock output **must** pass `ReferenceVideoAnalysisSchema` without modification to the canonical schema.

Use `tests/fixtures/validReferenceVideoAnalysisFixture` as the structural template. Provider clones fixture shape and overlays intake-specific observed fields.

### 9.2 Required top-level fields

All fields in `ReferenceVideoAnalysisSchema` are required. MVP **display** subset (PP-11) does not relax schema requirements.

### 9.3 MVP population strategy

| Section | MVP priority | Mock strategy |
|---------|--------------|---------------|
| `metadata` | **MVP** | Populate from link metadata / asset / reference |
| `media` | **MVP** | Observed from intake; `storageLocator` only for upload (internal) |
| `transcript` | **MVP** | User text or mock caption from metadata |
| `timeline`, `scenes` | **MVP** | Deterministic segments from duration or text paragraphs |
| `story`, `hooks`, `audience`, `cta` | **MVP** | Derived from fixture templates |
| `camera`, `editing` | **MVP** | Fixture defaults with `derived` confidence |
| `objects`, `characters`, `locations`, `lighting`, `emotions` | **MVP+** | Minimal empty arrays or single placeholder entry; confidence `unsupported` or `derived` |
| `seoSeeds` | **MVP** (seeds only) | Topic phrases from title/transcript keywords |
| `safety` | **Required** | Always include `transformationNotice` |
| `fingerprint` | **Required** | Map from context fingerprint + descriptive input strings |
| `version` | **Required** | Coordinator may overwrite; provider supplies initial `{ analysisVersion: 1, isLatest: true, changeReason: 'initial' }` |

### 9.4 Observed vs inferred labeling

| Source | Typical confidence |
|--------|-------------------|
| Platform metadata (title, duration, author) | `observed` |
| Upload MIME, size, measured duration | `observed` / `measured` |
| User transcript/script text | `observed` |
| Mock scene boundaries, story beats | `derived` |
| MVP+ sections not interpreted in mock | `unsupported` with minimal placeholders |

Per-field confidence maps follow PP-02 Â§ Confidence section.

### 9.5 Fingerprint ref on analysis object

`ContentFingerprint.fingerprintInputs` uses `{ factor, descriptor }[]`. Analysis embeds `fingerprint.fingerprintInputs` as `string[]` (descriptive labels). Coordinator maps:

```text
"fingerprintInputs": ["reference_kind:youtube_url", "platform_content_id:â€¦"]
```

### 9.6 Pipeline version

Mock provider reads semver from config constant, e.g. `CORE_ANALYSIS_PIPELINE_VERSION = '1.0.0-mock'`.

---

## 10. Orchestration integration

### 10.1 Stage runner signature (design)

```typescript
export type CoreAnalysisStageInput = {
  occurredAt: IsoDateTime;
  /** Test-double override when upstream intake not fully wired. */
  intakeOverride?: Partial<ReferenceIntakeView>;
  fingerprintId?: EntityId;
  fingerprintAlgorithmVersion?: MonotonicVersion;
};

export async function executeCoreAnalysisStage(
  orchestrator: JobOrchestrator,
  coordinator: CoreAnalysisCoordinator,
  context: OrchestrationContext,
  input: CoreAnalysisStageInput,
): Promise<OrchestrationResult<OrchestrationOutcome>>;
```

### 10.2 Flow

1. Guard: if `context.analysisId` already set (cache hit leak), return validation error
2. Guard: resolve fingerprint from context or input override
3. Transition job to `analyzing` if not already (mirror link stage `applyJobTransitions`)
4. **`coordinator.analyzeReference(assembledInput)`** â€” canonical path; do not route through `AnalysisProviderPort` inside the stage runner (mirrors Link Intelligence)
5. On failure â†’ `propagateFailure`
6. On success â†’ `completeStage({ stageId: 'core_analysis', outcome: 'success' })`
7. Merge `analysisId` into returned context

### 10.3 Skip behavior

When `core_analysis` is in `plan.skippedStageIds`, orchestrator never delegates to stage runner. PP-10 tests must not invoke runner for skip scenarios â€” covered by existing orchestration tests.

### 10.4 DI tokens

| Token | Implementation |
|-------|----------------|
| `ORCHESTRATION_PORT_TOKENS.analysisProvider` | `createAnalysisProviderPort(coordinator)` |
| `PERSISTENCE_TOKENS.analysisRepository` | Injected into coordinator |
| Cache coordinator | Injected into coordinator (same factory as PP-09B) |

---

## 11. Planned code locations (PP-10 â€” not implemented in PP-10A)

| Area | Path |
|------|------|
| Coordinator + types | `src/server/analysis/core-analysis-coordinator.ts` |
| Mock provider | `src/server/analysis/mock-analysis-provider.ts` |
| Provider interface | `src/server/analysis/analysis-provider.ts` |
| Port adapter | `src/server/analysis/analysis-port-adapter.ts` |
| Stage runner | `src/server/analysis/core-analysis-stage-runner.ts` |
| Factory | `src/server/analysis/analysis-factory.ts` |
| Barrel | `src/server/analysis/index.ts` |
| Tests | `tests/analysis/*.spec.ts` |

No new domain entities under `src/domain/canonical/`.

---

## 12. Testing strategy (PP-10 implementation)

Documentation only â€” tests are delivered in PP-10, not PP-10A.

### 12.1 Unit tests

| Target | Cases |
|--------|-------|
| `MockAnalysisProvider` | Each reference kind produces valid Zod output; confidence labels; fixture determinism |
| `CoreAnalysisCoordinator` | Happy path insert + cache write; validation failure; insert failure; cache write failure; version increment on re-analysis |
| Input assembly | YouTube / upload / transcript / script intake views |
| Port adapter | Maps coordinator result to `AnalysisProviderResult` |

### 12.2 Stage runner tests

| Case | Expected |
|------|----------|
| Success | `completeStage` called; context.analysisId set |
| Missing fingerprint | `propagateFailure` with `analysis_failed` |
| Coordinator failure | Correct job failure code mapping |
| Fingerprint test double | Override applied |

### 12.3 Orchestration integration

| Case | Expected |
|------|----------|
| Cache miss â†’ core_analysis â†’ package_generation | Stage order preserved |
| Cache hit | Runner not invoked; existing PP-08 tests |
| Failure propagation | Job â†’ `failed` or `retry_pending` per policy |

### 12.4 Persistence tests

| Case | Expected |
|------|----------|
| Insert called once | No duplicate rows |
| `setLatestVersion` | Prior versions marked not latest |
| Scope violation | `policy_blocked` |

### 12.5 Cache tests

| Case | Expected |
|------|----------|
| writeEntry after insert | Correct fingerprint + analysisId |
| Provider failure | writeEntry not called |
| Insert success, write fail | `storage_error`; analysis row exists |

### 12.6 Test doubles

Reuse patterns from `tests/cache/test-doubles.ts`:

- In-memory `AnalysisRepository`
- Fingerprint fixtures injected via stage input
- `validReferenceVideoAnalysisFixture` as golden structure

---

## 13. Explicit non-goals (PP-10A and PP-10 mock scope)

PP-10A does **not** include and PP-10 mock does **not** implement:

| Item | Deferred to |
|------|-------------|
| Real AI providers (OpenAI, Gemini, etc.) | PP-12 |
| Real transcription / STT | PP-12 |
| Package Engine | PP-13 |
| Workspace UI / analysis panels | PP-11 |
| Workers / queue execution loop | PP-08B+ |
| Fingerprint runtime / stage runner | Separate track (upstream) |
| HTTP routes / API endpoints | Later API phase |
| Cache layer redesign | â€” |
| Schema changes to `ReferenceVideoAnalysisSchema` | â€” |
| `SourceAnalysis` extension | Forbidden (G-17) |
| Cross-user cache sharing | Human approval + legal |
| LinkMetadataCache implementation | Optional PP-05 future |

---

## 14. PP-10 implementation checklist (forward)

PP-10 may start after PP-10A human approval:

- [ ] `CoreAnalysisCoordinator` per Â§2
- [ ] `MockAnalysisProvider` per Â§9
- [ ] `executeCoreAnalysisStage` per Â§10
- [ ] `createAnalysisProviderPort` (Option B)
- [ ] Unit tests per Â§12
- [ ] Orchestration integration tests
- [ ] No schema changes
- [ ] `npm run typecheck` + focused tests pass
- [ ] Roadmap PP-10 marked COMPLETE

---

## Step PP-10A acceptance

- [x] Component boundaries defined
- [x] Orchestration flow documented
- [x] Persistence ownership documented
- [x] Cache integration documented
- [x] Failure handling documented
- [x] Fingerprint dependency documented
- [x] Testing strategy documented
- [x] AnalysisProviderPort recommendation (Option B)
- [x] Input assembly for all reference kinds
- [x] Explicit non-goals stated
- [x] No runtime implementation
- [ ] Human approval recorded
