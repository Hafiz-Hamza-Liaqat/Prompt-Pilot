# PP-04C — Service Boundaries

**Related:** [04a-runtime-component-architecture.md](04a-runtime-component-architecture.md) · [PP-02 Package Engine](../pp-02/04-package-engine.md)

Conceptual services. Each service is a **single-responsibility runtime unit** invoked by the Orchestrator or Workspace Layer.

---

## 1. Service index

| Service | Pipeline stage |
|---|---|
| Link Intelligence | Validation, Media Intake (URL) |
| Media Intake | Media Intake |
| Fingerprint | Fingerprinting |
| Cache | Cache Lookup |
| Core Analysis | Analyzing |
| Package Generator (facade) | Generating Packages |
| Blueprint Generator | Generating Packages |
| Prompt Generator | Generating Packages |
| SEO Generator | Generating Packages |
| Marketing Generator | Generating Packages |
| Repurposing Generator | Generating Packages |
| Export Generator | Export (post-job) |
| History | All stages (append-only) |
| Workspace Composer | Read path |

---

## 2. Link Intelligence Service

| Field | Detail |
|---|---|
| **Purpose** | Normalize and validate platform URLs; detect platform; SSRF-safe metadata fetch gate |
| **Consumes** | Raw URL string, project context |
| **Produces** | Normalized URL, platform ID, access hints, validation result |
| **Must Never Do** | Download video media; bypass allowlist; call AI |
| **Allowed Dependencies** | HTTP client (bounded), Request Validator, config allowlists |
| **Forbidden Dependencies** | Core Analysis, Package Engine, AI Provider Layer |

---

## 3. Media Intake Service

| Field | Detail |
|---|---|
| **Purpose** | Resolve reference to storable/intake descriptors per reference kind |
| **Consumes** | Validated Reference command, Link Intelligence output (URL), upload stream |
| **Produces** | Media descriptors (`storageLocator`, duration, MIME, transcript text) |
| **Must Never Do** | Run analysis; generate packages; permanent storage without TTL policy |
| **Allowed Dependencies** | Link Intelligence, Storage Provider, transcript normalizer |
| **Forbidden Dependencies** | Core Analysis Engine, Package Generators, Cache Manager (write) |

---

## 4. Fingerprint Service

| Field | Detail |
|---|---|
| **Purpose** | Compute `ContentFingerprint` from intake descriptors |
| **Consumes** | Reference kind, normalized content identity inputs, algorithm version |
| **Produces** | `ContentFingerprint` record |
| **Must Never Do** | Perform analysis; decide cache policy alone |
| **Allowed Dependencies** | Fingerprint repository, algorithm config |
| **Forbidden Dependencies** | AI providers, Package Engine, raw media bytes (only descriptors) |

---

## 5. Cache Service

| Field | Detail |
|---|---|
| **Purpose** | Lookup and write cache entries keyed by fingerprint |
| **Consumes** | `fingerprintId`, scope, optional `ReferenceVideoAnalysis` (on write) |
| **Produces** | Hit/miss, `analysisId` on hit |
| **Must Never Do** | Regenerate analysis; expose cross-user entries without policy |
| **Allowed Dependencies** | Analysis Repository, cache store adapter |
| **Forbidden Dependencies** | Core Analysis (on hit path), Package Engine |

---

## 6. Core Analysis Service

| Field | Detail |
|---|---|
| **Purpose** | Produce `ReferenceVideoAnalysis` — sole media interpretation stage |
| **Consumes** | Media descriptors, platform metadata, pipeline version |
| **Produces** | `ReferenceVideoAnalysis` snapshot |
| **Must Never Do** | Compile prompts; SEO titles; blueprint shot lists; persist directly (uses repository via orchestrator) |
| **Allowed Dependencies** | AI Provider adapter (when enabled), mock fixture provider, Analysis Repository |
| **Forbidden Dependencies** | Package Generators, Export Generator, Frontend |

---

## 7. Package Generator Service (facade)

| Field | Detail |
|---|---|
| **Purpose** | Route package type requests to typed generators; validate envelope |
| **Consumes** | `ReferenceVideoAnalysis`, package type list, optional brief/engine outputs |
| **Produces** | `PackageEnvelope[]` |
| **Must Never Do** | Access raw media; call Core Analysis; skip schema validation |
| **Allowed Dependencies** | Typed generators, `PackageEnvelopeSchema`, Package Repository |
| **Forbidden Dependencies** | Media Intake, Link Intelligence fetch, Core Analysis |

---

## 8. Blueprint Generator

