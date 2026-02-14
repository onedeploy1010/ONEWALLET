import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserProjectIds, verifyProjectAccess } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/orders - List orders scoped by project
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
    const projectId = url.searchParams.get('project_id');
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('user_id');

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
      return NextResponse.json({ success: true, data: [] });
    }

    let query = supabaseEngine
      .from('ai_orders')
      .select('*, ai_strategies(name)')
      .order('created_at', { ascending: false });

    // Filter by project_id
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.in('project_id', userProjectIds);
    }

    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: orders, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    const mapped = (orders || []).map((o) => ({
      id: o.id,
      userId: o.user_id,
      projectId: o.project_id,
      strategyId: o.strategy_id,
      strategyName: o.ai_strategies?.name || o.strategy_name || o.strategy_id,
      amount: o.amount,
      shares: o.share_ratio,
      status: o.status,
      pnl: o.realized_profit || 0,
      pnlPercent: o.amount > 0 ? ((o.realized_profit || 0) / o.amount * 100) : 0,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('AI orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch AI orders' } },
      { status: 500 }
    );
  }
}
