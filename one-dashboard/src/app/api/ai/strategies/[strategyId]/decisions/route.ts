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
    const projectId = url.searchParams.get('project_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = supabaseEngine
      .from('ai_decision_log')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by project_id if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: decisions, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    const mapped = (decisions || []).map((d) => ({
      id: d.id,
      strategyId: d.strategy_id,
      strategyName: d.strategy_name,
      action: d.action,
      symbol: d.symbol,
      confidence: d.confidence_score ?? d.confidence ?? 0,
      executed: d.was_executed ?? d.executed ?? false,
      pnl: d.outcome_pnl ?? d.pnl ?? null,
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
