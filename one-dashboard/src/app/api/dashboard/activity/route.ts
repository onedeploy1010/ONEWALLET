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
    const limit = parseInt(url.searchParams.get('limit') || '10');
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
      });
    }

    // Build scoped queries
    let transactionsQuery = supabaseEngine
      .from('transactions')
      .select('id, type, amount, currency, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    let activityLogsQuery = supabaseEngine
      .from('activity_logs')
      .select('id, action, metadata, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by project
    if (projectId) {
      transactionsQuery = transactionsQuery.eq('project_id', projectId);
      activityLogsQuery = activityLogsQuery.contains('metadata', { project_id: projectId });
    } else {
      transactionsQuery = transactionsQuery.in('project_id', userProjectIds);
      // For activity_logs, filter by user's own logs or logs with their projects
      activityLogsQuery = activityLogsQuery.eq('user_id', session.user.id);
    }

    // Fetch recent activity from scoped sources
    const [
      { data: transactions },
      { data: activityLogs },
    ] = await Promise.all([
      transactionsQuery,
      activityLogsQuery,
    ]);

    // Combine and format activities
    const activities = [
      ...(transactions || []).map((t) => ({
        id: `tx-${t.id}`,
        type: 'transaction' as const,
        title: `${t.type} Transaction`,
        description: `${t.amount} ${t.currency} - ${t.status}`,
        timestamp: t.created_at,
        metadata: { user_id: t.user_id },
      })),
      ...(activityLogs || []).map((a) => ({
        id: `log-${a.id}`,
        type: 'api_call' as const,
        title: a.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: JSON.stringify(a.metadata || {}).slice(0, 50),
        timestamp: a.created_at,
        metadata: a.metadata,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E2000', message: 'Failed to fetch activity' } },
      { status: 500 }
    );
  }
}
