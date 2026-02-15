import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/forex/strategies/[strategyId] - Get forex strategy detail
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

    const { data: strategy, error: strategyError } = await supabaseEngine
      .from('forex_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (strategyError) {
      if (strategyError.code === '42P01' || strategyError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: { code: 'E4004', message: 'Strategy not found' } },
          { status: 404 }
        );
      }
      throw strategyError;
    }

    // Get pool info
    const { data: pool } = await supabaseEngine
      .from('forex_strategy_pools')
      .select('*')
      .eq('strategy_id', strategyId)
      .single();

    const riskMap = (level: number) => (level <= 2 ? 'low' : level <= 3 ? 'medium' : 'high');

    const mappedStrategy = {
      id: strategy.id,
      name: strategy.name,
      category: strategy.category,
      riskLevel: riskMap(Number(strategy.risk_level) || 1),
      status: strategy.is_active === false ? 'paused' : 'active',
      description: strategy.description,
      aum: strategy.aum || strategy.tvl || 0,
      winRate: strategy.win_rate,
      sharpeRatio: strategy.sharpe_ratio,
      totalPnl: pool?.total_pnl ?? 0,
      maxDrawdown: strategy.max_drawdown,
      pairs: strategy.pairs || [],
      createdAt: strategy.created_at,
      updatedAt: strategy.updated_at,
    };

    const mappedPool = pool
      ? {
          totalDeposits: pool.total_deposits,
          totalShares: pool.total_shares,
          navPerShare: pool.nav_per_share,
          utilizationRate: pool.utilization_rate,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: {
        strategy: mappedStrategy,
        pool: mappedPool,
      },
    });
  } catch (error) {
    console.error('Forex strategy detail error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex strategy' } },
      { status: 500 }
    );
  }
}
