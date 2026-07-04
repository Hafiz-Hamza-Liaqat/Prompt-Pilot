import { describe, expect, it } from 'vitest';
import { sanitizeRedirectPath } from '../../src/domain/auth.js';

describe('sanitizeRedirectPath', () => {
  it('accepts local routes', () => {
    expect(sanitizeRedirectPath('/account')).toBe('/account');
  });

  it('accepts local routes with query strings', () => {
    expect(sanitizeRedirectPath('/account?tab=profile')).toBe('/account?tab=profile');
  });

  it('rejects external URLs', () => {
    expect(sanitizeRedirectPath('https://example.com/account')).toBe('/account');
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeRedirectPath('//example.com/account')).toBe('/account');
  });

  it('rejects backslash redirects', () => {
    expect(sanitizeRedirectPath('/account\\evil')).toBe('/account');
  });

  it('falls back safely for empty redirects', () => {
    expect(sanitizeRedirectPath('')).toBe('/account');
    expect(sanitizeRedirectPath(undefined)).toBe('/account');
  });
});
