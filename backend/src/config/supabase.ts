import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const isLiveSupabaseConfigured =
  Boolean(env.SUPABASE_URL) &&
  !env.SUPABASE_URL.includes('placeholder') &&
  !env.SUPABASE_URL.includes('your-project-ref') &&
  Boolean(env.SUPABASE_SERVICE_ROLE_KEY) &&
  !env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder') &&
  !env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key');

// Admin client: uses service role key for trusted server operations
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// User client factory: uses user access token to query Supabase respecting RLS
export function createSupabaseUserClient(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}
