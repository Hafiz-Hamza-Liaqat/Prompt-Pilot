import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const newsSource = readFileSync(
  path.resolve(import.meta.dirname, '../../src/app/news/page.tsx'),
  'utf8',
);

describe('news page', () => {
  it('uses a truthful empty state for product updates', () => {
    expect(newsSource).toContain('No public updates have been published yet.');
  });

  it('uses semantic article structure for future updates', () => {
    expect(newsSource).toContain('<section');
    expect(newsSource).toContain('Product updates');
  });

  it('does not fabricate announcements', () => {
    const lower = newsSource.toLowerCase();
    expect(lower).not.toContain('partnership');
    expect(lower).not.toContain('funding round');
    expect(lower).not.toContain('release date');
    expect(lower).not.toContain('customer announcement');
  });

  it('does not claim image or video generation', () => {
    const lower = newsSource.toLowerCase();
    expect(lower).not.toMatch(/generates videos/);
    expect(lower).not.toMatch(/generates images/);
  });
});
