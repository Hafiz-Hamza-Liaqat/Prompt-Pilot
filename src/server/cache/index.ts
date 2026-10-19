export { buildCacheKey, type CacheKeyInput } from './cache-key.js';

export type {
  CacheCoordinator,
  CacheCoordinatorDeps,
  CacheInvalidationReason,
  CacheLookupInput,
  CacheLookupOutcome,
  CacheResult,
  CacheWriteInput,
} from './cache-coordinator.js';
export { createCacheCoordinator } from './cache-coordinator.js';

export { createCachePort } from './cache-port-adapter.js';

export {
  executeCacheLookupStage,
  type CacheLookupStageInput,
} from './cache-lookup-stage-runner.js';

export { createCacheStack, type CacheStack, type CreateCacheStackOptions } from './cache-factory.js';
