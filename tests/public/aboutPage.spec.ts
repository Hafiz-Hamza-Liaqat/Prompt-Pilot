import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const aboutSource = readFileSync(
  path.resolve(import.meta.dirname, '../../src/app/about/page.tsx'),
  'utf8',
);

describe('about page', () => {
  it('describes Prompt Pilot as a video-production planning platform', () => {
    expect(aboutSource.toLowerCase()).toContain('video-production');
    expect(aboutSource.toLowerCase()).toContain('planning');
  });

  it('mentions deterministic scene timing and assessments', () => {
    expect(aboutSource.toLowerCase()).toContain('deterministic');
    expect(aboutSource.toLowerCase()).toContain('scene timing');
    expect(aboutSource.toLowerCase()).toContain('complexity');
    expect(aboutSource.toLowerCase()).toContain('execution-risk');
  });

  it('mentions source-backed provider information and recommendations', () => {
    expect(aboutSource.toLowerCase()).toContain('source-backed');
    expect(aboutSource.toLowerCase()).toContain('provider recommendations');
  });

  it('states Prompt Pilot does not generate media', () => {
    expect(aboutSource.toLowerCase()).toMatch(/does not generate/);
    expect(aboutSource.toLowerCase()).toMatch(/does not render media/);
  });

  it('does not fabricate company history or team details', () => {
    expect(aboutSource.toLowerCase()).not.toContain('founded in');
    expect(aboutSource.toLowerCase()).not.toContain('our team');
    expect(aboutSource.toLowerCase()).not.toContain('funding');
    expect(aboutSource.toLowerCase()).not.toContain('headquarters');
  });

  it('does not claim image or video generation', () => {
    const lower = aboutSource.toLowerCase();
    expect(lower).not.toMatch(/generates videos/);
    expect(lower).not.toMatch(/generates images/);
  });
});
