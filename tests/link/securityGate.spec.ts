import { describe, expect, it } from 'vitest';
import { assertFetchAllowed } from '../../src/server/link/security-gate.js';

describe('SecurityGate', () => {
  it('allows canonical YouTube URLs', () => {
    const verdict = assertFetchAllowed('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(verdict.ok).toBe(true);
  });

  it('blocks http URLs', () => {
    const verdict = assertFetchAllowed('http://www.youtube.com/watch?v=abc');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.code).toBe('policy_blocked');
    }
  });

  it('blocks localhost URLs', () => {
    const verdict = assertFetchAllowed('https://localhost/watch?v=abc');
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) {
      expect(verdict.code).toBe('policy_blocked');
    }
  });

  it('blocks private IP hosts', () => {
    const verdict = assertFetchAllowed('https://192.168.1.10/watch?v=abc');
    expect(verdict.ok).toBe(false);
  });

  it('blocks non-allowlisted hosts', () => {
    const verdict = assertFetchAllowed('https://evil.example/watch?v=abc');
    expect(verdict.ok).toBe(false);
  });
});
