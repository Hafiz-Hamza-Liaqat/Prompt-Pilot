import { describe, expect, it } from 'vitest';
import { normalizeUrl } from '../../src/server/link/url-normalizer.js';

describe('UrlNormalizer', () => {
  it('canonicalizes standard YouTube watch URLs', () => {
    const result = normalizeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=test');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.canonicalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.data.platformContentId).toBe('dQw4w9WgXcQ');
      expect(result.data.platform).toBe('youtube');
    }
  });

  it('canonicalizes youtu.be short links', () => {
    const result = normalizeUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.canonicalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }
  });

  it('canonicalizes YouTube shorts URLs', () => {
    const result = normalizeUrl('https://www.youtube.com/shorts/abc123XYZ_9');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.platformContentId).toBe('abc123XYZ_9');
    }
  });

  it('rejects unsupported platforms', () => {
    const result = normalizeUrl('https://example.com/video/123');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('unsupported_platform');
    }
  });

  it('rejects invalid URLs', () => {
    const result = normalizeUrl('not-a-url');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid_url');
    }
  });
});
