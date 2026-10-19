import { describe, expect, it } from 'vitest';
import { createLinkProviderRegistry } from '../../src/server/link/link-provider-registry.js';
import { createMockLinkProvider } from '../../src/server/link/mock-link-provider.js';
import { createYouTubeLinkProvider } from '../../src/server/link/youtube-link-provider.js';

describe('LinkProviderRegistry', () => {
  it('detects YouTube provider for canonical watch URLs', () => {
    const registry = createLinkProviderRegistry([
      createMockLinkProvider(),
      createYouTubeLinkProvider(),
    ]);

    const provider = registry.detectProvider(new URL('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
    expect(provider?.providerId).toBe('mock');
  });

  it('returns provider by id', () => {
    const mock = createMockLinkProvider();
    const registry = createLinkProviderRegistry([mock]);
    expect(registry.getProvider('mock')).toBe(mock);
  });
});
