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

    // Fetch all investments and trade count in parallel
    const [
      { data: investments, error: investmentsError },
      { count: totalTrades, error: tradesError },
    ] = await Promise.all([
      supabaseEngine
        .from('forex_investments')
        .select('amount, current_value, profit, status, cycle_days'),
      supabaseEngine
        .from('forex_trades')
        .select('*', { count: 'exact', head: true }),
    ]);

    if (investmentsError) {
      console.error('Forex investments query error:', investmentsError);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Failed to query forex investments' } },
        { status: 500 }
      );
    }

    if (tradesError) {
      console.error('Forex trades count error:', tradesError);
      return NextResponse.json(
        { success: false, error: { code: 'E5002', message: 'Failed to count forex trades' } },
        { status: 500 }
      );
    }

    const allInvestments = investments || [];
    const activeInvestments = allInvestments.filter((i) => i.status === 'active');

    const totalInvested = allInvestments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalValue = allInvestments.reduce((sum, i) => sum + (Number(i.current_value) || 0), 0);
    const totalProfit = allInvestments.reduce((sum, i) => sum + (Number(i.profit) || 0), 0);

    const avgCycleDays =
      activeInvestments.length > 0
        ? activeInvestments.reduce((sum, i) => sum + (Number(i.cycle_days) || 0), 0) /
          activeInvestments.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalInvested,
        totalValue,
        totalProfit,
        activeInvestments: activeInvestments.length,
        totalTrades: totalTrades || 0,
        avgCycleDays: Math.round(avgCycleDays * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Forex stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex stats' } },
      { status: 500 }
    );
  }
}
