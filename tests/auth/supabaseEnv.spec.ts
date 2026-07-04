import { describe, expect, it } from 'vitest';
import {
  parseSupabaseEnv,
  SupabaseConfigurationError,
} from '../../src/config/supabase-env.js';

describe('parseSupabaseEnv', () => {
  it('accepts valid configuration', () => {
    const env = parseSupabaseEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-key-value',
    });

    expect(env.url).toBe('http://127.0.0.1:54321');
    expect(env.publishableKey).toBe('public-key-value');
  });

  it('rejects invalid URLs', () => {
    expect(() =>
      parseSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-key-value',
      }),
    ).toThrow(SupabaseConfigurationError);
  });

  it('rejects empty publishable keys', () => {
    expect(() =>
      parseSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '   ',
      }),
    ).toThrow(SupabaseConfigurationError);
  });

  it('does not expose the full key in error messages', () => {
    try {
      parseSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SupabaseConfigurationError);
      expect((error as Error).message).not.toContain('sb_');
    }
  });
});
