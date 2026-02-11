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
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Fetch from all four sources in parallel (gracefully handle missing tables)
    const [ordersRes, decisionsRes, tradesRes, investmentsRes] = await Promise.all([
      supabaseEngine.from('ai_orders').select('*').order('created_at', { ascending: false }).limit(limit),
      supabaseEngine.from('ai_decision_log').select('*').order('created_at', { ascending: false }).limit(limit),
      supabaseEngine.from('forex_trades').select('*').order('opened_at', { ascending: false }).limit(limit),
      supabaseEngine.from('forex_investments').select('*').order('created_at', { ascending: false }).limit(limit),
    ]);
    const aiOrders = ordersRes.error?.code === '42P01' ? [] : ordersRes.data;
    const aiDecisions = decisionsRes.error?.code === '42P01' ? [] : decisionsRes.data;
    const forexTrades = tradesRes.error?.code === '42P01' ? [] : tradesRes.data;
    const forexInvestments = investmentsRes.error?.code === '42P01' ? [] : investmentsRes.data;

    // Map each source into the unified feed format
    const aiOrderItems = (aiOrders || []).map((row) => ({
      id: row.id,
      type: 'ai_order' as const,
      title: `AI Order: ${row.status}`,
      description: `${row.amount} invested`,
      timestamp: row.created_at,
      metadata: row,
    }));

    const aiDecisionItems = (aiDecisions || []).map((row) => ({
      id: row.id,
      type: 'ai_decision' as const,
      title: `AI Decision: ${row.action} ${row.symbol}`,
      description: `Confidence: ${row.confidence}%`,
      timestamp: row.created_at,
      metadata: row,
    }));

    const forexTradeItems = (forexTrades || []).map((row) => ({
      id: row.id,
      type: 'forex_trade' as const,
      title: `Forex: ${row.side} ${row.pair}`,
      description: `${row.lots} lots, ${row.pips} pips`,
      timestamp: row.opened_at,
      metadata: row,
    }));

    const forexInvestmentItems = (forexInvestments || []).map((row) => ({
      id: row.id,
      type: 'forex_investment' as const,
      title: 'Forex Investment',
      description: `${row.amount} invested`,
      timestamp: row.created_at,
      metadata: row,
    }));

    // Combine, sort by timestamp descending, and slice to limit
    const unified = [
      ...aiOrderItems,
      ...aiDecisionItems,
      ...forexTradeItems,
      ...forexInvestmentItems,
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: unified,
    });
  } catch (error) {
    console.error('AI-Forex usage feed error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch AI-Forex usage feed' } },
      { status: 500 }
    );
  }
}
