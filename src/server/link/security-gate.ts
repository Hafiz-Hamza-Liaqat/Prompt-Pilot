import { BLOCKED_FETCH_HOSTS, VIMEO_ALLOWED_HOSTS, YOUTUBE_ALLOWED_HOSTS } from './config.js';

export type SecurityVerdict =
  | { ok: true }
  | { ok: false; code: 'policy_blocked' | 'invalid_url'; message: string };

function isPrivateIpv4Host(host: string): boolean {
  if (/^10\./.test(host)) {
    return true;
  }
  if (/^192\.168\./.test(host)) {
    return true;
  }
  const match = /^172\.(\d+)\./.exec(host);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_FETCH_HOSTS.has(host)) {
    return true;
  }
  if (host.endsWith('.local') || host.endsWith('.internal')) {
    return true;
  }
  if (isPrivateIpv4Host(host)) {
    return true;
  }
  return false;
}

function isAllowedPlatformHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return YOUTUBE_ALLOWED_HOSTS.has(host) || YOUTUBE_ALLOWED_HOSTS.has(hostname.toLowerCase())
    || VIMEO_ALLOWED_HOSTS.has(host) || VIMEO_ALLOWED_HOSTS.has(hostname.toLowerCase());
}

/** SSRF guard — validates URLs before any outbound provider fetch (G-25). */
export function assertFetchAllowed(urlString: string): SecurityVerdict {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { ok: false, code: 'invalid_url', message: 'URL is not parseable' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, code: 'policy_blocked', message: 'Only https URLs are allowed' };
  }

  if (isBlockedHost(parsed.hostname)) {
    return { ok: false, code: 'policy_blocked', message: 'URL host is not allowed' };
  }

  if (!isAllowedPlatformHost(parsed.hostname)) {
    return { ok: false, code: 'policy_blocked', message: 'URL host is not on the platform allowlist' };
  }

  return { ok: true };
}
