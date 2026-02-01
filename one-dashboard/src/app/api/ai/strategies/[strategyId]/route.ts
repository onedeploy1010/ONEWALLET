import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/strategies/[strategyId] - Single strategy detail + pool
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ strategyId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { strategyId } = await params;

    const [
      { data: strategy, error: strategyError },
      { data: pool, error: poolError },
    ] = await Promise.all([
      supabaseEngine
        .from('ai_strategies')
        .select('*')
        .eq('id', strategyId)
        .single(),
      supabaseEngine
        .from('ai_strategy_pools')
        .select('*')
        .eq('strategy_id', strategyId)
        .single(),
    ]);

    if (strategyError) throw strategyError;

    const mappedStrategy = strategy ? {
      id: strategy.id,
      name: strategy.name,
      category: strategy.category,
      riskLevel: strategy.risk_level,
      status: strategy.status,
      description: strategy.description,
      tvl: strategy.tvl,
      winRate: strategy.win_rate,
      sharpeRatio: strategy.sharpe_ratio,
      totalPnl: strategy.total_pnl,
      maxDrawdown: strategy.max_drawdown,
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
    } : null;

    const mappedPool = pool ? {
      id: pool.id,
      strategyId: pool.strategy_id,
      totalDeposits: pool.total_deposits,
      totalShares: pool.total_shares,
      navPerShare: pool.nav_per_share,
      utilizationRate: pool.utilization_rate,
      createdAt: pool.created_at,
      updatedAt: pool.updated_at,
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        strategy: mappedStrategy,
        pool: mappedPool,
      },
    });
  } catch (error) {
    console.error('AI strategy detail fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch strategy detail' } },
      { status: 500 }
    );
  }
}
