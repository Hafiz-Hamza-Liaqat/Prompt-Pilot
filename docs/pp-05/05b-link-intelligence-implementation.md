# PP-05B — Link Intelligence Implementation

**Status:** COMPLETE  
**Design:** [05-link-intelligence-design-audit.md](05-link-intelligence-design-audit.md)  
**Hardening:** [05b1-link-intelligence-hardening.md](05b1-link-intelligence-hardening.md) · [05b2-documentation-composition-hardening.md](05b2-documentation-composition-hardening.md)  
**Dependencies:** PP-05 design · PP-08 orchestrator

---

## Architecture

```
JobOrchestrator (workflow authority)
        │
        ▼
executeLinkIntelligenceStage (thin runner)
        │
        ├── MediaIntakeService.resolveUrlReference  ← PP-05B.1 handoff (production: required)
        │
        ▼
LinkIntelligenceCoordinator
   ├── UrlNormalizer (pure)
   ├── SecurityGate (SSRF — HTTPS-only, PP-05B.1)
   ├── assertResolvedHostSafe (DNS rebinding, PP-05B.1)
   ├── secureFetch (redirect validation, PP-05B.1)
   ├── LinkMetadataCache (port — optional, no default impl)
   └── LinkProviderRegistry
         ├── MockLinkProvider (dev/test default)
         └── YouTubeLinkProvider (oEmbed via secureFetch)
```

Upload references bypass Link Intelligence. `youtube_url` plans include `link_intelligence` before `fingerprint`.

---

## PP-05B.1 additions (cross-reference)

| Area | Detail |
|------|--------|
| **Media Intake handoff** | After successful analyze, `executeLinkIntelligenceStage` calls `MediaIntakeService.resolveUrlReference()` → `UrlMediaIntakeDescriptor`; binds `urlMediaDescriptorId` on context |
| **Security hardening** | HTTPS-only, DNS rebinding (`assertResolvedHostSafe`), redirect hop validation (`secureFetch`) |
| **Production provider policy** | `createProductionLinkIntelligenceStack()` — YouTube only |
| **Canonical errors** | `createLinkIntelligencePort` preserves `jobFailureCode` |
| **Contracts** | `LinkMetadataSchema`, `UrlMediaIntakeDescriptorSchema` |

See [05b1-link-intelligence-hardening.md](05b1-link-intelligence-hardening.md).

---

## Production composition

Production must inject `MediaIntakeService` into stage execution. See [05b2-documentation-composition-hardening.md](05b2-documentation-composition-hardening.md#production-composition-rule).

---

## Code locations

| Area | Path |
|------|------|
| Domain contracts | `src/domain/link/` |
| URL intake | `src/domain/media/url-intake.ts` |
| Coordinator | `src/server/link/link-intelligence-coordinator.ts` |
| Stage runner | `src/server/link/link-intelligence-stage-runner.ts` |
| Security | `security-gate.ts`, `secure-host.ts`, `secure-fetch.ts` |
| Factories | `link-intelligence-factory.ts` |
| Providers | `mock-link-provider.ts`, `youtube-link-provider.ts` |
| Cache port | `link-metadata-cache.ts` |
| Orchestrator port | `src/server/orchestration/ports.ts` |
| Stage planner | `src/domain/orchestration/stage-planner.ts`, `stages.ts` |
| Tests | `tests/link/`, `tests/media/urlIntake.spec.ts` |

---

## Verification

```bash
npm run typecheck
npm test -- tests/link
npm test -- tests/orchestration
npm test
```

---

## Deferred

| Item | Phase |
|------|-------|
| LinkMetadataCache storage adapter | PP-09 |
| Vimeo provider | PP-05C+ |
| HTTP reference routes | API phase |
| Metadata persistence repository | Persistence track |
| Worker async execution | Worker boundary |
| DNS TOCTOU / partial IPv6 literal handling | Documented in [05b2](05b2-documentation-composition-hardening.md) |
