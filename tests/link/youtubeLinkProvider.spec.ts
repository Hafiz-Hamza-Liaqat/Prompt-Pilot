import { describe, expect, it } from 'vitest';
import { createYouTubeLinkProvider } from '../../src/server/link/youtube-link-provider.js';

describe('YouTubeLinkProvider', () => {
  it('maps oEmbed responses to provider metadata without raw payload leakage', async () => {
    const provider = createYouTubeLinkProvider({
      fetchOEmbed: async () => ({
        title: 'Sample Video',
        author_name: 'Sample Channel',
        thumbnail_url: 'https://i.ytimg.com/vi/test/hqdefault.jpg',
        width: 1920,
        height: 1080,
      }),
    });

    const result = await provider.fetchMetadata({
      normalized: {
        canonicalUrl: 'https://www.youtube.com/watch?v=test1234567',
        originalUrl: 'https://www.youtube.com/watch?v=test1234567',
        platform: 'youtube',
        platformContentId: 'test1234567',
      },
      ownerScope: { ownerId: 'owner-001', projectId: 'project-001' },
      requestedAt: '2026-07-06T15:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.title).toBe('Sample Video');
      expect(result.extractionMethod).toBe('oembed');
      expect(result.payload).not.toHaveProperty('html');
    }
  });
});
