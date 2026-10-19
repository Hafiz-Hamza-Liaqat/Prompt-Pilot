# PP-07B — Upload Engine Implementation

**Status:** COMPLETE (PP-07B.1 hardening applied)  
**Design:** [PP-07B-A audit](07ba-upload-engine-design-audit.md)  
**Hardening:** [PP-07B.1](07b1-upload-engine-hardening.md)  
**Dependencies:** PP-07 · PP-08 · PP-07B-A

---

## Architecture

```
HTTP Route Handlers (thin)
        │
        ▼
UploadCoordinator
   ├── MediaIntakeService (pure PP-07)
   ├── UploadStoragePort (MemoryStorageProvider — dev/test)
   ├── UploadSessionRepository (in-memory — PP-05C adapter deferred)
   ├── WorkspaceAssetRepository (in-memory — PP-05C adapter deferred)
   └── JobOrchestrator (workflow + in-stage job progress)
```

---

## HTTP API

| Method | Path | Action |
|--------|------|--------|
| POST | `/api/projects/{projectId}/uploads` | Initiate upload |
| GET | `/api/projects/{projectId}/uploads/{sessionId}` | Status |
| DELETE | `/api/projects/{projectId}/uploads/{sessionId}` | Cancel |
| PUT | `/api/projects/{projectId}/uploads/{sessionId}/chunks/{chunkIndex}` | Upload chunk (binary body) |
| POST | `/api/projects/{projectId}/uploads/{sessionId}/complete` | Complete + orchestrator handoff |
| POST | `/api/projects/{projectId}/uploads/{sessionId}/resume` | Resume |

Auth via Supabase session. `StorageLocator` never returned in API responses (G-29). `providerPayload` is sanitized before crossing the API boundary.

---

## Known limitations

See [PP-07B.1 hardening doc](07b1-upload-engine-hardening.md#known-limitations-interim--not-production-ready): singleton coordinator, in-memory repos/runtime, no production adapters, no project membership enforcement.

---

## Code locations

| Area | Path |
|------|------|
| Coordinator | `src/server/upload/upload-coordinator.ts` |
| Upload storage port | `src/server/upload/upload-storage-port.ts` |
| Payload sanitization | `src/server/upload/provider-payload.ts` |
| Config / chunk utils | `src/server/upload/config.ts`, `chunk-utils.ts` |
| DTOs | `src/server/upload/upload-dtos.ts` |
| Memory storage | `src/server/upload/memory-storage-provider.ts` |
| In-memory repos | `src/server/upload/in-memory-*-repository.ts` |
| Repository interfaces | `src/server/persistence/repositories/upload-session-repository.ts`, `workspace-asset-repository.ts` |
| Routes | `src/app/api/projects/[projectId]/uploads/**` |
| Tests | `tests/upload/*.spec.ts` |

---

## Verification

```bash
npm run typecheck
npm test -- tests/upload
npm test
```

---

## Deferred

| Item | Phase |
|------|-------|
| Supabase Storage adapter | PP-07B+ / production |
| Supabase repository adapters | PP-05C |
| Client-direct signed URLs | Production hardening |
| TTL sweeper worker | Worker boundary |
| Upload UI | UI phase |
