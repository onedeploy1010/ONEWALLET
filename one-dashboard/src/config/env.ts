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

  // One-Engine Supabase (Same database as One-Engine)
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),

  // One-Engine API (for calling Engine APIs)
  ONE_ENGINE_API_URL: getEnvVarOptional('ONE_ENGINE_API_URL', 'http://localhost:4000'),

  // One-Wallet Supabase (for migration only - separate database)
  ONE_WALLET_SUPABASE_URL: getEnvVarOptional('ONE_WALLET_SUPABASE_URL'),
  ONE_WALLET_SUPABASE_KEY: getEnvVarOptional('ONE_WALLET_SUPABASE_KEY'),

  // JWT (Same secret as One-Engine for shared auth)
  JWT_SECRET: getEnvVar('JWT_SECRET'),

  // Redis (Optional - for caching)
  REDIS_URL: getEnvVarOptional('REDIS_URL', 'redis://localhost:6379'),
} as const;

export type Env = typeof env;
