import { z } from 'zod';

const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .trim()
    .url({ message: 'Supabase URL must be a valid HTTP or HTTPS URL.' }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(1, 'Supabase publishable key is required.'),
});

export type SupabaseEnv = Readonly<{
  url: string;
  publishableKey: string;
}>;

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigurationError';
  }
}

export function parseSupabaseEnv(
  input: Record<string, string | undefined> = {},
): SupabaseEnv {
  const source = {
    NEXT_PUBLIC_SUPABASE_URL:
      input.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };

  const result = supabaseEnvSchema.safeParse(source);

  if (!result.success) {
    const issue = result.error.issues[0]?.message ?? 'Invalid Supabase configuration.';
    throw new SupabaseConfigurationError(issue);
  }

  return {
    url: result.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
