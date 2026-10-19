import type { LinkFetchRequest, LinkFetchResult, LinkProvider } from '@/domain/link';
import { LINK_INTELLIGENCE_CONFIG, YOUTUBE_ALLOWED_HOSTS } from './config.js';
import { secureFetch } from './secure-fetch.js';

export type OEmbedResponse = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  type?: string;
  width?: number;
  height?: number;
};

export type YouTubeLinkProviderDeps = {
  fetchOEmbed?: (url: string, timeoutMs: number) => Promise<OEmbedResponse | null>;
};

async function defaultFetchOEmbed(url: string, timeoutMs: number): Promise<OEmbedResponse | null> {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const result = await secureFetch(oembedUrl, { timeoutMs });

  if (!result.ok) {
    if (result.message.includes('401') || result.message.includes('403')) {
      return null;
    }
    throw new Error(result.message);
  }

  return JSON.parse(result.body) as OEmbedResponse;
}

/** YouTube metadata via oEmbed — no official SDK. */
export class YouTubeLinkProvider implements LinkProvider {
  readonly providerId = 'youtube' as const;

  readonly capabilities = {
    supportsOEmbed: true,
    supportsMetadataApi: false,
    maxDurationSeconds: 43_200,
  };

  private readonly fetchOEmbed: (url: string, timeoutMs: number) => Promise<OEmbedResponse | null>;

  constructor(deps: YouTubeLinkProviderDeps = {}) {
    this.fetchOEmbed = deps.fetchOEmbed ?? defaultFetchOEmbed;
  }

  detect(url: URL): boolean {
    const host = url.hostname.toLowerCase();
    return YOUTUBE_ALLOWED_HOSTS.has(host);
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
    try {
      const oembed = await this.fetchOEmbed(
        request.normalized.canonicalUrl,
        LINK_INTELLIGENCE_CONFIG.fetchTimeoutMs,
      );

      if (!oembed) {
        return {
          ok: false,
          code: 'private_content',
          retryable: false,
          message: 'Video metadata is unavailable or private',
        };
      }

      const aspectRatio = oembed.width && oembed.height
        ? `${oembed.width}:${oembed.height}`
        : undefined;

      return {
        ok: true,
        extractionMethod: 'oembed',
        payload: {
          title: oembed.title,
          authorLabel: oembed.author_name,
          thumbnailUrl: oembed.thumbnail_url,
          aspectRatio,
          mediaKind: 'video',
          accessStatus: 'public',
          embedAllowed: true,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'YouTube metadata fetch failed';
      const isTimeout = message.includes('abort') || message.toLowerCase().includes('timeout');
      return {
        ok: false,
        code: isTimeout ? 'timeout' : 'provider_error',
        retryable: !isTimeout,
        message,
      };
    }
  }
}

export function createYouTubeLinkProvider(deps?: YouTubeLinkProviderDeps): YouTubeLinkProvider {
  return new YouTubeLinkProvider(deps);
}
