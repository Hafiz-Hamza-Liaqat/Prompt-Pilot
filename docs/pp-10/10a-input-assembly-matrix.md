# PP-10A â€” Input Assembly Reference Matrix

**Status:** Supporting document for [10-core-analysis-design-audit.md](10-core-analysis-design-audit.md)
**Scope:** Documentation only

Quick reference for how `CoreAnalysisCoordinator` assembles `ReferenceIntakeView` per reference kind. Does not modify `OrchestrationContext`.

---

## Matrix

| Input field | `youtube_url` | `video_upload` / `audio_upload` | `transcript` | `script` |
|-------------|---------------|----------------------------------|--------------|----------|
| **Owner scope** | Context: `ownerId`, `projectId` | Same | Same | Same |
| **Job / reference IDs** | Context: `job`, `referenceId` | Same | Same | Same |
| **Reference kind** | Context: `plan.referenceKind` | Same | Same | Same |
| **Fingerprint** | Context or test double | Same | Same | Same |
| **Link metadata** | Context `linkMetadataId` â†’ load / handoff | â€” | â€” | â€” |
| **URL descriptor** | Context `urlMediaDescriptorId` or derive from link metadata | â€” | â€” | â€” |
| **Upload asset** | â€” | Context `uploadSessionId` â†’ `UploadSessionRepository` (completed session); optional `WorkspaceAssetRepository` when asset ID known | â€” | â€” |
| **Text body** | â€” | â€” | `ReferenceRepository` â†’ transcript text | `ReferenceRepository` â†’ script text |
| **Rights attestation** | `ReferenceRepository` | Same | Same | Same |
| **Prior analysis version** | `AnalysisRepository.getLatestByReference` (re-analysis) | Same | Same | Same |

---

## Context fields used (read-only)

From `OrchestrationContext` (`src/domain/orchestration/models.ts`):

| Field | All kinds | Notes |
|-------|-----------|-------|
| `ownerId` | Yes | RLS scope |
| `projectId` | Yes | RLS scope |
| `referenceId` | Yes | Analysis FK |
| `job` | Yes | Job identity |
| `plan.referenceKind` | Yes | Branch selector |
| `fingerprintId` | Yes | Required for persist + cache (test double OK in PP-10) |
| `fingerprintAlgorithmVersion` | Yes | Same |
| `linkMetadataId` | YouTube only | |
| `urlMediaDescriptorId` | YouTube only | |
| `uploadSessionId` | Upload only | Resolve to asset in PP-10 |
| `analysisId` | Skip path only | If set, Core Analysis must not run |

---

## Documented gaps (PP-10 resolves)

| Gap | Resolution owner | PP-10 action |
|-----|------------------|--------------|
| No `assetId` on context | Coordinator | Load completed upload session via `UploadSessionRepository.findById` |
| No transcript/script on context | Coordinator | Load from Reference repository |
| Link metadata ephemeral | Stage runner or coordinator | Accept handoff from link stage outcome in integration tests |
| Fingerprint not bound in production | Upstream fingerprint track | Test doubles until fingerprint runtime exists; **required for production E2E only** |

---

## Mock observed-field sources

| Section | YouTube | Upload | Transcript / script |
|---------|---------|--------|---------------------|
| `metadata.*` | Link metadata | Asset + reference | Reference kind + language hints |
| `media.*` | Descriptor MIME/kind | Asset MIME, size, duration | `mediaKind: text` |
| `transcript.*` | Mock caption or empty | Empty or mock | User text (observed) |
| `timeline`, `scenes` | Duration-based mock | Duration-based mock | Text-structure mock |

Full output rules: [design audit Â§9](10-core-analysis-design-audit.md#9-output-assembly-mockanalysisprovider).
