import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/strategies/[strategyId]/performance - NAV snapshots
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

    const url = new URL(req.url);
    const days = url.searchParams.get('days');

    let query = supabaseEngine
      .from('ai_performance_snapshots')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('snapshot_date', { ascending: true });

    if (days) {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - parseInt(days));
      query = query.gte('snapshot_date', sinceDate.toISOString().split('T')[0]);
    }

    const { data: snapshots, error } = await query;

    if (error) throw error;

    const mapped = (snapshots || []).map((s) => ({
      id: s.id,
      strategyId: s.strategy_id,
      nav: s.nav,
      tvl: s.tvl,
      pnl: s.pnl,
      drawdown: s.drawdown,
      snapshotDate: s.snapshot_date,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('AI performance fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch performance data' } },
      { status: 500 }
    );
  }
}
