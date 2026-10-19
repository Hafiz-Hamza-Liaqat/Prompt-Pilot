import { LINK_INTELLIGENCE_CONFIG } from './config.js';
import { assertFetchAllowed } from './security-gate.js';
import { assertResolvedHostSafe, type HostAddressResolver } from './secure-host.js';

export type SecureFetchResult =
  | { ok: true; status: number; body: string }
  | { ok: false; code: 'policy_blocked' | 'invalid_url' | 'storage_error'; message: string };

export type SecureFetchOptions = {
  resolve?: HostAddressResolver;
  maxRedirects?: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
  fetchImpl?: typeof fetch;
};

/** Fetch with HTTPS-only redirect validation and DNS rebinding checks. */
export async function secureFetch(
  urlString: string,
  options: SecureFetchOptions = {},
): Promise<SecureFetchResult> {
  const {
    resolve,
    maxRedirects = 3,
    timeoutMs = LINK_INTELLIGENCE_CONFIG.fetchTimeoutMs,
    maxResponseBytes = LINK_INTELLIGENCE_CONFIG.maxResponseBytes,
    fetchImpl = fetch,
  } = options;

  let currentUrl = urlString;

  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const allowed = assertFetchAllowed(currentUrl);
    if (!allowed.ok) {
      return allowed;
    }

    const parsed = new URL(currentUrl);
    const dns = await assertResolvedHostSafe(parsed.hostname, resolve);
    if (!dns.ok) {
      return dns;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(currentUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        redirect: 'manual',
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location || hop >= maxRedirects) {
          return {
            ok: false,
            code: 'policy_blocked',
            message: 'Redirect limit exceeded or missing location header',
          };
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        return {
          ok: false,
          code: 'storage_error',
          message: `Request failed with status ${response.status}`,
        };
      }

      const body = await response.text();
      if (body.length > maxResponseBytes) {
        return { ok: false, code: 'storage_error', message: 'Response too large' };
      }

      return { ok: true, status: response.status, body };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Secure fetch failed';
      const isTimeout = message.includes('abort') || message.toLowerCase().includes('timeout');
      return {
        ok: false,
        code: isTimeout ? 'storage_error' : 'storage_error',
        message,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, code: 'policy_blocked', message: 'Redirect validation failed' };
}
