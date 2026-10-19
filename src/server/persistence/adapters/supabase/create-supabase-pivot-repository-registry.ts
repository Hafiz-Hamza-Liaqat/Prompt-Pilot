import type { SupabaseClient } from '@supabase/supabase-js';
import type { PivotRepositoryRegistry } from '../../tokens';
import { SupabaseSequentialUnitOfWork } from '../postgres/postgres-unit-of-work';
import { SupabaseAnalysisRepository } from './supabase-analysis-repository';
import { SupabaseCacheRepository } from './supabase-cache-repository';
import { SupabaseExportRepository } from './supabase-export-repository';
import { SupabaseFingerprintRepository } from './supabase-fingerprint-repository';
import { SupabaseJobRepository } from './supabase-job-repository';
import { SupabasePackageRepository } from './supabase-package-repository';
import { SupabaseAttestationRepository } from './supabase-attestation-repository';
import { SupabaseReferenceIntakePayloadRepository } from './supabase-reference-intake-payload-repository';
import { SupabaseReferenceRepository } from './supabase-reference-repository';
import { SupabaseWorkspaceRepository } from './supabase-workspace-repository';

export function createSupabasePivotRepositoryRegistry(
  supabase: SupabaseClient,
): PivotRepositoryRegistry {
  const referenceRepository = new SupabaseReferenceRepository(supabase);
  const attestationRepository = new SupabaseAttestationRepository(supabase);
  const referenceIntakePayloadRepository = new SupabaseReferenceIntakePayloadRepository(supabase);
  const analysisRepository = new SupabaseAnalysisRepository(supabase);
  const packageRepository = new SupabasePackageRepository(supabase);
  const jobRepository = new SupabaseJobRepository(supabase);
  const exportRepository = new SupabaseExportRepository(supabase);
  const fingerprintRepository = new SupabaseFingerprintRepository(supabase);
  const cacheRepository = new SupabaseCacheRepository(supabase);
  const workspaceRepository = new SupabaseWorkspaceRepository(
    referenceRepository,
    analysisRepository,
    packageRepository,
    jobRepository,
  );

  return {
    referenceRepository,
    attestationRepository,
    referenceIntakePayloadRepository,
    analysisRepository,
    packageRepository,
    jobRepository,
    exportRepository,
    workspaceRepository,
    fingerprintRepository,
    cacheRepository,
    unitOfWork: new SupabaseSequentialUnitOfWork(),
  };
}
