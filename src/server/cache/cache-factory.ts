import type { AnalysisRepository } from '@/server/persistence/repositories/analysis-repository';
import type { CacheRepository } from '@/server/persistence/repositories/cache-repository';
import type { CachePort } from '@/server/orchestration/ports';
import {
  createCacheCoordinator,
  type CacheCoordinator,
} from './cache-coordinator.js';
import { createCachePort } from './cache-port-adapter.js';

export type CreateCacheStackOptions = {
  cacheRepository: CacheRepository;
  analysisRepository: AnalysisRepository;
};

export type CacheStack = {
  coordinator: CacheCoordinator;
  port: CachePort;
};

export function createCacheStack(options: CreateCacheStackOptions): CacheStack {
  const coordinator = createCacheCoordinator({
    cacheRepository: options.cacheRepository,
    analysisRepository: options.analysisRepository,
  });

  return {
    coordinator,
    port: createCachePort(coordinator),
  };
}
