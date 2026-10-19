import { describe, expect, it, vi } from 'vitest';
import { secureFetch } from '../../src/server/link/secure-fetch.js';

describe('secureFetch', () => {
  it('follows redirects after re-validating target URL', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce({
        status: 302,
        ok: false,
        headers: { get: (name: string) => (name === 'location' ? 'https://www.youtube.com/oembed?url=x&format=json' : null) },
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        text: async () => '{"title":"ok"}',
      });

    const result = await secureFetch('https://www.youtube.com/oembed?url=start&format=json', {
      fetchImpl,
      resolve: async () => ['93.184.216.34'],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body).toContain('ok');
    }
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('blocks redirects to non-allowlisted hosts', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce({
      status: 302,
      ok: false,
      headers: { get: () => 'https://evil.example/steal' },
    });

    const result = await secureFetch('https://www.youtube.com/oembed?url=start&format=json', {
      fetchImpl,
      resolve: async () => ['93.184.216.34'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('policy_blocked');
    }
  });

  it('blocks http URLs', async () => {
    const result = await secureFetch('http://www.youtube.com/watch?v=abc', {
      fetchImpl: vi.fn(),
      resolve: async () => ['93.184.216.34'],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('policy_blocked');
    }
  });
});
