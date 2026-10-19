# PP-05A-1 — Domain-to-Persistence Mapping

**Related:** [PP-03 contracts](../pp-03/README.md) · [PP-04 repository boundaries](../pp-04/04d-repository-boundaries.md)

Maps every approved domain concept to its **future persistence responsibility**. No SQL.

---

## 1. Mapping overview

| Domain concept | Persisted? | Primary store role |
|---|---|---|
| User / Profile | Yes (existing) | Auth identity + display |
| Project | Yes (existing) | Container root |
| Video Brief | Yes (existing) | Legacy wizard state |
| Reference | Yes (new) | Intake artifact |
| ReferenceVideoAnalysis | Yes (new) | Immutable analysis snapshot |
| Package (`PackageEnvelope`) | Yes (new) | Immutable generator output |
| PackageManifest | Yes (new) | Declarative input audit slice |
| Job | Yes (new) | Pipeline execution record |
| JobEvent | Yes (new) | Append-only stage log |
| Export | Yes (new) | Delivery event |
| ContentFingerprint | Yes (new) | Dedup identity |
| CacheEntry | Yes (new) | Fingerprint → analysis link |
| ProviderUsage | Yes (new) | Cost/credit audit |
| WorkspaceAsset | Yes (new) | Temp media & export blobs |
| RightsAttestation | Yes (new) | Consent record |
| Workspace (UI) | **No** | Read model only |

---

## 2. Reference

| Field | Detail |
|---|---|
| **Purpose** | User-submitted intake artifact (URL, upload, transcript, script) |
| **Persistence responsibility** | Store identity, kind, provenance, access status, link to project |
| **Ownership** | Project owner (via `projectId`) |
| **Lifecycle** | Created on submission; access status may update; soft-delete with project |
| **Relationships** | N:1 Project; 1:N Job; 1:N ReferenceVideoAnalysis; 1:1..N RightsAttestation |
| **Versioning** | Reference row is mutable for status fields only — not versioned as a whole |

**Contract:** `ReferenceSchema` (PP-03)

---

## 3. ReferenceVideoAnalysis

| Field | Detail |
|---|---|
| **Purpose** | Immutable structured intelligence snapshot from Core Analysis |
| **Persistence responsibility** | Store full canonical JSON matching `ReferenceVideoAnalysisSchema`; pin versions |
| **Ownership** | Project owner (denormalized `projectId` for RLS) |
| **Lifecycle** | Insert-only; new row per `analysisVersion`; mark `isLatest` flag |
| **Relationships** | N:1 Reference; N:1 Fingerprint; 1:N Package; referenced by CacheEntry |
| **Versioning** | Monotonic `analysisVersion` per reference; `supersedesAnalysisId` chain |

**Does not store:** prompts, SEO packages, blueprints (those are Package rows).

---

## 4. Package (`PackageEnvelope`)

| Field | Detail |
|---|---|
| **Purpose** | Typed, versioned output from Package Engine |
| **Persistence responsibility** | Store envelope + typed `payload` JSON; discriminator `packageType` |
| **Ownership** | Project owner |
| **Lifecycle** | Insert-only; regeneration = new `packageVersion` row |
| **Relationships** | N:1 ReferenceVideoAnalysis (pinned `analysisId` + `analysisVersion`); N:1 Job (`createdByJobId`); 1:1 PackageManifest (optional normalized) |
| **Versioning** | Monotonic per `(analysisId, packageType)`; `supersedesPackageId` chain |

---

## 5. PackageManifest

| Field | Detail |
|---|---|
| **Purpose** | Persisted declarative audit of **what inputs** a package consumed — without duplicating full payload |
| **Persistence responsibility** | Store `dependsOn[]`, `inputManifest[]`, generator metadata from envelope |
| **Ownership** | Project owner (via package) |
| **Lifecycle** | Created with package; immutable |
| **Relationships** | 1:1 Package (or embedded in package row — PP-05B decision) |
| **Versioning** | Tied to package version |

**Note:** PP-03 embeds manifest fields in `PackageEnvelopeSchema`. Persistence may normalize to a child record or JSON column — PP-05B decides physical shape, not semantics.

---

## 6. Job

