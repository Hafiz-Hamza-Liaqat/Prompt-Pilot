import { NextResponse } from 'next/server';
import { AUTH_ERROR_CODES, sanitizeRedirectPath } from '@/domain/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = sanitizeRedirectPath(requestUrl.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(
      new URL(`/auth/error?error=${AUTH_ERROR_CODES.callbackFailed}`, requestUrl.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/error?error=${AUTH_ERROR_CODES.callbackFailed}`, requestUrl.origin),
    );
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
