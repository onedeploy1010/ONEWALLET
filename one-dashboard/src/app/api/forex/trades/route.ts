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
    const status = searchParams.get('status');
    const pair = searchParams.get('pair');

    let query = supabaseEngine
      .from('forex_trades')
      .select('*')
      .order('opened_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (pair) {
      query = query.eq('pair', pair);
    }

    const { data: trades, error } = await query;

    if (error) {
      console.error('Forex trades query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Failed to fetch forex trades' } },
        { status: 500 }
      );
    }

    const mapped = (trades || []).map((trade) => ({
      ...trade,
      openedAt: trade.opened_at,
      closedAt: trade.closed_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Forex trades error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex trades' } },
      { status: 500 }
    );
  }
}
