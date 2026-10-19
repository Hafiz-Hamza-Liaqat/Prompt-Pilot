import { describe, expect, it } from 'vitest';
import type {
  AnalysisRepository,
  AttestationRepository,
  CacheRepository,
  ExportRepository,
  FingerprintRepository,
  JobRepository,
  PackageRepository,
  PersistenceResult,
  PivotRepositoryMap,
  PivotRepositoryRegistry,
  ReferenceIntakePayloadRepository,
  ReferenceRepository,
  WorkspaceRepository,
} from '../../src/server/persistence/index.js';
import { PERSISTENCE_TOKENS } from '../../src/server/persistence/tokens.js';

/** Compile-time structural stubs — never used at runtime as implementations. */
const notImplemented = () => {
  throw new Error('PP-05B stub — not a runtime implementation');
};

const stubAttestationRepository: AttestationRepository = {
  insert: notImplemented,
};

const stubReferenceIntakePayloadRepository: ReferenceIntakePayloadRepository = {
  insert: notImplemented,
  getByReferenceId: notImplemented,
};

const stubReferenceRepository: ReferenceRepository = {
  insert: notImplemented,
  getById: notImplemented,
  listByProject: notImplemented,
  getLatestByProject: notImplemented,
  updateMetadata: notImplemented,
};

const stubAnalysisRepository: AnalysisRepository = {
  insert: notImplemented,
  getById: notImplemented,
  listByReference: notImplemented,
  getLatestByReference: notImplemented,
  setLatestVersion: notImplemented,
};

const stubPackageRepository: PackageRepository = {
  insert: notImplemented,
  getById: notImplemented,
  listByAnalysis: notImplemented,
  getLatestByAnalysisAndType: notImplemented,
};

const stubJobRepository: JobRepository = {
  create: notImplemented,
  getById: notImplemented,
  transitionState: notImplemented,
  appendEvent: notImplemented,
  listByReference: notImplemented,
  getActiveByProject: notImplemented,
};

const stubExportRepository: ExportRepository = {
  insert: notImplemented,
  getById: notImplemented,
  listByProject: notImplemented,
};

const stubWorkspaceRepository: WorkspaceRepository = {
  getIntelligenceBundle: notImplemented,
};

const stubFingerprintRepository: FingerprintRepository = {
  insertCandidate: notImplemented,
  getById: notImplemented,
  lookupByIdentity: notImplemented,
  promoteToActive: notImplemented,
  invalidate: notImplemented,
};

const stubCacheRepository: CacheRepository = {
  lookup: notImplemented,
  put: notImplemented,
  recordHit: notImplemented,
  invalidate: notImplemented,
};

const stubRegistry: PivotRepositoryRegistry = {
  referenceRepository: stubReferenceRepository,
  attestationRepository: stubAttestationRepository,
  referenceIntakePayloadRepository: stubReferenceIntakePayloadRepository,
  analysisRepository: stubAnalysisRepository,
  packageRepository: stubPackageRepository,
  jobRepository: stubJobRepository,
  exportRepository: stubExportRepository,
  workspaceRepository: stubWorkspaceRepository,
  fingerprintRepository: stubFingerprintRepository,
  cacheRepository: stubCacheRepository,
  unitOfWork: { run: notImplemented },
};

function assignPivotRepositories(map: PivotRepositoryMap): PivotRepositoryMap {
  return map;
}

describe('persistence repository interfaces (PP-05B compile-time)', () => {
  it('accepts structural stubs for all pivot repository interfaces', () => {
    expect(assignPivotRepositories(stubRegistry)).toBe(stubRegistry);
  });

  it('defines stable DI tokens', () => {
    expect(PERSISTENCE_TOKENS.referenceRepository).toBe(
      Symbol.for('prompt-pilot.persistence.ReferenceRepository'),
    );
    expect(PERSISTENCE_TOKENS.unitOfWork).toBe(
      Symbol.for('prompt-pilot.persistence.UnitOfWork'),
    );
  });

  it('models persistence result discriminated union', () => {
    const success: PersistenceResult<{ id: string }> = { ok: true, data: { id: 'x' } };
    const failure: PersistenceResult<{ id: string }> = { ok: false, code: 'not_found' };
    expect(success.ok).toBe(true);
    if (!failure.ok) {
      expect(failure.code).toBe('not_found');
    }
  });
});
