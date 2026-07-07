import { randomUUID } from 'node:crypto';
import type { ReferenceVideoAnalysis } from '@/domain/canonical/referenceVideoAnalysis';
import { ReferenceVideoAnalysisSchema } from '@/domain/canonical/referenceVideoAnalysis';
import type { AnalysisVersion } from '@/domain/canonical/analysisVersion';
import type { EntityId } from '@/domain/canonical/primitives';
import type { IsoDateTime } from '@/domain/common';
import type { OwnerScope } from '@/server/persistence';
import type { AnalysisRepository } from '@/server/persistence/repositories/analysis-repository';
import type { CacheCoordinator } from '@/server/cache/cache-coordinator';
import type { ReferenceAnalysisProvider } from './analysis-provider.js';
import { CORE_ANALYSIS_CONFIG } from './config.js';
import {
  mapCacheErrorToCoordinatorCode,
  mapPersistenceErrorToCoordinatorCode,
  mapProviderErrorToCoordinatorCode,
} from './failure-mapping.js';
import type {
  AnalyzeReferenceInput,
  AnalyzeReferenceOutcome,
  CoreAnalysisCoordinatorRequest,
  ReferenceIntakeView,
  ReferenceVideoAnalysisDraft,
} from './types.js';

export type CoreAnalysisResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; retryable?: boolean };

export type CoreAnalysisCoordinatorDeps = {
  provider: ReferenceAnalysisProvider;
  analysisRepository: AnalysisRepository;
  cacheCoordinator: CacheCoordinator;
  /** Injectable ID generator for tests — production uses randomUUID. */
  idGenerator?: () => EntityId;
};

function coordinatorOk<T>(data: T): CoreAnalysisResult<T> {
  return { ok: true, data };
}

function coordinatorErr<T>(
  code: string,
  message: string,
  retryable?: boolean,
): CoreAnalysisResult<T> {
  return { ok: false, code, message, retryable };
}

function assembleIntake(
  intake: ReferenceIntakeView,
  override?: Partial<ReferenceIntakeView>,
): ReferenceIntakeView {
  if (!override) {
    return intake;
  }

  return { ...intake, ...override };
}

function toAnalyzeReferenceInput(
  request: CoreAnalysisCoordinatorRequest,
  intake: ReferenceIntakeView,
): AnalyzeReferenceInput {
  return {
    jobId: request.jobId,
    referenceId: request.referenceId,
    projectId: request.projectId,
    ownerId: request.ownerId,
    referenceKind: request.referenceKind,
    fingerprintId: request.fingerprintId,
    fingerprintAlgorithmVersion: request.fingerprintAlgorithmVersion,
    occurredAt: request.occurredAt,
    intake,
  };
}

function computeCacheExpiresAt(from: IsoDateTime): IsoDateTime {
  const expires = new Date(from);
  expires.setUTCDate(expires.getUTCDate() + CORE_ANALYSIS_CONFIG.defaultCacheTtlDays);
  return expires.toISOString();
}

/**
 * Coordinates intake assembly, provider invocation, validation, persistence, and cache write.
 * Does not advance job workflow — JobOrchestrator owns progression.
 */
export class CoreAnalysisCoordinator {
  constructor(private readonly deps: CoreAnalysisCoordinatorDeps) {}

