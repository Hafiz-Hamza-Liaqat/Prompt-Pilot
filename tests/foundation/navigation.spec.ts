import { describe, expect, it } from 'vitest';
import { publicNavigation } from '../../src/config/navigation.js';

describe('publicNavigation', () => {
  it('has exactly three navigation items', () => {
    expect(publicNavigation).toHaveLength(3);
  });

  it('has non-empty labels', () => {
    for (const item of publicNavigation) {
      expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('has non-empty hrefs', () => {
    for (const item of publicNavigation) {
      expect(item.href.trim().length).toBeGreaterThan(0);
    }
  });

  it('targets local sections only', () => {
    for (const item of publicNavigation) {
      expect(item.href.startsWith('#')).toBe(true);
    }
  });

  it('does not use placeholder hash-only links', () => {
    for (const item of publicNavigation) {
      expect(item.href).not.toBe('#');
    }
  });

  it('has unique labels', () => {
    const labels = publicNavigation.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('has unique hrefs', () => {
    const hrefs = publicNavigation.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('includes required section targets', () => {
    const hrefs = publicNavigation.map((item) => item.href);
    expect(hrefs).toContain('#workflow');
    expect(hrefs).toContain('#capabilities');
    expect(hrefs).toContain('#scope');
  });
});
