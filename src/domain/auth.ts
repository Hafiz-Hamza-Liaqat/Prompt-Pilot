import { z } from 'zod';

export const signInCredentialsSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const signUpCredentialsSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be 72 characters or fewer.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters.')
    .max(80, 'Display name must be 80 characters or fewer.'),
});

export type SignInCredentials = z.infer<typeof signInCredentialsSchema>;
export type SignUpCredentials = z.infer<typeof signUpCredentialsSchema>;

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

export function sanitizeRedirectPath(
  input: string | null | undefined,
  fallback = '/account',
): string {
  if (!input) {
    return fallback;
  }

  const value = input.trim();

  if (
    value.length === 0 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    CONTROL_CHAR_PATTERN.test(value) ||
    /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value)
  ) {
    return fallback;
  }

  return value;
}

export const AUTH_ERROR_CODES = {
  invalidCredentials: 'invalid-credentials',
  validationFailed: 'validation-failed',
  signUpFailed: 'sign-up-failed',
  callbackFailed: 'callback-failed',
  configuration: 'configuration',
} as const;

export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export const AUTH_NOTICE_CODES = {
  checkEmail: 'check-email',
} as const;

export type AuthNoticeCode =
  (typeof AUTH_NOTICE_CODES)[keyof typeof AUTH_NOTICE_CODES];

export function parseSignInFormData(formData: FormData) {
  return signInCredentialsSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
}

export function parseSignUpFormData(formData: FormData) {
  return signUpCredentialsSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  });
}

export function isAuthErrorCode(value: string | null | undefined): value is AuthErrorCode {
  if (!value) {
    return false;
  }

  return Object.values(AUTH_ERROR_CODES).includes(value as AuthErrorCode);
}

export function isAuthNoticeCode(
  value: string | null | undefined,
): value is AuthNoticeCode {
  if (!value) {
    return false;
  }

  return Object.values(AUTH_NOTICE_CODES).includes(value as AuthNoticeCode);
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  'invalid-credentials': 'Email or password is incorrect.',
  'validation-failed': 'Check the form fields and try again.',
  'sign-up-failed': 'Unable to create an account with those details.',
  'callback-failed': 'Sign-in could not be completed. Try again.',
  configuration: 'Authentication is not configured correctly.',
};

export const AUTH_NOTICE_MESSAGES: Record<AuthNoticeCode, string> = {
  'check-email': 'Check your email to confirm your account before signing in.',
};
