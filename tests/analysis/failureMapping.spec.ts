import { describe, expect, it } from 'vitest';
import {
  mapCacheErrorToCoordinatorCode,
  mapPersistenceErrorToCoordinatorCode,
  mapProviderErrorToCoordinatorCode,
} from '../../src/server/analysis/failure-mapping.js';

describe('analysis failure mapping', () => {
  it('maps scope_violation to policy_blocked explicitly', () => {
    expect(mapPersistenceErrorToCoordinatorCode('scope_violation')).toEqual({
      code: 'policy_blocked',
      retryable: false,
    });
  });

  it('maps persistence_error to storage_error', () => {
    expect(mapPersistenceErrorToCoordinatorCode('persistence_error')).toEqual({
      code: 'storage_error',
      retryable: true,
    });
  });

  it('passes through provider transcription_failed', () => {
    expect(mapProviderErrorToCoordinatorCode('transcription_failed')).toEqual({
      code: 'transcription_failed',
      retryable: false,
    });
  });

  it('defaults unknown provider codes to analysis_failed', () => {
    expect(mapProviderErrorToCoordinatorCode('unknown_provider_issue')).toEqual({
      code: 'analysis_failed',
      retryable: false,
    });
  });

  it('maps cache storage_error with retryable default', () => {
    expect(mapCacheErrorToCoordinatorCode('storage_error')).toEqual({
      code: 'storage_error',
      retryable: true,
    });
  });
});
