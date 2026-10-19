import { lookup } from 'node:dns/promises';
import { BLOCKED_FETCH_HOSTS } from './config.js';
import type { SecurityVerdict } from './security-gate.js';

export type HostAddressResolver = (hostname: string) => Promise<string[]>;

async function defaultResolve(hostname: string): Promise<string[]> {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((entry) => entry.address);
}

function isPrivateIpv4(address: string): boolean {
  if (address === '127.0.0.1' || address.startsWith('127.')) {
    return true;
  }
  if (address.startsWith('10.')) {
    return true;
  }
  if (address.startsWith('192.168.')) {
    return true;
  }
  const match = /^172\.(\d+)\./.exec(address);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  if (address.startsWith('169.254.')) {
    return true;
  }
  if (address === '0.0.0.0') {
    return true;
  }
  return false;
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === '::1' || normalized === '::') {
    return true;
  }
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return true;
  }
  if (normalized.startsWith('fe80:')) {
    return true;
  }
  return false;
}

function isBlockedResolvedAddress(address: string): boolean {
  if (address.includes(':')) {
    return isPrivateIpv6(address);
  }
  return isPrivateIpv4(address);
}

/** DNS rebinding guard — resolves hostname and rejects private/link-local targets. */
export async function assertResolvedHostSafe(
  hostname: string,
  resolve: HostAddressResolver = defaultResolve,
): Promise<SecurityVerdict> {
  const host = hostname.toLowerCase();
  if (BLOCKED_FETCH_HOSTS.has(host)) {
    return { ok: false, code: 'policy_blocked', message: 'URL host is not allowed' };
  }

  try {
    const addresses = await resolve(host);
    if (addresses.length === 0) {
      return { ok: false, code: 'invalid_url', message: 'Host could not be resolved' };
    }

    for (const address of addresses) {
      if (isBlockedResolvedAddress(address)) {
        return { ok: false, code: 'policy_blocked', message: 'Resolved host address is not allowed' };
      }
    }
  } catch {
    return { ok: false, code: 'invalid_url', message: 'Host could not be resolved' };
  }

  return { ok: true };
}
