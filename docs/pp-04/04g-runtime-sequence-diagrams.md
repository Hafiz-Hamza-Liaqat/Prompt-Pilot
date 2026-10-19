# PP-04G — Runtime Sequence Diagrams

**Related:** [04b-end-to-end-runtime-pipeline.md](04b-end-to-end-runtime-pipeline.md) · [04e-runtime-orchestrator.md](04e-runtime-orchestrator.md)

Conceptual sequence diagrams only. Participants use PP-02/PP-03 terminology.

---

## 1. URL Analysis (YouTube)

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as API Layer
    participant VAL as Request Validator
    participant ORC as Orchestrator
    participant LINK as Link Intelligence
    participant MEDIA as Media Intake
    participant FP as Fingerprint Service
    participant CACHE as Cache Service
    participant CORE as Core Analysis
    participant PKG as Package Engine
    participant REPO as Repositories

    User->>FE: Submit YouTube URL + attestation
    FE->>API: Create reference job
    API->>VAL: Validate payload
    VAL-->>API: Valid command
    API->>ORC: Start job
    ORC->>REPO: Create Reference + Job (created)
    ORC->>ORC: validated → queued → preparing
    ORC->>LINK: Normalize URL, SSRF-safe check
    LINK-->>ORC: Platform metadata descriptors
    ORC->>MEDIA: Resolve URL reference
    MEDIA-->>ORC: Media descriptors (no download)
    ORC->>ORC: fingerprinting
    ORC->>FP: Compute fingerprint
    FP->>REPO: Save fingerprint
    ORC->>CACHE: Lookup
    CACHE-->>ORC: MISS
    ORC->>ORC: analyzing
    ORC->>CORE: Analyze descriptors
    CORE-->>ORC: ReferenceVideoAnalysis
    ORC->>REPO: Persist analysis
    ORC->>CACHE: Write cache entry
    ORC->>ORC: generating_packages
    ORC->>PKG: Generate blueprint + prompt
    PKG-->>ORC: PackageEnvelope[]
    ORC->>REPO: Persist packages
    ORC->>ORC: saving → completed
    ORC-->>API: Job complete
    API-->>FE: Status + IDs
    FE-->>User: Workspace results
```

---

## 2. Uploaded Video Analysis

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as API Layer
    participant ORC as Orchestrator
    participant MEDIA as Media Intake
    participant STORE as Storage Provider
    participant FP as Fingerprint Service
    participant CACHE as Cache Service
    participant CORE as Core Analysis
    participant PKG as Package Engine

    User->>FE: Select video file + attestation
    FE->>API: Initiate upload + job
    API->>ORC: Create job (uploading)
    ORC->>STORE: Stream to temp bucket
    User->>FE: Upload chunks
    FE->>API: Upload progress
    API->>ORC: Resume uploading
    ORC->>MEDIA: Finalize intake metadata
    MEDIA-->>ORC: storageLocator, duration, MIME
    ORC->>FP: Compute fingerprint
    ORC->>CACHE: Lookup → MISS
    ORC->>CORE: Analyze (mock or AI)
    CORE-->>ORC: ReferenceVideoAnalysis
    ORC->>PKG: Generate packages
    ORC-->>API: completed
    Note over STORE: TTL cleanup after job
```

---

## 3. Cached Analysis (cache hit)

```mermaid
sequenceDiagram
    participant ORC as Orchestrator
    participant FP as Fingerprint Service
    participant CACHE as Cache Service
    participant REPO as Analysis Repository
    participant PKG as Package Engine

    ORC->>FP: Compute fingerprint
    ORC->>CACHE: Lookup by fingerprintId
    CACHE->>REPO: Resolve analysisId
    REPO-->>CACHE: ReferenceVideoAnalysis
    CACHE-->>ORC: HIT (analysisId)
    Note over ORC: Skip Core Analysis
    ORC->>PKG: Generate requested packages
    PKG-->>ORC: PackageEnvelope[]
    ORC->>ORC: saving → completed
```

---

## 4. Long Video Processing (async worker)

```mermaid
sequenceDiagram
    participant API as API Layer
    participant ORC as Orchestrator
    participant Q as Job Queue
    participant W as Worker
    participant CORE as Core Analysis
    participant FE as Frontend

    API->>ORC: Submit reference
    ORC->>Q: Enqueue job (queued)
    API-->>FE: jobId (202 accepted)
    loop Poll status
        FE->>API: GET job status
        API-->>FE: progressPercent + state
    end
    W->>Q: Claim job
    W->>ORC: Execute stages
    ORC->>CORE: Long-running analysis
    Note over CORE: Timeout + checkpoint CP-2
    CORE-->>ORC: Analysis complete
    ORC->>ORC: packages → saving → completed
    FE->>API: Poll
    API-->>FE: completed
```

---

## 5. Package Generation

```mermaid
sequenceDiagram
    participant ORC as Orchestrator
    participant PKG as Package Generator Facade
    participant BP as Blueprint Generator
    participant PR as Prompt Generator
    participant REPO as Package Repository
    participant BRIEF as Video Brief (optional)

    ORC->>PKG: Generate [blueprint, prompt]
    PKG->>REPO: Load ReferenceVideoAnalysis
    PKG->>BRIEF: Load brief if declared
    PKG->>BP: Generate blueprint
    BP-->>PKG: PackageEnvelope (blueprint)
    PKG->>REPO: Insert package (checkpoint CP-3)
    PKG->>PR: Generate prompt
    PR-->>PKG: PackageEnvelope (prompt)
    PKG->>REPO: Insert package
    PKG-->>ORC: All packages OK
```

---

## 6. Export Generation

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as API Layer
    participant EXP as Export Generator
    participant REPO as Package Repository
    participant HIST as History Service

    User->>FE: Select packages + format
    FE->>API: Export request
    API->>EXP: Create export
    EXP->>REPO: Load packages by ID
    REPO-->>EXP: PackageEnvelope[]
    EXP->>EXP: Serialize JSON/markdown/text
    EXP->>REPO: Save ExportRecord
    EXP->>HIST: Append export event
    EXP-->>API: Payload + exportId
    API-->>FE: Download / clipboard
    FE-->>User: Export delivered
```

---

## Step 04G acceptance

- [x] Six sequence diagrams documented
- [x] Terminology consistent with PP-02/PP-03
- [x] Conceptual only — no implementation
