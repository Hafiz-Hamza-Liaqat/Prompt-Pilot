# AI Pipeline — PP-02 Step 8

**Related:** [Job state machine](06-job-state-machine.md) · [Content fingerprint](05-content-fingerprint.md) · [Package Engine](04-package-engine.md)

This is the **platform backbone** — the ordered transformation from user input to exportable intelligence.

---

## 1. Pipeline overview

```text
Input
    │
    ▼
Validation
    │
    ▼
Ownership (rights attestation + project ownership)
    │
    ▼
Media Intake
    │
    ▼
Fingerprint
    │
    ▼
Cache
    │
    ▼
Core Analysis  ──► ReferenceVideoAnalysis
    │
    ▼
Package Engine ──► Packages (Blueprint, Prompt, SEO, …)
    │
    ▼
Workspace (presentation)
    │
    ▼
Export
    │
    ▼
History
```

---

## 2. Stage definitions

### Input

User submits a **Reference** on a **Project**: URL, upload, transcript, or script. Creates **Job** in `Created`.

### Validation

Schema and policy checks: HTTPS allowlist, size/duration caps, MIME expectations, attestation present, project not archived/deleted.

**Output:** Job → `Validated` or `Failed`.

### Ownership

Verify authenticated user owns project; RLS context established. Record **Rights Attestation** linked to reference.

**Output:** Ownership context bound to job.

### Media Intake

| Reference kind | Behavior |
|---|---|
| YouTube URL | Permitted metadata / caption path only — no unauthorized download |
| Video/audio upload | Store temp object; extract media metadata |
| Transcript/script | Normalize text; no fetch |

**Output:** Media descriptors for fingerprint and analysis.

### Fingerprint

Compute **Content Fingerprint**; see [05-content-fingerprint.md](05-content-fingerprint.md).

**Output:** `fingerprintId`, cache lookup result.

### Cache

| Result | Path |
|---|---|
| Hit | Load existing **ReferenceVideoAnalysis**; optionally skip Core Analysis |
| Miss | Continue to Core Analysis |

See [08-cache-architecture.md](08-cache-architecture.md).

### Core Analysis

Produce **ReferenceVideoAnalysis** snapshot. Only stage allowed to interpret media/transcript into analysis sections.

**Constraints:**

- No prompt compilation
- No SEO copy generation
- Observed/inferred labeling required

**Output:** Immutable `ReferenceVideoAnalysis` at `analysisVersion`.

### Package Engine

Generate requested **Packages** from analysis (+ optional brief/engines).

**Output:** One or more Package instances per [04-package-engine.md](04-package-engine.md).

### Workspace

Bind latest (or selected historical) analysis and packages to **Workspace** UI sections. Existing section-nav pattern reused.

Deterministic engines (scene decomposition, complexity, recommendations) run as **parallel evaluations** when brief context exists — not as replacements for Core Analysis.

### Export

User selects packages → **Export** artifact (copy JSON/text, download file). Records export event in **History**.

### History

Persist ordered record: jobs, analysis versions, package versions, exports — for audit and comparison.

---

## 3. Trust boundaries

| Stage | External network | AI call | Persists |
|---|---|---|---|
| Validation | Maybe (URL HEAD) | No | Job log |
| Media intake | Platform API (future) | No | Temp storage |
| Core Analysis | Maybe | Yes (when enabled) | Analysis |
| Package Engine | Maybe | Yes (when enabled) | Packages |
| Export | No | No | Export log |

---

## 4. Sync vs async

| Mode | Allowed when |
|---|---|
| **Async (canonical)** | Production — all jobs through worker |
| **Sync mock** | Localhost MVP only — strict duration cap, mock providers |

Architecture Readiness Audit: long video **requires** async — pipeline assumes Job entity exists before real media processing.

---

## Step 8 acceptance

- [x] Full lifecycle documented
- [x] Stage boundaries explicit
- [x] Core Analysis isolated from Package Engine
- [ ] Human approval
