import type {
  OwnerScope,
  PersistenceResult,
  WorkspaceIntelligenceQuery,
  WorkspaceIntelligenceSnapshot,
} from '../../contracts';
import type { AnalysisRepository } from '../../repositories/analysis-repository';
import type { JobRepository } from '../../repositories/job-repository';
import type { PackageRepository } from '../../repositories/package-repository';
import type { ReferenceRepository } from '../../repositories/reference-repository';
import type { WorkspaceRepository } from '../../repositories/workspace-repository';
import { persistenceErr, persistenceOk } from './shared';

export class SupabaseWorkspaceRepository implements WorkspaceRepository {
  constructor(
    private readonly referenceRepository: ReferenceRepository,
    private readonly analysisRepository: AnalysisRepository,
    private readonly packageRepository: PackageRepository,
    private readonly jobRepository: JobRepository,
  ) {}

  async getIntelligenceBundle(
    scope: OwnerScope,
    query: WorkspaceIntelligenceQuery = {},
  ): Promise<PersistenceResult<WorkspaceIntelligenceSnapshot>> {
    let reference = null;
    if (query.referenceId) {
      const referenceResult = await this.referenceRepository.getById(scope, query.referenceId);
      if (!referenceResult.ok) {
        return referenceResult;
      }
      reference = referenceResult.data;
    } else {
      const latestReferenceResult = await this.referenceRepository.getLatestByProject(scope);
      if (!latestReferenceResult.ok) {
        return latestReferenceResult;
      }
      reference = latestReferenceResult.data;
    }

    let analysis = null;
    if (query.analysisId) {
      const analysisResult = await this.analysisRepository.getById(scope, query.analysisId);
      if (!analysisResult.ok) {
        return analysisResult;
      }
      analysis = analysisResult.data;
    } else if (reference) {
      const latestAnalysisResult = await this.analysisRepository.getLatestByReference(
        scope,
        reference.referenceId,
      );
      if (!latestAnalysisResult.ok) {
        return latestAnalysisResult;
      }
      analysis = latestAnalysisResult.data;
    }

    let packages = [] as WorkspaceIntelligenceSnapshot['packages'];
    if (query.includePackages !== false && analysis) {
      const packagesResult = await this.packageRepository.listByAnalysis(scope, {
        analysisId: analysis.analysisId,
      });
      if (!packagesResult.ok) {
        return packagesResult;
      }
      packages = packagesResult.data;
    }

    const activeJobResult = await this.jobRepository.getActiveByProject(scope);
    if (!activeJobResult.ok) {
      return activeJobResult;
    }

    if (analysis && analysis.projectId !== scope.projectId) {
      return persistenceErr('scope_violation', 'analysis project scope mismatch');
    }
    if (reference && reference.projectId !== scope.projectId) {
      return persistenceErr('scope_violation', 'reference project scope mismatch');
    }

    return persistenceOk({
      reference,
      analysis,
      packages,
      activeJob: activeJobResult.data,
    });
  }
}
