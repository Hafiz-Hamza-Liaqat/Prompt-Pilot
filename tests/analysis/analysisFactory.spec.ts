import { describe, expect, it } from 'vitest';
import type { EntityId } from '../../src/domain/canonical/primitives.js';
import type { LinkMetadata } from '../../src/domain/link/index.js';
import { createAnalysisStack } from '../../src/server/analysis/analysis-factory.js';
import { createMockAnalysisProvider } from '../../src/server/analysis/mock-analysis-provider.js';
import {
  InMemoryAnalysisRepository,
  InMemoryCacheRepository,
  TEST_FINGERPRINT,
  TEST_TIMESTAMP,
} from '../cache/test-doubles.js';

const ANALYSIS_ID = 'analysis-factory-001' as EntityId;

function sampleLinkMetadata(): LinkMetadata {
  return {
    linkMetadataId: 'link-meta-001' as EntityId,
    referenceId: 'reference-001' as EntityId,
    projectId: 'project-001' as EntityId,
    ownerId: 'owner-001' as EntityId,
    referenceKind: 'youtube_url',
    platform: 'youtube',
    platformContentId: 'dQw4w9WgXcQ',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Sample video',
    durationSeconds: 120,
    accessStatus: 'public',
    providerId: 'mock',
    extractionMethod: 'mock',
    extractedAt: TEST_TIMESTAMP,
    linkMetadataVersion: '1.0.0',
  };
}

describe('createAnalysisStack', () => {
  it('wires coordinator, mock provider, and analysis port', () => {
    const stack = createAnalysisStack({
      analysisRepository: new InMemoryAnalysisRepository(),
      cacheRepository: new InMemoryCacheRepository(),
      resolvePortInput: () => ({
        referenceKind: 'youtube_url',
        fingerprintId: TEST_FINGERPRINT.fingerprintId,
        fingerprintAlgorithmVersion: TEST_FINGERPRINT.fingerprintAlgorithmVersion,
        intake: {},
        intakeOverride: { linkMetadata: sampleLinkMetadata() },
      }),
      idGenerator: () => ANALYSIS_ID,
    });

    expect(stack.coordinator).toBeDefined();
    expect(stack.provider.providerId).toBe('mock');
    expect(stack.port.providerId).toBe('mock');
  });

  it('uses injected provider when supplied', () => {
    const customProvider = createMockAnalysisProvider();
    const stack = createAnalysisStack({
      analysisRepository: new InMemoryAnalysisRepository(),
      cacheRepository: new InMemoryCacheRepository(),
      provider: customProvider,
      resolvePortInput: () => ({
        referenceKind: 'youtube_url',
        fingerprintId: TEST_FINGERPRINT.fingerprintId,
        fingerprintAlgorithmVersion: TEST_FINGERPRINT.fingerprintAlgorithmVersion,
        intake: {},
        intakeOverride: { linkMetadata: sampleLinkMetadata() },
      }),
    });

    expect(stack.provider).toBe(customProvider);
    expect(stack.port.providerId).toBe('mock');
  });

  it('executes analysis through the port with injected resolver input', async () => {
    const stack = createAnalysisStack({
      analysisRepository: new InMemoryAnalysisRepository(),
      cacheRepository: new InMemoryCacheRepository(),
      resolvePortInput: () => ({
        referenceKind: 'youtube_url',
        fingerprintId: TEST_FINGERPRINT.fingerprintId,
        fingerprintAlgorithmVersion: TEST_FINGERPRINT.fingerprintAlgorithmVersion,
        intake: {},
        intakeOverride: { linkMetadata: sampleLinkMetadata() },
      }),
      idGenerator: () => ANALYSIS_ID,
    });

    const result = await stack.port.analyze({
      jobId: 'job-001',
      referenceId: 'reference-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      requestedAt: TEST_TIMESTAMP,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.analysisId).toBe(ANALYSIS_ID);
      expect(result.data.completedAt).toBe(TEST_TIMESTAMP);
    }
  });
});
