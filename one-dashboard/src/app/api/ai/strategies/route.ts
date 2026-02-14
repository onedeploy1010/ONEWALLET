import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserProjectIds, verifyProjectAccess } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/strategies - List strategies with project scoping
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
    const category = url.searchParams.get('category');
    const riskLevel = url.searchParams.get('risk_level');
    const status = url.searchParams.get('status');

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

    // Get user's accessible project IDs for filtering
    const userProjectIds = await getUserProjectIds(session.user.id);

    let query = supabaseEngine
      .from('ai_strategies')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by specific project or user's accessible projects
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else if (userProjectIds.length > 0) {
      // Filter to only show strategies from user's projects
      // Also include global strategies (project_id is null) if any
      query = query.or(`project_id.in.(${userProjectIds.join(',')}),project_id.is.null`);
    } else {
      // User has no projects, only show global strategies
      query = query.is('project_id', null);
    }

    if (category) {
      query = query.eq('category', category);
    }
    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'paused') {
      query = query.eq('is_active', false);
    }

    const { data: strategies, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    // Fetch pool P&L data (total_pnl lives in ai_strategy_pools, not ai_strategies)
    const strategyIds = (strategies || []).map((s) => s.id);
    let poolPnl = new Map<string, number>();

    if (strategyIds.length > 0) {
      const { data: pools } = await supabaseEngine
        .from('ai_strategy_pools')
        .select('strategy_id, total_pnl')
        .in('strategy_id', strategyIds);
      poolPnl = new Map((pools || []).map((p) => [p.strategy_id, Number(p.total_pnl ?? 0)]));
    }

    const riskMap = (level: number) => level <= 2 ? 'low' : level <= 3 ? 'medium' : 'high';

    const mapped = (strategies || []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      riskLevel: riskMap(Number(s.risk_level) || 1),
      status: s.is_active === false ? 'paused' : 'active',
      description: s.description,
      tvl: s.tvl,
      winRate: s.win_rate,
      sharpeRatio: s.sharpe_ratio,
      totalPnl: poolPnl.get(s.id) ?? 0,
      maxDrawdown: s.max_drawdown,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('AI strategies fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch AI strategies' } },
      { status: 500 }
    );
  }
}
