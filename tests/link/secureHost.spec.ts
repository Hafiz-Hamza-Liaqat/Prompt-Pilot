import { describe, expect, it } from 'vitest';
import { assertResolvedHostSafe } from '../../src/server/link/secure-host.js';

describe('assertResolvedHostSafe', () => {
  it('allows public resolved addresses', async () => {
    const verdict = await assertResolvedHostSafe('example.com', async () => ['93.184.216.34']);
    expect(verdict.ok).toBe(true);
  });

  it('blocks private resolved IPv4 addresses', async () => {
    const verdict = await assertResolvedHostSafe('youtube.com', async () => ['192.168.1.1']);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.code).toBe('policy_blocked');
    }
  });

  it('blocks loopback resolved addresses', async () => {
    const verdict = await assertResolvedHostSafe('youtube.com', async () => ['127.0.0.1']);
    expect(verdict.ok).toBe(false);
  });

  it('blocks localhost hostname before resolution', async () => {
    const verdict = await assertResolvedHostSafe('localhost', async () => ['127.0.0.1']);
    expect(verdict.ok).toBe(false);
  });
});