  async analyzeReference(
    request: CoreAnalysisCoordinatorRequest,
  ): Promise<CoreAnalysisResult<AnalyzeReferenceOutcome>> {
    const scope: OwnerScope = {
      ownerId: request.ownerId,
      projectId: request.projectId,
    };
    const intake = assembleIntake(request.intake, request.intakeOverride);
    const providerInput = toAnalyzeReferenceInput(request, intake);

    const providerResult = await this.deps.provider.analyze(providerInput);
    if (!providerResult.ok) {
      const mapped = mapProviderErrorToCoordinatorCode(providerResult.code);
      return coordinatorErr(mapped.code, providerResult.message, mapped.retryable);
    }

    const versionResult = await this.resolveVersionMetadata(scope, request.referenceId);
    if (!versionResult.ok) {
      return versionResult;
    }

    const analysis = this.buildPersistedAnalysis(
      request,
      providerResult.data,
      versionResult.data,
    );

    const validated = ReferenceVideoAnalysisSchema.safeParse(analysis);
    if (!validated.success) {
      return coordinatorErr(
        'analysis_failed',
        validated.error.issues.map((issue) => issue.message).join('; ') || 'Analysis validation failed',
        false,
      );
    }

    const inserted = await this.deps.analysisRepository.insert(scope, validated.data);
    if (!inserted.ok) {
      const mapped = mapPersistenceErrorToCoordinatorCode(inserted.code);
      return coordinatorErr(
        mapped.code,
        inserted.message ?? 'Analysis persistence failed',
        mapped.retryable,
      );
    }

    const latest = await this.deps.analysisRepository.setLatestVersion(scope, {
      referenceId: request.referenceId,
      analysisId: validated.data.analysisId,
      analysisVersion: validated.data.version.analysisVersion,
    });
    if (!latest.ok) {
      const mapped = mapPersistenceErrorToCoordinatorCode(latest.code);
      return coordinatorErr(
        mapped.code,
        latest.message ?? 'Analysis version update failed',
        mapped.retryable,
      );
    }

    const cacheWrite = await this.deps.cacheCoordinator.writeEntry({
      scope,
      fingerprintId: request.fingerprintId,
      fingerprintAlgorithmVersion: request.fingerprintAlgorithmVersion,
      analysisId: validated.data.analysisId,
      analysisVersion: validated.data.version.analysisVersion,
      pipelineVersion: validated.data.pipelineVersion,
      expiresAt: computeCacheExpiresAt(request.occurredAt),
    });
    if (!cacheWrite.ok) {
      const mapped = mapCacheErrorToCoordinatorCode(cacheWrite.code, cacheWrite.retryable);
      return coordinatorErr(mapped.code, cacheWrite.message, mapped.retryable);
    }

    return coordinatorOk({
      analysisId: validated.data.analysisId,
      completedAt: request.occurredAt,
    });
  }

  private buildPersistedAnalysis(
    request: CoreAnalysisCoordinatorRequest,
    draft: ReferenceVideoAnalysisDraft,
    version: AnalysisVersion,
  ): ReferenceVideoAnalysis {
    const analysisId = (this.deps.idGenerator ?? randomUUID)() as EntityId;

    return {
      ...draft,
      analysisId,
      projectId: request.projectId,
      referenceId: request.referenceId,
      fingerprintId: request.fingerprintId,
      pipelineVersion: CORE_ANALYSIS_CONFIG.pipelineVersion,
      createdAt: request.occurredAt,
      version,
      fingerprint: {
        ...draft.fingerprint,
        fingerprintId: request.fingerprintId,
        fingerprintAlgorithmVersion: request.fingerprintAlgorithmVersion,
      },
    };
  }

  private async resolveVersionMetadata(
    scope: OwnerScope,
    referenceId: EntityId,
  ): Promise<CoreAnalysisResult<AnalysisVersion>> {
    const latest = await this.deps.analysisRepository.getLatestByReference(scope, referenceId);
    if (!latest.ok) {
      const mapped = mapPersistenceErrorToCoordinatorCode(latest.code);
      return coordinatorErr(
        mapped.code,
        latest.message ?? 'Failed to resolve prior analysis version',
        mapped.retryable,
      );
    }

    if (!latest.data) {
      return coordinatorOk({
        analysisVersion: 1,
        isLatest: true,
        changeReason: 'initial',
      });
    }

    return coordinatorOk({
      analysisVersion: latest.data.version.analysisVersion + 1,
      isLatest: true,
      changeReason: 'reanalysis',
      supersedesAnalysisId: latest.data.analysisId,
    });
  }
}

export function createCoreAnalysisCoordinator(
  deps: CoreAnalysisCoordinatorDeps,
): CoreAnalysisCoordinator {
  return new CoreAnalysisCoordinator(deps);
}
