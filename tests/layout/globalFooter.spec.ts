import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getFooterNavigationGroups,
  getValidatedXProfileUrl,
  OFFICIAL_X_PROFILE_URL,
  publicSiteConfig,
} from '../../src/config/public-site.js';

const repoRoot = path.resolve(import.meta.dirname, '../..');

function readSource(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('global footer configuration', () => {
  it('defines product name and public description', () => {
    expect(publicSiteConfig.productName).toBe('Prompt Pilot');
    expect(publicSiteConfig.publicDescription).toContain('without generating media');
  });

  it('links Workflow to /#workflow', () => {
    const hrefs = publicSiteConfig.footerNavigation.platform.map((link) => link.href);
    expect(hrefs).toContain('/#workflow');
  });

  it('links Capabilities to /#capabilities', () => {
    const hrefs = publicSiteConfig.footerNavigation.platform.map((link) => link.href);
    expect(hrefs).toContain('/#capabilities');
  });

  it('links Scope to /#scope', () => {
    const hrefs = publicSiteConfig.footerNavigation.platform.map((link) => link.href);
    expect(hrefs).toContain('/#scope');
  });

  it('links Providers to /providers', () => {
    const hrefs = publicSiteConfig.footerNavigation.platform.map((link) => link.href);
    expect(hrefs).toContain('/providers');
  });

  it('links About Us to /about', () => {
    const hrefs = publicSiteConfig.footerNavigation.company.map((link) => link.href);
    expect(hrefs).toContain('/about');
  });

  it('links Support / Help to /support', () => {
    const hrefs = publicSiteConfig.footerNavigation.help.map((link) => link.href);
    expect(hrefs).toContain('/support');
  });

  it('links News Feed to /news', () => {
    const hrefs = publicSiteConfig.footerNavigation.company.map((link) => link.href);
    expect(hrefs).toContain('/news');
  });

  it('omits placeholder X profile when OFFICIAL_X_PROFILE_URL is unset', () => {
    expect(OFFICIAL_X_PROFILE_URL).toBeNull();
    expect(getValidatedXProfileUrl()).toBeNull();
    const groupTitles = getFooterNavigationGroups().map((group) => group.title);
    expect(groupTitles).not.toContain('Social');
  });

  it('uses accessible footer link labels', () => {
    for (const group of getFooterNavigationGroups()) {
      for (const link of group.links) {
        expect(link.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('does not use hash-only or empty footer hrefs', () => {
    for (const group of getFooterNavigationGroups()) {
      for (const link of group.links) {
        expect(link.href).not.toBe('#');
        expect(link.href.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('global footer component', () => {
  const footerSource = readSource('src/components/layout/site-footer.tsx');
  const rootLayoutSource = readSource('src/app/layout.tsx');
  const projectsLayoutSource = readSource('src/app/projects/layout.tsx');

  it('is rendered through the root layout', () => {
    expect(rootLayoutSource).toContain('<SiteFooter />');
  });

  it('does not render twice on protected project pages', () => {
    expect(projectsLayoutSource).not.toContain('SiteFooter');
    expect(projectsLayoutSource).not.toContain('site-footer');
  });

  it('uses footer and footer navigation landmarks', () => {
    expect(footerSource).toContain('<footer');
    expect(footerSource).toContain('aria-label="Footer navigation"');
  });

  it('uses safe external-link attributes for X when configured', () => {
    expect(footerSource).toContain('target="_blank"');
    expect(footerSource).toContain('rel="noopener noreferrer"');
    expect(footerSource).toContain('opens in a new tab');
  });

  it('does not contain authenticated-only footer controls', () => {
    expect(footerSource.toLowerCase()).not.toContain('sign out');
    expect(footerSource).not.toMatch(/\buser\.id\b/);
    expect(footerSource).not.toMatch(/\btoken\b/i);
    expect(footerSource).not.toMatch(/href="\/projects"/);
  });

  it('does not use placeholder href="#" links', () => {
    expect(footerSource).not.toMatch(/href="#"/);
    expect(footerSource).not.toMatch(/href='#'/);
  });

  it('does not claim media generation in footer copy', () => {
    const lower = footerSource.toLowerCase();
    expect(lower).not.toMatch(/generates videos/);
    expect(lower).not.toMatch(/generates images/);
    expect(lower).toMatch(/does not generate videos or images/);
  });

  it('does not use a fixed or sticky mobile footer', () => {
    expect(footerSource).not.toMatch(/\bfixed\b/);
    expect(footerSource).not.toMatch(/\bsticky\b/);
  });
});

describe('global footer route coverage', () => {
  it('appears on public pages through root layout inheritance', () => {
    const rootLayoutSource = readSource('src/app/layout.tsx');
    expect(rootLayoutSource).toContain('<SiteFooter />');
    expect(rootLayoutSource).toContain('<SiteHeader />');

    const publicPagesWithMain = [
      'src/app/page.tsx',
      'src/app/auth/sign-in/page.tsx',
      'src/app/auth/sign-up/page.tsx',
      'src/app/about/page.tsx',
      'src/app/support/page.tsx',
      'src/app/news/page.tsx',
    ];

    for (const route of publicPagesWithMain) {
      expect(readSource(route)).toContain('main id="main-content"');
    }
  });

  it('appears on authentication pages through root layout inheritance', () => {
    expect(readSource('src/app/layout.tsx')).toContain('<SiteFooter />');
    expect(readSource('src/app/auth/sign-in/page.tsx')).toContain('main id="main-content"');
    expect(readSource('src/app/auth/sign-up/page.tsx')).toContain('main id="main-content"');
  });

  it('appears on project, brief, and workspace pages through root layout inheritance', () => {
    expect(readSource('src/app/layout.tsx')).toContain('<SiteFooter />');
    expect(readSource('src/app/projects/layout.tsx')).not.toContain('SiteFooter');

    const protectedPagesWithMain = [
      'src/app/projects/page.tsx',
      'src/app/projects/[projectId]/page.tsx',
      'src/app/projects/[projectId]/workspace/page.tsx',
    ];

    for (const route of protectedPagesWithMain) {
      expect(readSource(route)).toContain('main id="main-content"');
    }

    expect(readSource('src/components/briefs/brief-wizard-shell.tsx')).toContain(
      'main id="main-content"',
    );
  });
});
