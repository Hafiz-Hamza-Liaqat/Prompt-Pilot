'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  AUTH_ERROR_CODES,
  parseSignUpFormData,
  sanitizeRedirectPath,
  signInCredentialsSchema,
} from '@/domain/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function redirectToSignIn(errorCode: string, next?: string): never {
  const params = new URLSearchParams({ error: errorCode });
  const safeNext = sanitizeRedirectPath(next);

  if (safeNext !== '/account') {
    params.set('next', safeNext);
  }

  redirect(`/auth/sign-in?${params.toString()}`);
}

export async function signInAction(formData: FormData) {
  const next = sanitizeRedirectPath(formData.get('next')?.toString());

  const parsed = signInCredentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    redirectToSignIn(AUTH_ERROR_CODES.validationFailed, next);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirectToSignIn(AUTH_ERROR_CODES.invalidCredentials, next);
  }

  revalidatePath('/account');
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  let credentials;

  try {
    credentials = parseSignUpFormData(formData);
  } catch {
    redirect(`/auth/sign-up?error=${AUTH_ERROR_CODES.validationFailed}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials!.email,
    password: credentials!.password,
    options: {
      data: {
        display_name: credentials!.displayName,
      },
    },
  });

  if (error) {
    redirect(`/auth/sign-up?error=${AUTH_ERROR_CODES.signUpFailed}`);
  }

  if (data.session) {
    revalidatePath('/account');
    redirect('/account');
  }

  redirect(`/auth/sign-in?notice=check-email`);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/account');
  redirect('/');
}
