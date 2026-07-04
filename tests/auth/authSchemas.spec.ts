import { describe, expect, it } from 'vitest';
import {
  parseSignInFormData,
  parseSignUpFormData,
  signInCredentialsSchema,
  signUpCredentialsSchema,
} from '../../src/domain/auth.js';

describe('signInCredentialsSchema', () => {
  it('accepts valid email', () => {
    expect(
      signInCredentialsSchema.parse({
        email: 'creator@example.com',
        password: 'secret',
      }),
    ).toEqual({
      email: 'creator@example.com',
      password: 'secret',
    });
  });

  it('rejects invalid email', () => {
    expect(() =>
      signInCredentialsSchema.parse({
        email: 'not-an-email',
        password: 'secret',
      }),
    ).toThrow();
  });
});

describe('signUpCredentialsSchema', () => {
  it('rejects short passwords', () => {
    expect(() =>
      signUpCredentialsSchema.parse({
        email: 'creator@example.com',
        password: 'short',
        displayName: 'Creator',
      }),
    ).toThrow();
  });

  it('rejects passwords over 72 characters', () => {
    expect(() =>
      signUpCredentialsSchema.parse({
        email: 'creator@example.com',
        password: 'a'.repeat(73),
        displayName: 'Creator',
      }),
    ).toThrow();
  });

  it('accepts valid display names', () => {
    expect(
      signUpCredentialsSchema.parse({
        email: 'creator@example.com',
        password: 'validpass',
        displayName: '  Creator Name  ',
      }).displayName,
    ).toBe('Creator Name');
  });

  it('rejects empty display names', () => {
    expect(() =>
      signUpCredentialsSchema.parse({
        email: 'creator@example.com',
        password: 'validpass',
        displayName: '  ',
      }),
    ).toThrow();
  });

  it('rejects overlong display names', () => {
    expect(() =>
      signUpCredentialsSchema.parse({
        email: 'creator@example.com',
        password: 'validpass',
        displayName: 'a'.repeat(81),
      }),
    ).toThrow();
  });
});

describe('auth form parsers', () => {
  it('does not trim passwords during sign-in parsing', () => {
    const formData = new FormData();
    formData.set('email', 'creator@example.com');
    formData.set('password', ' secret ');

    expect(parseSignInFormData(formData).password).toBe(' secret ');
  });

  it('parses sign-up form data', () => {
    const formData = new FormData();
    formData.set('email', 'creator@example.com');
    formData.set('password', 'validpass');
    formData.set('displayName', 'Creator');

    expect(parseSignUpFormData(formData)).toEqual({
      email: 'creator@example.com',
      password: 'validpass',
      displayName: 'Creator',
    });
  });
});
