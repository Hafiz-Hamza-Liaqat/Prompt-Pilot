# PP-05C — Persistence Implementation

**Status:** COMPLETE  
**Scope:** SQL migrations, Supabase repository adapters, UnitOfWork, RLS, indexes, integration tests.

## Deliverables

| Area | Location |
|------|----------|
| Migration | `supabase/migrations/20260705120000_create_pivot_persistence.sql` |
| Supabase adapters | `src/server/persistence/adapters/supabase/` |
| UnitOfWork | `src/server/persistence/adapters/postgres/postgres-unit-of-work.ts` |
| Registry factory | `createSupabasePivotRepositoryRegistry()` |
| Schema inventory | `src/domain/applicationSchemaInventory.ts` (18 tables) |
| pgTAP RLS | `supabase/tests/database/pivot_persistence_rls.test.sql` |
| Integration tests | `tests/persistence/supabaseIntegration.spec.ts` |

## Repository implementations

All eight PP-05B interfaces are implemented against Supabase PostgREST:

- `SupabaseReferenceRepository` → `content_references`
- `SupabaseAnalysisRepository` → `reference_analyses` (+ RPC `prompt_pilot_set_latest_analysis`)
- `SupabasePackageRepository` → `content_packages`
- `SupabaseJobRepository` → `analysis_jobs`, `job_events`
- `SupabaseExportRepository` → `content_exports`
- `SupabaseFingerprintRepository` → `content_fingerprints`
- `SupabaseCacheRepository` → `cache_entries`
- `SupabaseWorkspaceRepository` → read-only composition of reference/analysis/package/job repos

## Verification

```bash
npm run supabase:reset
npm run supabase:test
npm run typecheck
npm test
npm run verify:pivot:local   # requires local Supabase + .env.local
```

## Deferred

- True SQL transactions via direct `pg` pool (Supabase JS client uses sequential UnitOfWork)
- `provider_usage` / `workspace_assets` write repositories (tables exist; no PP-05B interface)
- Generated `database.ts` types refresh (run `npm run supabase:types` after reset)

## Out of scope (PP-05C)

AI providers, package generation, uploads, link intelligence, UI, orchestration, workers.
