# PP-11A — Reference Intake Matrix

**Status:** Supporting document for [11-workspace-ui-design-audit.md](11-workspace-ui-design-audit.md)  
**Scope:** Documentation only

Per-`ReferenceKind` specification aligned with `REFERENCE_KINDS` in `src/domain/canonical/constants.ts`, `CreateReferenceInput`, and PP-10 `ReferenceIntakeView` / `MockAnalysisProvider` validation.

---

## Shared rules (all kinds)

| Rule | Detail |
|------|--------|
| Attestation | Required before `startAnalysisJobAction` — `AttestationRepository.insert` then link `rightsAttestationId` |
| Reference write | `ReferenceRepository.insert` — metadata only (`CreateReferenceInput`) |
| Job write | `JobRepository.create` — trigger boundary |
| Analysis write | **Never** from intake — PP-10 coordinator only |
| Text persistence | Transcript/script text **not** on Reference row; supplied as `intakeOverride` at trigger |
| UI location | Project page — not brief wizard |
| Failure codes | Existing `JobFailureCode` values — see design audit §11 |

---

## `youtube_url`

| Field | Specification |
|-------|---------------|
| **Required inputs** | HTTPS YouTube URL; attestation acceptance |
| **Validation** | Zod URL schema; `url-normalizer.ts`; supported host allowlist (`secure-host.ts`); maps to `referenceKind: 'youtube_url'`, `platform: 'youtube'`, `canonicalUrl`, optional `platformContentId`, `title` from link step |
| **Rights attestation** | Required checkbox; `attestation_version: '1'` default |
| **Trigger path** | `createReferenceAction` → `startAnalysisJobAction` → orchestrator stages: `validation` → `ownership` → **`link_intelligence`** → `fingerprint` → `cache_lookup` → **`core_analysis`** → … |
| **Repository writes** | `AttestationRepository.insert`; `ReferenceRepository.insert`; `JobRepository.create` |
| **Orchestration entry** | `JobOrchestrator.start({ referenceKind: 'youtube_url', … })` |
| **Intake assembly** | Trigger builds `intakeOverride`: `{ linkMetadata, urlDescriptor, rightsAttestationId }` from link stage outcome before `executeCoreAnalysisStage` |
| **Expected UI** | URL field + attestation + "Analyze reference" CTA; job status panel; link to workspace when complete |
| **PP-11 slice** | Slice 4 (intake) + Slice 6 (trigger) |

---

## `video_upload`

| Field | Specification |
|-------|---------------|
| **Required inputs** | Completed upload session (PP-07B); attestation |
| **Validation** | Upload coordinator completion; MIME/size/duration via `MediaIntakeService`; `referenceKind: 'video_upload'`, `accessStatus` from intake |
| **Rights attestation** | Required |
| **Trigger path** | Upload API completes session → `createReferenceAction` (links asset) → `startAnalysisJobAction` → stages include **`media_intake`** → `fingerprint` → `cache_lookup` → **`core_analysis`** |
| **Repository writes** | Attestation; Reference; Job; upload session / workspace asset via upload coordinator (PP-07B) |
| **Orchestration entry** | Context includes `uploadSessionId` after media intake |
| **Intake assembly** | `intakeOverride: { uploadAsset: { assetId, mimeType, byteSize, durationSeconds, storageLocator }, rightsAttestationId }` |
| **Expected UI** | File picker + progress (upload routes); attestation; analyze CTA |
| **PP-11 slice** | Slice 7 (after upload build fix) |
| **Blocker** | Upload module build (`upload-http.ts` resolution) — prerequisite track |

---

## `audio_upload`

