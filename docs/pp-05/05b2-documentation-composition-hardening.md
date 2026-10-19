# PP-05B.2 — Documentation & Composition Hardening

**Status:** COMPLETE  
**Dependencies:** PP-05B.1 (GO WITH CONDITIONS — audit closed by this phase)  
**Scope:** Documentation and composition clarification only — **no runtime behavior changes**.

---

## Audit conditions closed

| Condition | Resolution |
|-----------|------------|
| Stale roadmap | `docs/prompt-pilot-roadmap.md` Phase 6 updated — implementation complete through PP-05B.1 |
| Stale PP-05 README | Removed deferred/no-production-code sections; describes current runtime |
| Stale PP-05B implementation doc | Cross-references PP-05B.1, security hardening, Media Intake handoff |
| Production composition rule | Documented below and in [README.md](README.md) |
| Security residuals | DNS TOCTOU and partial IPv6 literal handling explicitly deferred |

---

## Production composition rule

Production composition roots **must** wire Link Intelligence stage execution with **both**:

1. **`LinkIntelligenceCoordinator`** — via `createProductionLinkIntelligenceStack()` (YouTube provider only; no mock).
2. **`MediaIntakeService`** — injected into `executeLinkIntelligenceStage` so URL handoff always runs.

### Required call shape

```typescript
import { createProductionLinkIntelligenceStack, executeLinkIntelligenceStage } from '@/server/link';
import { createPureMediaIntakeService } from '@/server/media';

const coordinator = createProductionLinkIntelligenceStack();
const mediaIntake = createPureMediaIntakeService();

await executeLinkIntelligenceStage(
  orchestrator,
  coordinator,
  context,
  { rawUrl, occurredAt },
  { mediaIntake }, // required in production — omitting skips URL handoff
);
```

### Composition root locations

| Concern | Module |
|---------|--------|
| Coordinator factory (production vs dev/test) | `src/server/link/link-intelligence-factory.ts` |
| Stage runner deps (`mediaIntake`) | `src/server/link/link-intelligence-stage-runner.ts` |
| Media Intake service | `src/server/media/pure-media-intake-service.ts` → `createPureMediaIntakeService()` |

### Rules

| Environment | Coordinator | `mediaIntake` in stage deps |
|-------------|-------------|----------------------------|
| **Production** | `createProductionLinkIntelligenceStack()` | **Required** |
| **Development / Test** | `createLinkIntelligenceStack()` (mock default) | Recommended; may omit for isolated coordinator tests |

Omitting `mediaIntake` does not fail at compile time — production composition roots are responsible for always passing it.

---

## Accepted security limitations (deferred)

These are **known and accepted** residuals within Link Intelligence scope. PP-05B.2 does not implement additional controls.

| Limitation | Description | Status |
|------------|-------------|--------|
| **DNS TOCTOU** | Hostname is resolved and validated before fetch, but the TCP connection is not re-checked against resolved addresses. A malicious or racing DNS response could theoretically differ between check and connect. | **Deferred** — standard resolve-then-fetch pattern; reconnect-time validation out of PP-05B scope |
| **Partial IPv6 literal handling** | Resolved private IPv6 ranges are blocked; hostname-level blocking is IPv4-oriented. Uncommon IPv6 literal edge forms may not be rejected at the hostname layer before resolution. | **Deferred** — exhaustive RFC 5952 literal normalization not in scope |

See also [05b1-link-intelligence-hardening.md](05b1-link-intelligence-hardening.md) for other deferred items (certificate pinning, cache-backend SSRF).

---

## Verification

```bash
npm run typecheck
```

No runtime tests required for this documentation-only phase.
