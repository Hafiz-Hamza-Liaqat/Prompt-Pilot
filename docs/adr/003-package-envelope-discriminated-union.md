# ADR-003: Package envelope uses discriminated union on `packageType`

**Status:** Accepted  
**Date:** 2026-07-05  
**Phase:** PP-03

## Context

PP-02 Package Engine defines a shared envelope (Identity, Version, Generator, Dependencies, Inputs, Outputs, Metadata) with five package types sharing one contract.

## Decision

Implement **`PackageEnvelopeSchema`** as a Zod **`discriminatedUnion('packageType', …)`** with typed payloads:

- `blueprint` → `BlueprintPackagePayloadSchema`
- `prompt` → `PromptPackagePayloadSchema`
- `seo` → `SeoPackagePayloadSchema`
- `marketing` → `MarketingPackagePayloadSchema`
- `repurposing` → `RepurposingPackagePayloadSchema`

Shared envelope fields live in `PackageEnvelopeBaseSchema` (internal). Payload schemas reuse legacy units where applicable (`CompiledPromptSchema`, `ContinuityBibleSchema`, `SceneTimelineSchema`).

## Consequences

- Type-safe payload access after discriminating on `packageType`
- Single persistence shape for all packages (PP-04)
- Regeneration rules from PP-02 apply to `packageVersion` + `supersedesPackageId`

## Alternatives considered

- **Generic `payload: z.unknown()`** — rejected; loses validation at contract boundary
- **Separate schema per file without union** — rejected; duplicates envelope fields
