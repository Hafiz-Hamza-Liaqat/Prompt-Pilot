export type {
  AnalyzeLinkInput,
  AnalyzeLinkOutcome,
  LinkIntelligenceCoordinator,
  LinkIntelligenceCoordinatorDeps,
  LinkIntelligenceResult,
} from './link-intelligence-coordinator.js';
export { createLinkIntelligenceCoordinator } from './link-intelligence-coordinator.js';

export type { LinkMetadataCache, LinkMetadataCacheKey } from './link-metadata-cache.js';
export { buildLinkMetadataCacheKey } from './link-metadata-cache.js';

export type { LinkProviderRegistry } from './link-provider-registry.js';
export { createLinkProviderRegistry, DefaultLinkProviderRegistry } from './link-provider-registry.js';

export { mapProviderRawToLinkMetadata } from './link-metadata-mapper.js';
export type { MapLinkMetadataInput } from './link-metadata-mapper.js';

export { normalizeUrl } from './url-normalizer.js';
export type { UrlNormalizationErrorCode, UrlNormalizationResult } from './url-normalizer.js';

export { assertFetchAllowed } from './security-gate.js';
export type { SecurityVerdict } from './security-gate.js';

export { MockLinkProvider, createMockLinkProvider } from './mock-link-provider.js';
export { YouTubeLinkProvider, createYouTubeLinkProvider } from './youtube-link-provider.js';
export type { OEmbedResponse, YouTubeLinkProviderDeps } from './youtube-link-provider.js';

export {
  executeLinkIntelligenceStage,
  type LinkIntelligenceStageInput,
  type LinkIntelligenceStageDeps,
} from './link-intelligence-stage-runner.js';

export {
  createDefaultLinkIntelligenceCoordinator,
  createLinkIntelligenceStack,
  createProductionLinkIntelligenceStack,
} from './link-intelligence-factory.js';

export { assertResolvedHostSafe, type HostAddressResolver } from './secure-host.js';
export { secureFetch, type SecureFetchOptions } from './secure-fetch.js';

export { createLinkIntelligencePort } from './link-intelligence-port-adapter.js';

export { LINK_INTELLIGENCE_CONFIG } from './config.js';
