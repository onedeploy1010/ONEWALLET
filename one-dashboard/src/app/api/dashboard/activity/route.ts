import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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

    // Fetch recent activity from multiple sources
    const [
      { data: transactions },
      { data: users },
      { data: activityLogs },
    ] = await Promise.all([
      supabaseEngine
        .from('transactions')
        .select('id, type, amount, currency, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabaseEngine
        .from('users')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabaseEngine
        .from('activity_logs')
        .select('id, action, metadata, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(limit),
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
      ...(users || []).map((u) => ({
        id: `user-${u.id}`,
        type: 'user_created' as const,
        title: 'New User Registered',
        description: u.email,
        timestamp: u.created_at,
        metadata: {},
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
