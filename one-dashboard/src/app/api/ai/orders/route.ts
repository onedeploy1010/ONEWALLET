import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/orders - List orders with optional filters
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
    const status = url.searchParams.get('status');
    const userId = url.searchParams.get('user_id');

    let query = supabaseEngine
      .from('ai_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: orders, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      throw error;
    }

    const mapped = (orders || []).map((o) => ({
      id: o.id,
      userId: o.user_id,
      strategyId: o.strategy_id,
      strategyName: o.strategy_name,
      amount: o.amount,
      shares: o.shares,
      status: o.status,
      pnl: o.pnl,
      pnlPercent: o.pnl_percent,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('AI orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch AI orders' } },
      { status: 500 }
    );
  }
}
