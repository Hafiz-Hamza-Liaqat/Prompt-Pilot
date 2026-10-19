import { describe, expect, it } from 'vitest';
import { createLinkIntelligencePort } from '../../src/server/link/link-intelligence-port-adapter.js';
import type { LinkIntelligenceCoordinator } from '../../src/server/link/link-intelligence-coordinator.js';

function createStubCoordinator(
  analyzeLink: LinkIntelligenceCoordinator['analyzeLink'],
): LinkIntelligenceCoordinator {
  return { analyzeLink } as LinkIntelligenceCoordinator;
}

describe('createLinkIntelligencePort', () => {
  it('preserves canonical job failure codes on coordinator errors', async () => {
    const port = createLinkIntelligencePort(
      createStubCoordinator(async () => ({
        ok: false,
        code: 'private_content',
        message: 'Video is private',
      })),
    );

    const result = await port.analyze({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceKind: 'youtube_url',
      rawUrl: 'https://www.youtube.com/watch?v=abc',
      requestedAt: '2026-07-06T15:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('validation_error');
      expect(result.error.jobFailureCode).toBe('private_content');
      expect(result.error.stageId).toBe('link_intelligence');
    }
  });

  it('maps unknown coordinator codes to invalid_url', async () => {
    const port = createLinkIntelligencePort(
      createStubCoordinator(async () => ({
        ok: false,
        code: 'unknown_internal',
        message: 'Unexpected',
      })),
    );

    const result = await port.analyze({
      jobId: 'job-001',
      referenceId: 'ref-001',
      projectId: 'project-001',
      ownerId: 'owner-001',
      referenceKind: 'youtube_url',
      rawUrl: 'https://www.youtube.com/watch?v=abc',
      requestedAt: '2026-07-06T15:00:00.000Z',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.jobFailureCode).toBe('invalid_url');
    }
  });
});
