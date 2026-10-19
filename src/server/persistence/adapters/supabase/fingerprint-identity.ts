import type { FingerprintInputDescriptor } from '@/domain/canonical';

export function buildIdentityDescriptor(inputs: FingerprintInputDescriptor[]): string {
  const normalized = [...inputs]
    .map((entry) => ({ factor: entry.factor, descriptor: entry.descriptor }))
    .sort((left, right) => left.factor.localeCompare(right.factor));

  return JSON.stringify(normalized);
}

export function buildCacheLookupKey(
  fingerprintId: string,
  fingerprintAlgorithmVersion: number,
  scopeUserId: string,
): string {
  return `${scopeUserId}:${fingerprintId}:v${fingerprintAlgorithmVersion}`;
}
