import { describe, expect, it } from 'vitest';
import { providerCataloguePublicCopy } from '../../src/config/providerCatalogue.js';

const STALE_DISCLAIMER = 'Provider recommendation is not implemented in this release.';

describe('provider catalogue public copy', () => {
  it('does not claim recommendations are unimplemented', () => {
    const corpus = Object.values(providerCataloguePublicCopy).join(' ');
    expect(corpus).not.toContain(STALE_DISCLAIMER);
    expect(corpus.toLowerCase()).not.toContain('not implemented in this release');
  });

  it('states the public catalogue does not rank providers', () => {
    expect(providerCataloguePublicCopy.disclaimerBody.toLowerCase()).toContain('does not rank providers');
  });

  it('describes workspace recommendation availability accurately', () => {
    const body = providerCataloguePublicCopy.disclaimerBody.toLowerCase();
    expect(body).toContain('evidence-backed recommendations');
    expect(body).toContain('authenticated project workspaces');
    expect(body).toContain('video brief is marked ready');
  });

  it('does not claim Prompt Pilot generates media', () => {
    const corpus = Object.values(providerCataloguePublicCopy).join(' ').toLowerCase();
    expect(corpus).not.toMatch(/generates (images|videos)/);
    expect(corpus).not.toMatch(/generate (images|videos)/);
    expect(corpus).not.toMatch(/render videos/);
  });

  it('does not claim a best provider on the public catalogue page', () => {
    const corpus = Object.values(providerCataloguePublicCopy).join(' ').toLowerCase();
    expect(corpus).not.toContain('best provider');
    expect(corpus).not.toContain('perfect match');
    expect(corpus).not.toMatch(/recommend a best provider/);
  });
});
