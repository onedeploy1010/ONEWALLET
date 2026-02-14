/**
 * Authentication Library for ONE Dashboard
 * Uses same JWT system as One-Engine
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { supabaseEngine } from './supabase';
import type { User, AuthSession, Team, TeamRole, TeamContext } from '@/types';

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

// ============ Multi-Tenancy Authorization Helpers ============

interface TeamJoinResult {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all teams a user belongs to
 */
export async function getUserTeams(userId: string): Promise<Array<{ team: Team; role: TeamRole }>> {
  const { data: memberships, error } = await supabaseEngine
    .from('team_members')
    .select(`
      role,
      teams:team_id (
        id,
        name,
        slug,
        owner_id,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (error || !memberships) {
    return [];
  }

  return memberships
    .filter((m) => m.teams)
    .map((m) => {
      const teamData = m.teams as unknown as TeamJoinResult;
      return {
        team: {
          id: teamData.id,
          name: teamData.name,
          slug: teamData.slug,
          ownerId: teamData.owner_id,
          createdAt: teamData.created_at,
          updatedAt: teamData.updated_at,
        },
        role: m.role as TeamRole,
      };
    });
}

/**
 * Verify user has access to a team (by slug or ID)
 * Returns team context if user has access, null otherwise
 */
export async function verifyTeamAccess(
  userId: string,
  teamSlugOrId: string
): Promise<TeamContext | null> {
  // Check if it's a UUID (team ID) or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamSlugOrId);

  const { data: team, error: teamError } = await supabaseEngine
    .from('teams')
    .select('id, name, slug, owner_id, created_at, updated_at')
    .eq(isUUID ? 'id' : 'slug', teamSlugOrId)
    .single();

  if (teamError || !team) {
    return null;
  }

  // Check user membership
  const { data: membership, error: memberError } = await supabaseEngine
    .from('team_members')
    .select('role')
    .eq('team_id', team.id)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership) {
    return null;
  }

  return {
    team: {
      id: team.id,
      name: team.name,
      slug: team.slug,
      ownerId: team.owner_id,
      createdAt: team.created_at,
      updatedAt: team.updated_at,
    },
    role: membership.role as TeamRole,
  };
}

/**
 * Verify user has access to a project (through team membership)
 * Returns project info and team context if user has access
 */
export async function verifyProjectAccess(
  userId: string,
  projectSlugOrId: string
): Promise<{ projectId: string; teamId: string; teamContext: TeamContext } | null> {
  // Check if it's a UUID or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectSlugOrId);

  const { data: project, error: projectError } = await supabaseEngine
    .from('projects')
    .select('id, team_id')
    .eq(isUUID ? 'id' : 'slug', projectSlugOrId)
    .single();

  if (projectError || !project) {
    return null;
  }

  // Verify user is a member of the team that owns this project
  const { data: membership, error: memberError } = await supabaseEngine
    .from('team_members')
    .select(`
      role,
      teams:team_id (
        id,
        name,
        slug,
        owner_id,
        created_at,
        updated_at
      )
    `)
    .eq('team_id', project.team_id)
    .eq('user_id', userId)
    .single();

  if (memberError || !membership || !membership.teams) {
    return null;
  }

  const teamData = membership.teams as unknown as TeamJoinResult;

  return {
    projectId: project.id,
    teamId: project.team_id,
    teamContext: {
      team: {
        id: teamData.id,
        name: teamData.name,
        slug: teamData.slug,
        ownerId: teamData.owner_id,
        createdAt: teamData.created_at,
        updatedAt: teamData.updated_at,
      },
      role: membership.role as TeamRole,
    },
  };
}

/**
 * Verify that a project belongs to a specific team
 */
export async function verifyProjectBelongsToTeam(
  projectSlugOrId: string,
  teamSlugOrId: string
): Promise<boolean> {
  const isProjectUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectSlugOrId);
  const isTeamUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamSlugOrId);

  // Get team ID first
  let teamId = teamSlugOrId;
  if (!isTeamUUID) {
    const { data: team } = await supabaseEngine
      .from('teams')
      .select('id')
      .eq('slug', teamSlugOrId)
      .single();
    if (!team) return false;
    teamId = team.id;
  }

  // Check project belongs to team
  const { data: project } = await supabaseEngine
    .from('projects')
    .select('id')
    .eq(isProjectUUID ? 'id' : 'slug', projectSlugOrId)
    .eq('team_id', teamId)
    .single();

  return !!project;
}

/**
 * Get all project IDs that a user has access to (through all their teams)
 */
export async function getUserProjectIds(userId: string): Promise<string[]> {
  // Get all team IDs the user belongs to
  const { data: memberships } = await supabaseEngine
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const teamIds = memberships.map((m) => m.team_id);

  // Get all projects from those teams
  const { data: projects } = await supabaseEngine
    .from('projects')
    .select('id')
    .in('team_id', teamIds);

  return projects?.map((p) => p.id) || [];
}

/**
 * Require team access - throws error if user doesn't have access
 */
export async function requireTeamAccess(
  session: AuthSession,
  teamSlugOrId: string
): Promise<TeamContext> {
  const teamContext = await verifyTeamAccess(session.user.id, teamSlugOrId);
  if (!teamContext) {
    throw new Error('Team access denied');
  }
  return teamContext;
}

/**
 * Require project access - throws error if user doesn't have access
 */
export async function requireProjectAccess(
  session: AuthSession,
  projectSlugOrId: string
): Promise<{ projectId: string; teamId: string; teamContext: TeamContext }> {
  const access = await verifyProjectAccess(session.user.id, projectSlugOrId);
  if (!access) {
    throw new Error('Project access denied');
  }
  return access;
}
