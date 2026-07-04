import { describe, expect, it } from 'vitest';
import { buildProtectedRedirectPath, sanitizeRedirectPath } from '../../src/domain/auth.js';

describe('require-user contract helpers', () => {
  it('builds safe protected redirect paths', () => {
    expect(buildProtectedRedirectPath('/projects')).toBe('/projects');
    expect(buildProtectedRedirectPath('/projects/abc')).toBe('/projects/abc');
  });

  it('rejects external redirect paths for protected routes', () => {
    expect(buildProtectedRedirectPath('https://evil.example')).toBe('/projects');
    expect(sanitizeRedirectPath('//evil.example')).toBe('/account');
  });

  it('never trusts form-supplied owner identifiers in redirect helpers', () => {
    expect(buildProtectedRedirectPath('/projects?owner=other-user')).toBe(
      '/projects?owner=other-user',
    );
  });
});
