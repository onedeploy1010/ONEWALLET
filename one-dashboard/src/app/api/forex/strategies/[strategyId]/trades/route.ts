import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyProjectAccess } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/forex/strategies/[strategyId]/trades - Get forex strategy trades
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
    const projectId = url.searchParams.get('project_id');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

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

    let query = supabaseEngine
      .from('forex_trades')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('opened_at', { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: trades, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    const mapped = (trades || []).map((t) => ({
      id: t.id,
      pair: t.pair,
      side: t.side,
      entryPrice: t.entry_price,
      currentPrice: t.current_price || t.exit_price || t.entry_price,
      lots: t.lots,
      pips: t.pips || 0,
      pnl: t.pnl || 0,
      pnlPercent: t.pnl_percent || 0,
      openedAt: t.opened_at,
      closedAt: t.closed_at,
      status: t.status,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Forex strategy trades error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex trades' } },
      { status: 500 }
    );
  }
}
