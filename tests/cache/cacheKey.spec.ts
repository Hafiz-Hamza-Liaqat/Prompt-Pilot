import { describe, expect, it } from 'vitest';
import { buildCacheKey } from '../../src/server/cache/cache-key.js';
import { buildCacheLookupKey } from '../../src/server/persistence/index.js';
import { TEST_FINGERPRINT, TEST_SCOPE } from './test-doubles.js';

describe('buildCacheKey', () => {
  it('matches PP-05C buildCacheLookupKey format', () => {
    const key = buildCacheKey({
      fingerprintId: TEST_FINGERPRINT.fingerprintId,
      fingerprintAlgorithmVersion: TEST_FINGERPRINT.fingerprintAlgorithmVersion,
      scopeUserId: TEST_SCOPE.ownerId,
    });

    expect(key).toBe(
      buildCacheLookupKey(
        TEST_FINGERPRINT.fingerprintId,
        TEST_FINGERPRINT.fingerprintAlgorithmVersion,
        TEST_SCOPE.ownerId,
      ),
    );
    expect(key).toBe(`${TEST_SCOPE.ownerId}:${TEST_FINGERPRINT.fingerprintId}:v1`);
  });

  it('changes when algorithm version changes (G-32)', () => {
    const v1 = buildCacheKey({
      ...TEST_FINGERPRINT,
      fingerprintAlgorithmVersion: 1,
      scopeUserId: TEST_SCOPE.ownerId,
    });
    const v2 = buildCacheKey({
      ...TEST_FINGERPRINT,
      fingerprintAlgorithmVersion: 2,
      scopeUserId: TEST_SCOPE.ownerId,
    });

    expect(v1).not.toBe(v2);
  });
});
