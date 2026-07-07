import type { EntityId } from '@/domain/canonical/primitives';
import type { AnalysisRepository } from '@/server/persistence/repositories/analysis-repository';
import type { CacheRepository } from '@/server/persistence/repositories/cache-repository';
import type { AnalysisProviderPort } from '@/server/orchestration/ports';
import { createCacheCoordinator } from '@/server/cache/cache-coordinator.js';
import type { ReferenceAnalysisProvider } from './analysis-provider.js';
import {
  createAnalysisProviderPort,
  type AnalysisPortInputResolver,
} from './analysis-port-adapter.js';
import {
  createCoreAnalysisCoordinator,
  type CoreAnalysisCoordinator,
} from './core-analysis-coordinator.js';
import { createMockAnalysisProvider } from './mock-analysis-provider.js';

export type CreateAnalysisStackOptions = {
  analysisRepository: AnalysisRepository;
  cacheRepository: CacheRepository;
  provider?: ReferenceAnalysisProvider;
  resolvePortInput: AnalysisPortInputResolver;
  idGenerator?: () => EntityId;
};

export type AnalysisStack = {
  coordinator: CoreAnalysisCoordinator;
  provider: ReferenceAnalysisProvider;
  port: AnalysisProviderPort;
};

/**
 * Development/test wiring — mock provider registered by default.
 * Runtime stage execution should call executeCoreAnalysisStage directly (Option B).
 */
export function createAnalysisStack(options: CreateAnalysisStackOptions): AnalysisStack {
  const provider = options.provider ?? createMockAnalysisProvider();
  const cacheCoordinator = createCacheCoordinator({
    cacheRepository: options.cacheRepository,
    analysisRepository: options.analysisRepository,
  });
  const coordinator = createCoreAnalysisCoordinator({
    provider,
    analysisRepository: options.analysisRepository,
    cacheCoordinator,
    idGenerator: options.idGenerator,
  });

  return {
    coordinator,
    provider,
    port: createAnalysisProviderPort(coordinator, {
      providerId: provider.providerId,
      resolveInput: options.resolvePortInput,
    }),
  };
}

export function createDefaultAnalysisStack(
  options: CreateAnalysisStackOptions,
): AnalysisStack {
  return createAnalysisStack(options);
}
