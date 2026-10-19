import type { LinkProvider, LinkProviderId } from '@/domain/link';

export type LinkProviderRegistry = {
  detectProvider(url: URL): LinkProvider | null;
  getProvider(providerId: LinkProviderId): LinkProvider | undefined;
  registerProvider(provider: LinkProvider): void;
  listProviders(): readonly LinkProvider[];
};

export class DefaultLinkProviderRegistry implements LinkProviderRegistry {
  private readonly providers = new Map<LinkProviderId, LinkProvider>();

  registerProvider(provider: LinkProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  getProvider(providerId: LinkProviderId): LinkProvider | undefined {
    return this.providers.get(providerId);
  }

  listProviders(): readonly LinkProvider[] {
    return [...this.providers.values()];
  }

  detectProvider(url: URL): LinkProvider | null {
    for (const provider of this.providers.values()) {
      if (provider.detect(url)) {
        return provider;
      }
    }
    return null;
  }
}

export function createLinkProviderRegistry(providers: readonly LinkProvider[]): LinkProviderRegistry {
  const registry = new DefaultLinkProviderRegistry();
  for (const provider of providers) {
    registry.registerProvider(provider);
  }
  return registry;
}
