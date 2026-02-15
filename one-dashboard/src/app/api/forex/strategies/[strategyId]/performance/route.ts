import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/forex/strategies/[strategyId]/performance - Get forex strategy performance
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
    const days = parseInt(url.searchParams.get('days') || '90', 10);

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const { data: snapshots, error } = await supabaseEngine
      .from('forex_strategy_snapshots')
      .select('*')
      .eq('strategy_id', strategyId)
      .gte('snapshot_date', fromDate.toISOString())
      .order('snapshot_date', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    const mapped = (snapshots || []).map((s) => ({
      snapshotDate: s.snapshot_date,
      nav: s.nav,
      aum: s.aum,
      pnl: s.pnl,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Forex strategy performance error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex performance' } },
      { status: 500 }
    );
  }
}
