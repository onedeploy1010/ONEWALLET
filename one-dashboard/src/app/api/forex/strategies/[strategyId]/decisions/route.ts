import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyProjectAccess } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/forex/strategies/[strategyId]/decisions - Get forex strategy decisions
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
      .from('forex_decisions')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false })
      .limit(limit);

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
      action: d.action,
      pair: d.pair,
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
    console.error('Forex strategy decisions error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex decisions' } },
      { status: 500 }
    );
  }
}
