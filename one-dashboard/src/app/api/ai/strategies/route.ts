import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/strategies - List strategies with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'E1001', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const riskLevel = url.searchParams.get('risk_level');
    const status = url.searchParams.get('status');

    let query = supabaseEngine
      .from('ai_strategies')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }
    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: strategies, error } = await query;

    if (error) throw error;

    const mapped = (strategies || []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      riskLevel: s.risk_level,
      status: s.status,
      description: s.description,
      tvl: s.tvl,
      winRate: s.win_rate,
      sharpeRatio: s.sharpe_ratio,
      totalPnl: s.total_pnl,
      maxDrawdown: s.max_drawdown,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('AI strategies fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch AI strategies' } },
      { status: 500 }
    );
  }
}
