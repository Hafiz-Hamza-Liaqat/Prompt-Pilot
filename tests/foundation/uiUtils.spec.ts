import { describe, expect, it } from 'vitest';
import { cn } from '../../src/lib/utils.js';

describe('cn', () => {
  it('joins ordinary class names', () => {
    expect(cn('px-2', 'py-1', 'text-sm')).toBe('px-2 py-1 text-sm');
  });

  it('ignores false, null, and undefined values', () => {
    expect(cn('px-2', false && 'hidden', null, undefined, 'py-1')).toBe('px-2 py-1');
  });

  it('resolves conflicting Tailwind spacing classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('resolves conflicting Tailwind colour classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
