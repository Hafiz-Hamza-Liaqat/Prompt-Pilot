# ADR-001: Canonical contracts live in `src/domain/canonical/`

**Status:** Accepted  
**Date:** 2026-07-05  
**Phase:** PP-03

## Context

PP-02 defined canonical domain language. The repository already contains legacy Phase 1 schemas in `src/domain/` (`SourceAnalysis`, `VideoPlan`, etc.). PP-03 must encode PP-02 without breaking existing tests or wizard flows.

## Decision

Add a dedicated **`src/domain/canonical/`** module for all PP-02-derived contracts. Re-export from `src/domain/index.ts`. Legacy schemas remain in place until Migration Phase E.

## Consequences

- Clear boundary between pivot contracts and legacy planning contracts
- New modules import from `canonical/` or barrel `@/domain`
- Dual maintenance until deprecation completes
- No runtime services added in PP-03

## Alternatives considered

- **Replace SourceAnalysis in place** — rejected; breaks VideoPlan hierarchy and brief tests
- **Separate `src/contracts/` package** — rejected; project convention is `src/domain/` for Zod
