import type { LinkProviderRegistry } from './link-provider-registry.js';
import { createLinkProviderRegistry } from './link-provider-registry.js';
import { createLinkIntelligenceCoordinator, type LinkIntelligenceCoordinator } from './link-intelligence-coordinator.js';
import { createMockLinkProvider } from './mock-link-provider.js';
import { createYouTubeLinkProvider } from './youtube-link-provider.js';

export type CreateLinkIntelligenceStackOptions = {
  registry?: LinkProviderRegistry;
  useYouTubeProvider?: boolean;
};

/**
 * Development/test wiring — mock provider registered by default.
 * Production must use {@link createProductionLinkIntelligenceStack} instead.
 */
export function createLinkIntelligenceStack(
  options: CreateLinkIntelligenceStackOptions = {},
): LinkIntelligenceCoordinator {
  const registry = options.registry ?? createLinkProviderRegistry([
    createMockLinkProvider(),
    ...(options.useYouTubeProvider ? [createYouTubeLinkProvider()] : []),
  ]);

  return createLinkIntelligenceCoordinator({ registry });
}

/**
 * Production wiring — YouTube provider only.
 * Do not register MockLinkProvider in production environments.
 *
 * Production composition must also pass MediaIntakeService into
 * executeLinkIntelligenceStage — see docs/pp-05/05b2-documentation-composition-hardening.md
 */
export function createProductionLinkIntelligenceStack(): LinkIntelligenceCoordinator {
  return createLinkIntelligenceCoordinator({
    registry: createLinkProviderRegistry([createYouTubeLinkProvider()]),
  });
}

export function createDefaultLinkIntelligenceCoordinator(): LinkIntelligenceCoordinator {
  return createLinkIntelligenceStack();
}
