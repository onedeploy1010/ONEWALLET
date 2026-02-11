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
    const userId = searchParams.get('user_id');

    let query = supabaseEngine
      .from('forex_investments')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: investments, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      console.error('Forex investments query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Failed to fetch forex investments' } },
        { status: 500 }
      );
    }

    const mapped = (investments || []).map((inv) => ({
      id: inv.id,
      userId: inv.user_id,
      amount: inv.amount,
      currentValue: inv.current_value,
      profit: inv.profit,
      profitPercent: inv.profit_percent,
      status: inv.status,
      cycleDays: inv.cycle_days,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Forex investments error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex investments' } },
      { status: 500 }
    );
  }
}
