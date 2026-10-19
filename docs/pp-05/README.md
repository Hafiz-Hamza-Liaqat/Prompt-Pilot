# PP-05 — Link Intelligence & URL Safety

**Status:** IMPLEMENTATION COMPLETE (through PP-05B.2)  
**Design:** [05-link-intelligence-design-audit.md](05-link-intelligence-design-audit.md)  
**Implementation:** [05b-link-intelligence-implementation.md](05b-link-intelligence-implementation.md)  
**Hardening:** [05b1-link-intelligence-hardening.md](05b1-link-intelligence-hardening.md)  
**Documentation:** [05b2-documentation-composition-hardening.md](05b2-documentation-composition-hardening.md)

---

## Purpose

The **Link Intelligence Engine** analyzes URL-based references (YouTube, Vimeo planned) **before Core Analysis**, producing canonical `LinkMetadata` for the orchestration pipeline. It does not download video media, call AI, or persist metadata.

---

## Naming note

| ID | Meaning |
|----|---------|
| **PP-05** | Link Intelligence & URL Safety (this track) |
| **PP-05A** | Persistence Domain Design (separate, **APPROVED**) — see [pp-05a/](../pp-05a/) |
| **PP-05B** (persistence) | Repository interfaces — see [pp-05b/](../pp-05b/) — **different track** |

This folder documents **Link Intelligence** (PP-05 / PP-05B implementation sub-phases), not persistence PP-05B.

---

## Current runtime

```
JobOrchestrator
  └── executeLinkIntelligenceStage
        ├── LinkIntelligenceCoordinator (URL normalize, SSRF, provider fetch)
        └── MediaIntakeService.resolveUrlReference (production — required)
```

| Component | Path |
|-----------|------|
| Domain contracts | `src/domain/link/` |
| URL media descriptor | `src/domain/media/url-intake.ts`, `url-media-descriptor.ts` |
| Coordinator | `src/server/link/link-intelligence-coordinator.ts` |
| Stage runner | `src/server/link/link-intelligence-stage-runner.ts` |
| Security | `security-gate.ts`, `secure-host.ts`, `secure-fetch.ts` |
| Factories | `link-intelligence-factory.ts` |
| Tests | `tests/link/`, `tests/media/urlIntake.spec.ts` |

### Pipeline (`youtube_url`)

```
validation → ownership → link_intelligence → fingerprint → …
```

Upload references (`video_upload`, `audio_upload`) skip `link_intelligence` and use `media_intake` as before.

---

## Production composition (required)

Production composition roots **must**:

1. Use `createProductionLinkIntelligenceStack()` — YouTube only; **no** `MockLinkProvider`.
2. Pass `MediaIntakeService` into `executeLinkIntelligenceStage` via `{ mediaIntake }` so URL handoff always runs.

```typescript
await executeLinkIntelligenceStage(
  orchestrator,
  createProductionLinkIntelligenceStack(),
  context,
  { rawUrl, occurredAt },
  { mediaIntake: createPureMediaIntakeService() },
);
```

Full rule: [05b2-documentation-composition-hardening.md](05b2-documentation-composition-hardening.md#production-composition-rule).

---

## Dependencies

| Phase | Relationship |
|-------|--------------|
| PP-02 | Reference, fingerprint inputs, job failure codes |
| PP-03 | `ReferenceSchema`, `LinkMetadataSchema`, `UrlMediaIntakeDescriptorSchema` |
| PP-04 | Link Intelligence service boundary, G-24/G-25 |
| PP-06 | Job lifecycle states for `preparing` / failure propagation |
| PP-07 | Media Intake URL handoff (`resolveUrlReference`) |
| PP-08 | Orchestrator `link_intelligence` stage |

---

## Deliverables

| Doc | Content |
|-----|---------|
| [05-link-intelligence-design-audit.md](05-link-intelligence-design-audit.md) | Design audit (15 sections) |
| [05b-link-intelligence-implementation.md](05b-link-intelligence-implementation.md) | PP-05B runtime implementation |
| [05b1-link-intelligence-hardening.md](05b1-link-intelligence-hardening.md) | PP-05B.1 audit remediations |
| [05b2-documentation-composition-hardening.md](05b2-documentation-composition-hardening.md) | PP-05B.2 docs + composition rule |

---

## Accepted security limitations (deferred)

| Limitation | Status |
|------------|--------|
| DNS TOCTOU (resolve vs connect gap) | **Deferred** |
| Partial IPv6 literal hostname handling | **Deferred** |
| Certificate pinning | **Deferred** |
| Link metadata cache backend SSRF | **Deferred** (no cache backend yet) |

Details: [05b2-documentation-composition-hardening.md](05b2-documentation-composition-hardening.md#accepted-security-limitations-deferred).

---

## Still deferred (future phases)

| Item | Phase |
|------|-------|
| LinkMetadataCache storage adapter | PP-09 |
| Vimeo provider | PP-05C+ |
| HTTP reference routes | API phase |
| Metadata persistence repository | Persistence track |
| Worker async execution | Worker boundary |

---

## Verification

```bash
npm run typecheck
npm test -- tests/link
npm test -- tests/orchestration
npm test
```
