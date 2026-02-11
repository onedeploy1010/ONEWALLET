/**
 * ONE Dashboard Environment Configuration
 * Uses One-Engine's Supabase database directly
 */

const getEnvVar = (key: string, required = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
};

const getEnvVarOptional = (key: string, defaultValue = ''): string => {
  return process.env[key] || defaultValue;
};

export const env = {
  // Application
  NODE_ENV: getEnvVarOptional('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVarOptional('PORT', '3001'), 10),

  // One-Engine Supabase - use NEXT_PUBLIC_ literals for client-side access
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
  // Server-only vars (not available in client components)
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // One-Engine API (for calling Engine APIs)
  ONE_ENGINE_API_URL: process.env.NEXT_PUBLIC_ONE_ENGINE_API_URL || process.env.ONE_ENGINE_API_URL || 'http://localhost:4000',

  // One-Wallet Supabase (for migration only - separate database)
  ONE_WALLET_SUPABASE_URL: getEnvVarOptional('ONE_WALLET_SUPABASE_URL'),
  ONE_WALLET_SUPABASE_KEY: getEnvVarOptional('ONE_WALLET_SUPABASE_KEY'),

  // JWT (Same secret as One-Engine for shared auth)
  JWT_SECRET: process.env.JWT_SECRET || '',

  // Redis (Optional - for caching)
  REDIS_URL: getEnvVarOptional('REDIS_URL', 'redis://localhost:6379'),
} as const;

export type Env = typeof env;
