import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/strategies/[strategyId]/decisions - Decision log
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
    const limit = parseInt(url.searchParams.get('limit') || '50');

    const { data: decisions, error } = await supabaseEngine
      .from('ai_decision_log')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const mapped = (decisions || []).map((d) => ({
      id: d.id,
      strategyId: d.strategy_id,
      strategyName: d.strategy_name,
      action: d.action,
      symbol: d.symbol,
      confidence: d.confidence,
      executed: d.executed,
      pnl: d.pnl,
      reasoning: d.reasoning,
      createdAt: d.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('AI decisions fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch decision log' } },
      { status: 500 }
    );
  }
}
