# PP-05B.1 — Link Intelligence Hardening

**Status:** COMPLETE  
**Dependencies:** PP-05B (conditionally approved)  
**Scope:** Audit remediations only — no expansion beyond Link Intelligence boundary.

---

## Audit conditions closed

| Condition | Resolution |
|-----------|------------|
| Media Intake handoff | `executeLinkIntelligenceStage` calls `MediaIntakeService.resolveUrlReference()` after successful analyze |
| Documentation sync | `docs/pp-08.1/README.md` updated; pipeline reflects runtime |
| Production provider policy | `createProductionLinkIntelligenceStack()` — YouTube only; mock dev/test only |
| SSRF hardening | HTTPS-only, redirect validation (`secureFetch`), DNS rebinding (`assertResolvedHostSafe`) |
| Canonical failure codes | `createLinkIntelligencePort` preserves `jobFailureCode` on orchestration errors |
| Contract hardening | `LinkMetadataSchema`, `UrlMediaIntakeDescriptorSchema` (Zod, PP-03 pattern) |

---

## Architecture (unchanged ownership)

```
JobOrchestrator
  └── executeLinkIntelligenceStage
        ├── LinkIntelligenceCoordinator (URL mechanics)
        └── MediaIntakeService.resolveUrlReference (descriptor mapping only)
```

Upload Engine, persistence, workers, AI, and Package Engine are **not** in scope.

---

## Production provider policy

| Environment | Factory | Providers |
|-------------|---------|-----------|
| **Production** | `createProductionLinkIntelligenceStack()` | YouTube only — **do not** register `MockLinkProvider` |
| **Development / Test** | `createLinkIntelligenceStack()` | Mock (default) + optional YouTube via `useYouTubeProvider: true` |

Production must also inject `MediaIntakeService` into `executeLinkIntelligenceStage` — see [05b2](05b2-documentation-composition-hardening.md#production-composition-rule).

---

## Security hardening

| Control | Location |
|---------|----------|
| HTTPS-only URLs | `assertFetchAllowed` |
| Host allowlist | `assertFetchAllowed` |
| DNS rebinding | `assertResolvedHostSafe` (coordinator + `secureFetch`) |
| Redirect hop validation | `secureFetch` (manual redirect, re-validates each hop, max 3) |

### Intentionally deferred (Link Intelligence scope)

| Item | Reason |
|------|--------|
| **DNS TOCTOU** | Resolve-then-fetch gap between DNS validation and TCP connect — accepted; reconnect-time validation deferred |
| **Partial IPv6 literal handling** | Resolved private IPv6 blocked; exhaustive RFC 5952 hostname literal normalization deferred |
| IPv6 ULA exhaustive coverage | Basic private-range checks implemented; full RFC5952 normalization deferred |
| Certificate pinning | Out of scope for metadata fetch layer |
| Cache backend SSRF | No cache backend in PP-05B.1 |

Full documentation: [05b2-documentation-composition-hardening.md](05b2-documentation-composition-hardening.md#accepted-security-limitations-deferred).

---

## Media Intake handoff

Pure mapping in `resolveUrlReferenceFromLinkMetadata`:

- Validates owner/project scope
- Requires URL reference kinds (`youtube_url`, etc.)
- Produces `UrlMediaIntakeDescriptor` — no `StorageLocator`, no downloads

Orchestration context fields after successful stage:

- `linkMetadataId`
- `urlMediaDescriptorId` (when `mediaIntake` dep provided — **required in production**)

---

## Verification

```bash
npm run typecheck
npm test -- tests/link
npm test -- tests/orchestration
npm test
```