| Field | Specification |
|-------|---------------|
| **Required inputs** | Completed audio upload session; attestation |
| **Validation** | Same as video with audio MIME rules |
| **Rights attestation** | Required |
| **Trigger path** | Same as `video_upload` with `referenceKind: 'audio_upload'` |
| **Repository writes** | Same as video upload |
| **Orchestration entry** | `requiresMediaIntakeStage(plan) === true` |
| **Intake assembly** | `intakeOverride.uploadAsset` with audio MIME; mock provider sets `mediaKind: 'audio'` |
| **Expected UI** | Audio file picker + attestation |
| **PP-11 slice** | Slice 7 (with video upload) |

---

## `transcript`

| Field | Specification |
|-------|---------------|
| **Required inputs** | Non-empty transcript text (min length TBD in Zod — suggest ≥ 20 chars); optional language hint; attestation |
| **Validation** | Trimmed text; `referenceKind: 'transcript'`, `accessStatus: 'public'` default |
| **Rights attestation** | Required — user confirms rights to analyze supplied text |
| **Trigger path** | `createReferenceAction` (metadata) → `startAnalysisJobAction` → skip link/media → `fingerprint` → `cache_lookup` → **`core_analysis`** |
| **Repository writes** | Attestation; Reference (no text column); Job |
| **Orchestration entry** | Standard plan without `link_intelligence` / `media_intake` |
| **Intake assembly** | `intakeOverride: { transcriptText, rightsAttestationId }` — **required** because Reference row has no text |
| **Expected UI** | Textarea + language select + attestation |
| **PP-11 slice** | Slice 4 + 6 — **recommended first E2E kind** with `youtube_url` |

---

## `script`

| Field | Specification |
|-------|---------------|
| **Required inputs** | Non-empty script text; attestation |
| **Validation** | Same as transcript with `referenceKind: 'script'` |
| **Rights attestation** | Required |
| **Trigger path** | Same as transcript |
| **Repository writes** | Same as transcript |
| **Orchestration entry** | Same as transcript |
| **Intake assembly** | `intakeOverride: { scriptText, rightsAttestationId }` |
| **Expected UI** | Larger textarea labeled "Script" + attestation |
| **PP-11 slice** | Slice 4 + 6 |

---

## Trigger boundary — stage sequence by kind

| Stage | youtube_url | video/audio upload | transcript / script |
|-------|-------------|--------------------|---------------------|
| validation | Yes | Yes | Yes |
| ownership | Yes | Yes | Yes |
| link_intelligence | Yes | No | No |
| media_intake | No | Yes | No |
| fingerprint | Yes* | Yes* | Yes* |
| cache_lookup | Yes | Yes | Yes |
| core_analysis | Yes (if miss) | Yes (if miss) | Yes (if miss) |
| package_generation | Skipped/mock | Skipped/mock | Skipped/mock |
| persistence | Minimal | Minimal | Minimal |
| workspace_refresh | **Skipped** — page load | **Skipped** | **Skipped** |

\*Fingerprint: test-double injection in mock E2E until fingerprint runtime exists (same as PP-10 tests).

---

## Mock provider intake requirements (PP-10 frozen)

From `mock-analysis-provider.ts` validation:

| Kind | Provider requires |
|------|-------------------|
| `youtube_url` | `linkMetadata` or `urlDescriptor` |
| `video_upload` / `audio_upload` | `uploadAsset` |
| `transcript` | non-empty `transcriptText` |
| `script` | non-empty `scriptText` |

Trigger boundary **must** satisfy these via `intakeOverride` — coordinator does not load from repos in current PP-10 implementation.

---

## Recommended MVP intake order

1. **`transcript`** — simplest path; no link/upload dependency  
2. **`youtube_url`** — exercises link intelligence  
3. **`script`** — same as transcript UI pattern  
4. **`video_upload` / `audio_upload`** — after upload build fix  

---

## Consistency with PP-10 input assembly matrix

PP-10A [input assembly matrix](../pp-10/10a-input-assembly-matrix.md) documented coordinator repo loading as future work. **PP-10 implementation** merges `intake` + `intakeOverride` only. PP-11 trigger boundary owns assembly — **no PP-10 change required**.
