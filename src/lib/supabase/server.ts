import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { parseSupabaseEnv } from '@/config/supabase-env';
import type { Database } from '@/types/database';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = parseSupabaseEnv();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies; proxy handles refresh.
        }
      },
    },
  });
}
