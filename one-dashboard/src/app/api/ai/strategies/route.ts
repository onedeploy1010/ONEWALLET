import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyProjectAccess } from '@/lib/auth';
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
    const strategyType = url.searchParams.get('type'); // 'crypto' | 'forex' | null (all)

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

    // Strategies are global - no project filtering needed
    // The project_id parameter is only used for access verification above

    let query = supabaseEngine
      .from('ai_strategies')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by strategy type (crypto/forex)
    if (strategyType) {
      query = query.eq('strategy_type', strategyType);
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
      strategyType: s.strategy_type || 'crypto',
      riskLevel: riskMap(Number(s.risk_level) || 1),
      status: s.is_active === false ? 'paused' : 'active',
      description: s.description,
      tvl: s.tvl,
      winRate: s.win_rate,
      sharpeRatio: s.sharpe_ratio,
      totalPnl: poolPnl.get(s.id) ?? 0,
      maxDrawdown: s.max_drawdown,
      supportedPairs: s.supported_pairs || [],
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
