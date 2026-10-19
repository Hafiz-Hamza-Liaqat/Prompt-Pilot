# PP-07B.1 — Upload Engine Hardening

**Status:** COMPLETE  
**Resolves:** PP-07B audit conditions  
**Dependencies:** PP-07B

---

## Changes

| Audit finding | Resolution |
|---------------|------------|
| Coordinator coupled to `MemoryStorageProvider` | `UploadStoragePort` interface; coordinator depends on port only |
| Split workflow ownership (direct lifecycle) | Job progress via `JobOrchestrator.applyJobTransitions` / `refineJobProgress`; lifecycle removed from coordinator deps |
| Initiate validation after orchestration | `planUploadRequest` runs before `orchestrator.start`; rollback via `orchestrator.cancel` on downstream failure |
| `providerPayload` exposed object keys | `sanitizeProviderPayloadForClient` strips internal keys; memory adapter omits `objectKey` from payload |

---

## Architecture

```
HTTP Route Handlers (thin)
        │
        ▼
UploadCoordinator
   ├── MediaIntakeService (pure PP-07)
   ├── UploadStoragePort (interface — MemoryStorageProvider in dev/test)
   ├── UploadSessionRepository (interface — in-memory interim)
   ├── WorkspaceAssetRepository (interface — in-memory interim)
   └── JobOrchestrator (workflow + in-stage job progress)
```

---

## Known limitations (interim — not production-ready)

| Limitation | Notes |
|------------|-------|
| Singleton coordinator | `getUploadCoordinator()` — process-local, not multi-instance safe |
| In-memory repositories | Session/asset stores under `src/server/upload/`; PP-05C adapters deferred |
| In-memory runtime | `SessionRuntime` map is process-local; restart loses chunk/locator binding |
| No production storage adapter | `MemoryStorageProvider` only; Supabase/R2 deferred |
| No project membership gate | Routes authenticate user but do not verify project ownership in DB |

---

## Code locations

| Area | Path |
|------|------|
| Upload storage port | `src/server/upload/upload-storage-port.ts` |
| Payload sanitization | `src/server/upload/provider-payload.ts` |
| Orchestrator progress API | `JobOrchestrator.applyJobTransitions`, `refineJobProgress` |
| Hardening tests | `tests/upload/uploadCoordinator.spec.ts` (PP-07B.1 block) |

---

## Verification

```bash
npm run typecheck
npm test -- tests/upload
npm test
```
