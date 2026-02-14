import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/strategies/[strategyId]/positions - Open positions for a strategy
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

    let query = supabaseEngine
      .from('ai_open_positions')
      .select('*')
      .eq('strategy_id', strategyId);

    // Filter by project_id if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: positions, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    const mapped = (positions || []).map((p) => ({
      id: p.id,
      strategyId: p.strategy_id,
      symbol: p.symbol,
      side: p.side,
      entryPrice: p.entry_price,
      currentPrice: p.current_price,
      quantity: p.quantity,
      leverage: p.leverage,
      pnl: p.unrealized_pnl ?? p.pnl ?? 0,
      pnlPercent: p.unrealized_pnl_pct ?? p.pnl_percent ?? 0,
      openedAt: p.opened_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('AI positions fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch positions' } },
      { status: 500 }
    );
  }
}
