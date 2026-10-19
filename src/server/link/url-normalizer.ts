import type { NormalizedUrl } from '@/domain/link';

export type UrlNormalizationErrorCode = 'invalid_url' | 'unsupported_platform';

export type UrlNormalizationResult =
  | { ok: true; data: NormalizedUrl }
  | { ok: false; code: UrlNormalizationErrorCode; message: string };

const TRACKING_PARAMS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'si', 'feature']);

function parseHttpUrl(rawUrl: string): URL | null {
  const trimmed = rawUrl.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function stripTrackingParams(url: URL): URL {
  const cleaned = new URL(url.toString());
  for (const key of [...cleaned.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      cleaned.searchParams.delete(key);
    }
  }
  return cleaned;
}

function normalizeYouTube(parsed: URL, originalUrl: string): UrlNormalizationResult {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  let contentId: string | null = null;

  if (host === 'youtu.be') {
    contentId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (parsed.pathname === '/watch') {
      contentId = parsed.searchParams.get('v');
    } else {
      const segments = parsed.pathname.split('/').filter(Boolean);
      const head = segments[0];
      if (head === 'shorts' || head === 'embed' || head === 'live') {
        contentId = segments[1] ?? null;
      }
    }
  }

  if (!contentId || !/^[a-zA-Z0-9_-]{6,}$/.test(contentId)) {
    return { ok: false, code: 'unsupported_platform', message: 'Could not resolve YouTube video id from URL' };
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${contentId}`;
  return {
    ok: true,
    data: {
      canonicalUrl,
      originalUrl,
      platform: 'youtube',
      platformContentId: contentId,
    },
  };
}

function normalizeVimeo(parsed: URL, originalUrl: string): UrlNormalizationResult {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  let contentId: string | null = null;

  if (host === 'vimeo.com') {
    contentId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host === 'player.vimeo.com') {
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments[0] === 'video') {
      contentId = segments[1] ?? null;
    }
  }

  if (!contentId || !/^\d+$/.test(contentId)) {
    return { ok: false, code: 'unsupported_platform', message: 'Could not resolve Vimeo video id from URL' };
  }

  const canonicalUrl = `https://vimeo.com/${contentId}`;
  return {
    ok: true,
    data: {
      canonicalUrl,
      originalUrl,
      platform: 'vimeo',
      platformContentId: contentId,
    },
  };
}

function detectPlatform(parsed: URL): 'youtube' | 'vimeo' | null {
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'youtube.com'
    || host === 'www.youtube.com'
    || host === 'm.youtube.com'
    || host === 'youtu.be'
    || host === 'music.youtube.com'
  ) {
    return 'youtube';
  }
  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    return 'vimeo';
  }
  return null;
}

/** Pure URL normalization — no outbound fetch. */
export function normalizeUrl(rawUrl: string, maxLength = 2048): UrlNormalizationResult {
  if (rawUrl.trim().length > maxLength) {
    return { ok: false, code: 'invalid_url', message: 'URL exceeds maximum length' };
  }

  const parsed = parseHttpUrl(rawUrl);
  if (!parsed) {
    return { ok: false, code: 'invalid_url', message: 'URL must be a valid http(s) address' };
  }

  const cleaned = stripTrackingParams(parsed);
  const platform = detectPlatform(cleaned);
  const originalUrl = cleaned.toString();

  if (platform === 'youtube') {
    return normalizeYouTube(cleaned, originalUrl);
  }
  if (platform === 'vimeo') {
    return normalizeVimeo(cleaned, originalUrl);
  }

  return { ok: false, code: 'unsupported_platform', message: 'Platform is not supported' };
}
