# PP-07 — Media Intake & Storage Boundaries

**Status:** COMPLETE  
**Scope:** Upload session models, storage abstractions, validation and lifecycle contracts. No cloud SDKs, HTTP, or storage implementations.

## Deliverables

| Area | Location |
|------|----------|
| Upload session model | `src/domain/media/upload-session.ts` |
| Upload contracts | `src/domain/media/upload-contracts.ts` |
| Upload intake engine | `src/domain/media/upload-intake-engine.ts` |
| Storage abstractions | `src/domain/media/storage/` |
| Validation contracts | `src/domain/media/validation/` |
| Lifecycle contracts | `src/domain/media/lifecycle/` |
| Ownership validation | `src/domain/media/ownership.ts` |
| Service interfaces | `src/server/media/media-intake-service.ts` |
| Default pure services | `src/server/media/pure-media-intake-service.ts` |
| Tests | `tests/media/*.spec.ts` |

## Design principles

- **Provider-agnostic:** `StorageProvider` interface only — no Supabase/R2 SDKs
- **G-29:** `StorageLocator` branded type on sessions, completions, and asset references — never API-facing
- **TTL-first:** temp assets and upload sessions carry mandatory expiration
- **Ownership:** all operations gated by `MediaOwnerScope`

## Verification

```bash
npm run typecheck
npm test -- tests/media
```

## Deferred

- Upload HTTP endpoints and chunked transfer engine
- Supabase Storage / R2 provider implementations
- Persistence for `UploadSession` / `WorkspaceAsset` (PP-05C)
- Virus scan / quarantine worker
- Signed URL generation (implementation detail of future provider)

## Out of scope

SQL, repositories, workers, AI, FFmpeg, UI, actual file uploads.