| Field | Detail |
|---|---|
| **Purpose** | Async pipeline execution unit for one Reference |
| **Persistence responsibility** | Store `JobRecord` state, progress, failure, checkpoints, `retryOfJobId` |
| **Ownership** | Project owner |
| **Lifecycle** | Created → active states → terminal; never deleted in MVP (audit retention) |
| **Relationships** | N:1 Reference; N:1 Project; 1:N JobEvent; 0:N Package (via `createdByJobId`); 0:N ProviderUsage |
| **Versioning** | New job per retry — not versioned in place |

---

## 7. JobEvent

| Field | Detail |
|---|---|
| **Purpose** | Append-only pipeline stage log for debugging and history |
| **Persistence responsibility** | Stage entered/completed, warnings, checkpoint markers |
| **Ownership** | Project owner (via job) |
| **Lifecycle** | Insert-only |
| **Relationships** | N:1 Job |
| **Versioning** | N/A (event stream) |

---

## 8. Export

| Field | Detail |
|---|---|
| **Purpose** | User-facing delivery record (copy/download) |
| **Persistence responsibility** | Store `ExportRecord`: package IDs, format, user, timestamp |
| **Ownership** | Project owner + exporting user |
| **Lifecycle** | Insert-only; optional link to WorkspaceAsset for large exports |
| **Relationships** | N:1 Project; N:1 Reference; N:M Package (by ID list) |
| **Versioning** | Each export is distinct event — not versioned |

---

## 9. ContentFingerprint

| Field | Detail |
|---|---|
| **Purpose** | Stable content identity for cache/dedup |
| **Persistence responsibility** | Store fingerprint identity inputs, algorithm version, state |
| **Ownership** | **Policy-dependent:** per-user scope default — fingerprint rows scoped to creating user or project until global cache approved |
| **Lifecycle** | `candidate` → `active` → `invalidated` / `expired` |
| **Relationships** | 1:N CacheEntry; indirect link to Analysis |
| **Versioning** | Algorithm version bump → new fingerprint rows; old invalidated |

---

## 10. CacheEntry

| Field | Detail |
|---|---|
| **Purpose** | Maps fingerprint to reusable analysis snapshot |
| **Persistence responsibility** | Store cache key, `analysisId`, TTL, hit stats, invalidation |
| **Ownership** | Platform + scope owner (per-user default) |
| **Lifecycle** | Write on miss path; TTL expire; invalidate on policy |
| **Relationships** | N:1 ContentFingerprint; N:1 ReferenceVideoAnalysis |
| **Versioning** | Entry replaced on invalidation — not updated in place for analysis swap |

---

## 11. ProviderUsage

| Field | Detail |
|---|---|
| **Purpose** | Audit AI/platform/storage consumption for credits and cost controls |
| **Persistence responsibility** | Provider id, operation, token/cost units, job linkage, timestamp |
| **Ownership** | User / project |
| **Lifecycle** | Insert-only ledger |
| **Relationships** | N:1 Job (optional); N:1 Project; N:1 User |
| **Versioning** | Append-only — no updates |

**Deferred enforcement:** PP-18; schema reserved in PP-05B.

---

## 12. WorkspaceAsset

| Field | Detail |
|---|---|
| **Purpose** | Temporary binary artifacts: upload chunks, export files, internal media locators |
| **Persistence responsibility** | Storage bucket object key + metadata; **not** exposed to client (`storageLocator` rule G-29) |
| **Ownership** | Project owner; system-managed TTL |
| **Lifecycle** | Created on upload → TTL expire → hard delete from object storage |
| **Relationships** | N:1 Reference (upload path); optional N:1 Export |
| **Versioning** | Replace on re-upload; no long-term versioning in MVP |

**Storage:** Supabase Storage (PP-06 implementation); metadata row in Postgres.

---

## 13. RightsAttestation

| Field | Detail |
|---|---|
| **Purpose** | Timestamped user consent for reference processing |
| **Persistence responsibility** | Attestation text version, user, reference, timestamp |
| **Ownership** | Project owner |
| **Lifecycle** | Insert-only |
| **Relationships** | N:1 Reference |
| **Versioning** | New attestation per submission |

---

## 14. Existing persisted concepts (unchanged)

| Concept | Table (existing) | Role |
|---|---|---|
| Profile | `profiles` | User metadata |
| Project | `projects` | Container |
| Video Brief | `video_briefs` | Wizard draft |
| Provider catalogue | `ai_video_*` | Read-only catalogue |

---

## Step 05A-1 acceptance

- [x] All pivot domain concepts mapped
- [x] Purpose, ownership, lifecycle, relationships, versioning documented
- [x] No SQL
