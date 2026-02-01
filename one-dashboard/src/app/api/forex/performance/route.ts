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

    const { searchParams } = new URL(req.url);
    const days = searchParams.get('days');

    let query = supabaseEngine
      .from('forex_daily_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true });

    if (days) {
      const daysNum = parseInt(days, 10);
      if (!isNaN(daysNum) && daysNum > 0) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - daysNum);
        query = query.gte('snapshot_date', fromDate.toISOString().split('T')[0]);
      }
    }

    const { data: snapshots, error } = await query;

    if (error) {
      console.error('Forex performance query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Failed to fetch forex performance' } },
        { status: 500 }
      );
    }

    const mapped = (snapshots || []).map((snap) => ({
      ...snap,
      poolId: snap.pool_id,
      totalInvested: snap.total_invested,
      totalValue: snap.total_value,
      tradeCount: snap.trade_count,
      snapshotDate: snap.snapshot_date,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Forex performance error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex performance' } },
      { status: 500 }
    );
  }
}
