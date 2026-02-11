/**
 * Supabase Clients for ONE Dashboard
 * Connects to both One-Engine (primary) and One-Wallet (migration) databases
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

// One-Engine Supabase Client (Primary)
// Note: Schema 'one' needs to be exposed in Supabase project settings
// Until then, using 'public' schema
export const supabaseEngine = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// One-Wallet Supabase Client (For migration via IPv4 direct connection)
export const supabaseWallet = env.ONE_WALLET_SUPABASE_URL && env.ONE_WALLET_SUPABASE_KEY
  ? createClient(
      env.ONE_WALLET_SUPABASE_URL,
      env.ONE_WALLET_SUPABASE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// Browser client for auth (legacy)
export const createBrowserClient = () => {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );
};

// Browser-side Supabase Auth client (for OTP sign-in/verify)
export const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
