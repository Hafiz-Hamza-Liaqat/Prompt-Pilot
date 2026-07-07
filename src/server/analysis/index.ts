export { CORE_ANALYSIS_CONFIG } from './config.js';

export type { ReferenceAnalysisProvider, ReferenceAnalysisProviderResult } from './analysis-provider.js';

export {
  CoreAnalysisCoordinator,
  createCoreAnalysisCoordinator,
  type CoreAnalysisCoordinatorDeps,
  type CoreAnalysisResult,
} from './core-analysis-coordinator.js';

export {
  createAnalysisProviderPort,
  type AnalysisPortInputResolver,
  type CreateAnalysisProviderPortOptions,
} from './analysis-port-adapter.js';

export {
  createAnalysisStack,
  createDefaultAnalysisStack,
  type AnalysisStack,
  type CreateAnalysisStackOptions,
} from './analysis-factory.js';

export {
  executeCoreAnalysisStage,
} from './core-analysis-stage-runner.js';

export {
  mapCacheErrorToCoordinatorCode,
  mapPersistenceErrorToCoordinatorCode,
  mapProviderErrorToCoordinatorCode,
} from './failure-mapping.js';

export {
  MockAnalysisProvider,
  createMockAnalysisProvider,
  createUploadAssetFixture,
} from './mock-analysis-provider.js';

export type {
  AnalyzeReferenceInput,
  AnalyzeReferenceOutcome,
  CoreAnalysisCoordinatorRequest,
  CoreAnalysisStageInput,
  ReferenceIntakeView,
  ReferenceVideoAnalysisDraft,
} from './types.js';
