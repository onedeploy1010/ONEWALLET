import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/stats - Returns AI overview stats
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const [
      { data: strategies, error: strategiesError },
      { count: totalOrders, error: ordersError },
    ] = await Promise.all([
      supabaseEngine
        .from('ai_strategies')
        .select('*'),
      supabaseEngine
        .from('ai_orders')
        .select('*', { count: 'exact', head: true }),
    ]);

    if (strategiesError) throw strategiesError;
    if (ordersError) throw ordersError;

    const allStrategies = strategies || [];

    const totalAum = allStrategies.reduce((sum, s) => sum + (Number(s.tvl) || 0), 0);
    const totalStrategies = allStrategies.length;
    const activeStrategies = allStrategies.filter((s) => s.status === 'active').length;
    const totalProfit = allStrategies.reduce((sum, s) => sum + (Number(s.total_pnl) || 0), 0);

    const winRates = allStrategies.filter((s) => s.win_rate != null);
    const avgWinRate = winRates.length > 0
      ? winRates.reduce((sum, s) => sum + Number(s.win_rate), 0) / winRates.length
      : 0;

    const sharpes = allStrategies.filter((s) => s.sharpe_ratio != null);
    const avgSharpe = sharpes.length > 0
      ? sharpes.reduce((sum, s) => sum + Number(s.sharpe_ratio), 0) / sharpes.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalAum,
        totalStrategies,
        activeStrategies,
        totalOrders: totalOrders || 0,
        avgWinRate,
        avgSharpe,
        totalProfit,
      },
    });
  } catch (error) {
    console.error('AI stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch AI stats' } },
      { status: 500 }
    );
  }
}
