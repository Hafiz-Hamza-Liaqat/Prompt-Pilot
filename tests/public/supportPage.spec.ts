import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const supportSource = readFileSync(
  path.resolve(import.meta.dirname, '../../src/app/support/page.tsx'),
  'utf8',
);

describe('support page', () => {
  it('states direct support contact is not published yet', () => {
    expect(supportSource).toContain(
      'Direct support contact details have not been published yet.',
    );
  });

  it('covers account, project, brief, workspace, and sign-out guidance', () => {
    expect(supportSource).toContain('Creating an account');
    expect(supportSource).toContain('Creating and opening a project');
    expect(supportSource).toContain('Starting and continuing a brief');
    expect(supportSource).toContain('Draft and Ready brief states');
    expect(supportSource).toContain('Opening the result workspace');
    expect(supportSource).toContain('Scene timing, complexity, risk, and recommendations');
    expect(supportSource).toContain('Archived projects');
    expect(supportSource).toContain('Signing out');
  });

  it('does not publish fake contact mechanisms', () => {
    const lower = supportSource.toLowerCase();
    expect(lower).not.toContain('support@');
    expect(lower).not.toContain('phone:');
    expect(lower).not.toContain('live chat');
    expect(lower).not.toContain('ticket system');
    expect(lower).not.toMatch(/<form/);
  });

  it('does not claim image or video generation', () => {
    const lower = supportSource.toLowerCase();
    expect(lower).not.toMatch(/generates videos/);
    expect(lower).not.toMatch(/generates images/);
  });
});
