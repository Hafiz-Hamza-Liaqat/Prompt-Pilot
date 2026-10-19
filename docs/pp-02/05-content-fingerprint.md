# Content Fingerprint — PP-02 Step 6

**Related:** [Cache architecture](08-cache-architecture.md) · [AI pipeline](07-ai-pipeline.md)

---

## 1. Purpose

**Content Fingerprint** is the primary **cost-control and deduplication identity** for Prompt Pilot.

Goals:

- Avoid re-running expensive Core Analysis on identical content
- Enable cache lookup before Job enters `Analyzing`
- Support fair credit accounting (user may still be charged orchestration on cache hit — product decision)
- Provide stable versioning anchor for analysis invalidation

**No hashing algorithm is specified in PP-02.** Only inputs, lifecycle, and architectural behavior.

---

## 2. Definition

A **Fingerprint** is a canonical record that answers:

> "What unique content did we intake, under what normalization rules, at what algorithm version?"

It is **not** analysis. It is **not** a Package.

---

## 3. Inputs to fingerprint identity

| Input factor | Included when |
|---|---|
| Reference kind | Always |
| Normalized URL (canonical) | URL references |
| Platform content ID | When safely derivable |
| Upload file identity | Upload references — stable file id + size + duration |
| Transcript text hash descriptor | Transcript references — normalized text fingerprint |
| Script text hash descriptor | Script references |
| Media duration bucket | Video/audio — tolerance policy TBD |
| Fingerprint algorithm version | Always |

**Excluded from fingerprint (explicit):**

- User ID (fingerprint may be shared across users for cache — **policy decision deferred**)
- Project ID
- Video Brief content

---

## 4. Lifecycle

```text
Reference submitted
        │
        ▼
Job: Fingerprinting
        │
        ├── Compute fingerprint candidate
        │
        ├── Lookup cache by fingerprint key
        │
        ├── HIT → attach existing ReferenceVideoAnalysis (if policy allows)
        │         → skip Analyzing (or partial refresh)
        │
        └── MISS → continue to Analyzing
                    → store new ReferenceVideoAnalysis
                    → link cache entry
```

| State | Meaning |
|---|---|
| `candidate` | Computed during job, not yet committed |
| `active` | Committed and used for lookup |
| `invalidated` | Superseded by algorithm version change or policy |
| `expired` | TTL elapsed — cache entry removed |

---

## 5. Invalidation triggers

| Trigger | Effect |
|---|---|
| Fingerprint algorithm version bump | All entries under old version invalidated |
| Reference kind change | New fingerprint — no invalidation of old |
| User forces re-analysis | New analysis version even on cache hit |
| Rights or access status change | May invalidate reuse |
| Platform reports content removed | Invalidate linked cache entries |
| Admin policy change | Bulk invalidation |

---

## 6. Versioning

| Version type | Scope |
|---|---|
| `fingerprintAlgorithmVersion` | How identity is computed |
| `analysisVersion` | Per-reference analysis iterations (separate concept) |
| Cache entry version | Pairs fingerprint + analysis snapshot |

When algorithm version changes, **do not** silently remap old entries — miss and re-analyze or explicit migration job.

---

## 7. Goals and non-goals

| Goal | Supported |
|---|---|
| Reduce duplicate AI spend | Yes |
| Reduce duplicate transcription | Yes |
| Cross-user cache sharing | **Deferred policy** — privacy implication |
| Permanent media storage | **No** — fingerprint may outlive temp media |

---

## 8. Example pipeline (conceptual)

```text
Video upload
    │
    ▼
Fingerprint
    │
    ▼
Cache lookup
    │
    ├── YES → Load ReferenceVideoAnalysis → Generate Packages (if needed)
    │
    └── NO  → Analyze → Save Analysis → Write cache → Generate Packages
```

---

## Step 6 acceptance

- [x] Purpose and lifecycle documented
- [x] Inputs and invalidation defined
- [x] No algorithm implementation
- [ ] Human approval on cross-user cache policy
