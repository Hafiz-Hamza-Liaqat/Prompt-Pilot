import { describe, expect, it } from 'vitest';
import { siteConfig } from '../../src/config/site.js';

describe('siteConfig', () => {
  it('uses the exact product name Prompt Pilot', () => {
    expect(siteConfig.name).toBe('Prompt Pilot');
    expect(siteConfig.title).toBe('Prompt Pilot');
  });

  it('uses the package-safe slug prompt-pilot', () => {
    expect(siteConfig.slug).toBe('prompt-pilot');
  });

  it('declares generatesVideos as false', () => {
    expect(siteConfig.capabilities.generatesVideos).toBe(false);
  });

  it('declares generatesImages as false', () => {
    expect(siteConfig.capabilities.generatesImages).toBe(false);
  });

  it('has a non-empty description', () => {
    expect(siteConfig.description.trim().length).toBeGreaterThan(0);
  });

  it('does not claim that Prompt Pilot generates videos', () => {
    const lower = siteConfig.description.toLowerCase();
    expect(lower).not.toMatch(/(?<!\bnot )generates? videos\b/);
    expect(lower).toMatch(/does not generate videos/);
  });

  it('does not claim that Prompt Pilot generates images', () => {
    const lower = siteConfig.description.toLowerCase();
    expect(lower).not.toMatch(/(?<!\bnot )generates? images\b/);
    expect(lower).toMatch(/does not generate images/);
  });
});
