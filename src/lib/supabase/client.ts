import { createBrowserClient } from '@supabase/ssr';
import { parseSupabaseEnv } from '@/config/supabase-env';
import type { Database } from '@/types/database';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    const { url, publishableKey } = parseSupabaseEnv();
    browserClient = createBrowserClient<Database>(url, publishableKey);
  }

  return browserClient;
}
