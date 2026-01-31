/**
 * Authentication Library for ONE Dashboard
 * Uses same JWT system as One-Engine
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { supabaseEngine } from './supabase';
import type { User, AuthSession } from '@/types';

const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRES = '24h';
const REFRESH_TOKEN_EXPIRES = '7d';

interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export async function generateAccessToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'access',
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(secret);
}

export async function generateRefreshToken(user: User): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET);

  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) return null;

  const payload = await verifyToken(accessToken);
  if (!payload || payload.type !== 'access') return null;

  // Get user from database
  const { data: user } = await supabaseEngine
    .from('users')
    .select('id, email, role, created_at')
    .eq('id', payload.sub)
    .single();

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    },
    accessToken,
    expiresAt: payload.exp * 1000,
  };
}

export async function setAuthCookies(
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  if (refreshToken) {
    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
  }
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  if (session.user.role !== 'admin' && session.user.role !== 'superadmin') {
    throw new Error('Forbidden');
  }
  return session;
}
