import type {
  LinkFetchRequest,
  LinkFetchResult,
  LinkProvider,
  ProviderRawMetadata,
} from '@/domain/link';
import { YOUTUBE_ALLOWED_HOSTS } from './config.js';

const DEFAULT_FIXTURE: ProviderRawMetadata = {
  title: 'Mock reference video',
  authorLabel: 'Mock Channel',
  durationSeconds: 212,
  thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  language: 'en',
  mediaKind: 'video',
  accessStatus: 'public',
  embedAllowed: true,
};

/** Dev/test link provider — no outbound HTTP. */
export class MockLinkProvider implements LinkProvider {
  readonly providerId = 'mock' as const;

  readonly capabilities = {
    supportsOEmbed: false,
    supportsMetadataApi: false,
    maxDurationSeconds: 86_400,
  };

  private readonly fixtures = new Map<string, ProviderRawMetadata>();

  constructor(initialFixtures?: Record<string, ProviderRawMetadata>) {
    if (initialFixtures) {
      for (const [id, metadata] of Object.entries(initialFixtures)) {
        this.fixtures.set(id, metadata);
      }
    }
  }

  detect(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return YOUTUBE_ALLOWED_HOSTS.has(host) || host.endsWith('youtu.be');
  }

  extractContentId(url: URL): string | null {
    if (url.hostname.toLowerCase().replace(/^www\./, '') === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? null;
    }
    if (url.pathname === '/watch') {
      return url.searchParams.get('v');
    }
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] === 'shorts' || segments[0] === 'embed' || segments[0] === 'live') {
      return segments[1] ?? null;
    }
    return null;
  }

  async fetchMetadata(request: LinkFetchRequest): Promise<LinkFetchResult> {
    const fixture = this.fixtures.get(request.normalized.platformContentId) ?? DEFAULT_FIXTURE;
    return {
      ok: true,
      payload: { ...fixture },
      extractionMethod: 'mock',
    };
  }

  setFixture(contentId: string, metadata: ProviderRawMetadata): void {
    this.fixtures.set(contentId, metadata);
  }
}

export function createMockLinkProvider(fixtures?: Record<string, ProviderRawMetadata>): MockLinkProvider {
  return new MockLinkProvider(fixtures);
}
