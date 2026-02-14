import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserTeams, verifyTeamAccess } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET - List ecosystem apps scoped by team
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const teamId = url.searchParams.get('team_id');

    // If team_id is provided, verify access
    if (teamId) {
      const teamContext = await verifyTeamAccess(session.user.id, teamId);
      if (!teamContext) {
        return NextResponse.json(
          { success: false, error: { code: 'E1003', message: 'Team access denied' } },
          { status: 403 }
        );
      }
    }

    // Get user's teams
    const userTeams = await getUserTeams(session.user.id);

    if (userTeams.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const teamIds = teamId ? [teamId] : userTeams.map((t) => t.team.id);

    let query = supabaseEngine
      .from('ecosystem_apps')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by team or user's teams
    if (teamId) {
      query = query.eq('team_id', teamId);
    } else {
      // Include apps from user's teams or global apps (team_id is null)
      query = query.or(`team_id.in.(${teamIds.join(',')}),team_id.is.null`);
    }

    const { data: apps, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: apps || [],
    });
  } catch (error) {
    console.error('Ecosystem apps fetch error:', error);
    // Return empty array if table doesn't exist
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

// POST - Add ecosystem app (scoped to team)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, type, api_endpoint, team_id } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: { code: 'E2001', message: 'Name is required' } },
        { status: 400 }
      );
    }

    // If team_id is provided, verify access
    if (team_id) {
      const teamContext = await verifyTeamAccess(session.user.id, team_id);
      if (!teamContext) {
        return NextResponse.json(
          { success: false, error: { code: 'E1003', message: 'Team access denied' } },
          { status: 403 }
        );
      }

      // Only owners and admins can create apps
      if (teamContext.role === 'member') {
        return NextResponse.json(
          { success: false, error: { code: 'E1004', message: 'Insufficient permissions' } },
          { status: 403 }
        );
      }
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data: app, error } = await supabaseEngine
      .from('ecosystem_apps')
      .insert({
        name,
        slug,
        type: type || 'external',
        api_endpoint: api_endpoint || null,
        status: 'active',
        users_count: 0,
        team_id: team_id || null,
        created_by: session.user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: app,
    });
  } catch (error) {
    console.error('Ecosystem app create error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to create app' } },
      { status: 500 }
    );
  }
}
