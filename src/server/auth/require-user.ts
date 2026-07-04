import { redirect } from 'next/navigation';
import { sanitizeRedirectPath } from '@/domain/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type TrustedUser = {
  id: string;
  email: string | undefined;
};

export type RequireUserResult =
  | { ok: true; user: TrustedUser }
  | { ok: false; status: 'not_authenticated' };

export async function requireUser(options?: {
  redirectTo?: string;
}): Promise<TrustedUser> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = sanitizeRedirectPath(options?.redirectTo ?? '/projects');
    redirect(`/auth/sign-in?next=${encodeURIComponent(next)}`);
  }

  return {
    id: user.id,
    email: user.email,
  };
}

export async function requireUserResult(): Promise<RequireUserResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 'not_authenticated' };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
    },
  };
}
