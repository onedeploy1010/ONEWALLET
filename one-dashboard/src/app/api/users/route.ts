import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserProjectIds, verifyProjectAccess } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

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
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const role = url.searchParams.get('role');
    const search = url.searchParams.get('search');
    const projectId = url.searchParams.get('project_id');

    // If project_id is provided, verify access
    if (projectId) {
      const access = await verifyProjectAccess(session.user.id, projectId);
      if (!access) {
        return NextResponse.json(
          { success: false, error: { code: 'E1003', message: 'Project access denied' } },
          { status: 403 }
        );
      }
    }

    // Get user's accessible project IDs
    const userProjectIds = projectId ? [projectId] : await getUserProjectIds(session.user.id);

    if (userProjectIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      });
    }

    // First get users from wallets table (users associated with projects)
    let walletsQuery = supabaseEngine
      .from('wallets')
      .select('user_id');

    if (projectId) {
      walletsQuery = walletsQuery.eq('project_id', projectId);
    } else {
      walletsQuery = walletsQuery.in('project_id', userProjectIds);
    }

    const { data: wallets } = await walletsQuery;
    const userIdsSet = new Set((wallets || []).map((w) => w.user_id).filter(Boolean));
    const userIds = Array.from(userIdsSet);

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
        },
      });
    }

    // Now get user details filtered to those in the user's projects
    let query = supabaseEngine
      .from('users')
      .select('id, email, role, wallet_address, created_at, last_login_at, status', { count: 'exact' })
      .in('id', userIds);

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    const { data: users, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: users || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to fetch users' } },
      { status: 500 }
    );
  }
}
