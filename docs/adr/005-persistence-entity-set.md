# ADR-005: Persistence entity set and forbidden table policy

**Status:** Accepted (PP-05A)  
**Date:** 2026-07-05  
**Phase:** PP-05A

## Context

PP-03 defines `PackageEnvelope` as the canonical output contract. Legacy `applicationSchemaInventory` forbids `prompt_outputs` and `video_plans`. PP-05A must define what persistence entities are approved without creating parallel monolith tables.

## Decision

1. **Approve** pivot persistence entities: Reference, ReferenceVideoAnalysis, Package, PackageManifest (normalized or embedded), Job, JobEvent, Export, ContentFingerprint, CacheEntry, WorkspaceAsset, ProviderUsage, RightsAttestation.
2. **Keep forbidden:** `video_plans`, `prompt_outputs`, `scene_plans`, `result_workspaces` — packages subsume these roles.
3. **PackageManifest** persists audit fields from `PackageEnvelope.dependsOn` and `inputManifest` — not a second domain object with different semantics.
4. **Workspace** remains non-persisted — read model only.

## Consequences

- PP-05B migrations add new tables; inventory updated in same change set.
- No VideoPlan persistence table in pivot path.
- Adapter may still produce VideoPlan JSON at **export** time only.

## Alternatives considered

- **Single `intelligence_blobs` table** — rejected; loses type safety and RLS granularity
- **Persist VideoPlan** — rejected; contradicts package envelope architecture