| Field | Detail |
|---|---|
| **Purpose** | Produce Blueprint Package payload from analysis |
| **Consumes** | `ReferenceVideoAnalysis`, optional `SceneDecomposition`, optional brief |
| **Produces** | `PackageEnvelope` (`packageType: blueprint`) |
| **Must Never Do** | Analyze video; fetch URL |
| **Allowed Dependencies** | Scene decomposition service (optional), rules/mock/AI compilation adapter |
| **Forbidden Dependencies** | Media Intake, Core Analysis |

---

## 9. Prompt Generator

| Field | Detail |
|---|---|
| **Purpose** | Produce Prompt Package with `CompiledPrompt[]` |
| **Consumes** | `ReferenceVideoAnalysis`, optional provider recommendations, brief |
| **Produces** | `PackageEnvelope` (`packageType: prompt`) |
| **Must Never Do** | Analyze raw media; bypass transformation notice |
| **Allowed Dependencies** | Provider catalogue, recommendation service, compilation adapter |
| **Forbidden Dependencies** | Core Analysis, Media Intake |

---

## 10. SEO Generator

| Field | Detail |
|---|---|
| **Purpose** | Expand `seoSeeds` from analysis into SEO Package |
| **Consumes** | `ReferenceVideoAnalysis.seoSeeds`, optional brief destination |
| **Produces** | `PackageEnvelope` (`packageType: seo`) |
| **Must Never Do** | Read raw media; invent factual claims beyond analysis confidence |
| **Allowed Dependencies** | Rules/mock/AI adapter |
| **Forbidden Dependencies** | Core Analysis, Media Intake |

---

## 11. Marketing Generator

| Field | Detail |
|---|---|
| **Purpose** | Audience/hook/retention copy from analysis (+ optional complexity assessment) |
| **Consumes** | `ReferenceVideoAnalysis`, optional complexity/risk outputs |
| **Produces** | `PackageEnvelope` (`packageType: marketing`) |
| **Must Never Do** | Deceptive viral claims; raw media access |
| **Allowed Dependencies** | Complexity service (optional), rules/mock/AI adapter |
| **Forbidden Dependencies** | Core Analysis, Media Intake |

---

## 12. Repurposing Generator

| Field | Detail |
|---|---|
| **Purpose** | Cross-format text sections (blog, LinkedIn, scripts, …) |
| **Consumes** | `ReferenceVideoAnalysis`, optional Prompt Package (for alignment) |
| **Produces** | `PackageEnvelope` (`packageType: repurposing`) |
| **Must Never Do** | Re-analyze source; consume raw media |
| **Allowed Dependencies** | Other packages as **optional** declared dependencies (by ID, not re-fetch media) |
| **Forbidden Dependencies** | Core Analysis, Media Intake |

---

## 13. Export Generator Service

| Field | Detail |
|---|---|
| **Purpose** | Serialize packages to export formats |
| **Consumes** | Package records, format enum, transformation notice |
| **Produces** | `ExportRecord`, serialized payload |
| **Must Never Do** | Modify source packages or analysis |
| **Allowed Dependencies** | Package Repository, Export Repository |
| **Forbidden Dependencies** | AI providers, Core Analysis |

---

## 14. History Service

| Field | Detail |
|---|---|
| **Purpose** | Append-only audit of jobs, analysis versions, packages, exports |
| **Consumes** | Stage completion events |
| **Produces** | History entries for project timeline |
| **Must Never Do** | Mutate immutable analysis/packages |
| **Allowed Dependencies** | Job, Analysis, Package, Export repositories |
| **Forbidden Dependencies** | AI providers |

---

## 15. Workspace Composer Service

| Field | Detail |
|---|---|
| **Purpose** | Build workspace read model for UI |
| **Consumes** | Project ID, latest or selected analysis/packages/jobs, brief, engine outputs |
| **Produces** | Workspace view model (sections, badges, progress) |
| **Must Never Do** | Start jobs; write analysis; call AI for new content |
| **Allowed Dependencies** | All read repositories, existing scene/scoring/recommendation services |
| **Forbidden Dependencies** | Orchestrator write path, Core Analysis |

---

## 16. Existing services (retain)

| Service | Role in runtime |
|---|---|
| `project-service` | Project container — unchanged |
| `video-brief-service` | Brief wizard — parallel to Reference path |
| `scene-decomposition-service` | Workspace evaluation; optional Blueprint input |
| `complexity-risk-service` | Workspace evaluation; optional Marketing input |
| `provider-recommendation-service` | Workspace + Prompt Package input |
| `provider-catalogue-service` | Read-only catalogue |
| `mock-result-workspace-service` | **Replace gradually** with Workspace Composer + real packages |

---

## Step 04C acceptance

- [x] All conceptual services documented
- [x] Consumes / produces / must never do / dependencies for each
- [x] Existing services mapped
- [x] No implementation
