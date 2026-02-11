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

    const { data: pools, error } = await supabaseEngine
      .from('forex_pools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      console.error('Forex pools query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Failed to fetch forex pools' } },
        { status: 500 }
      );
    }

    const mapped = (pools || []).map((pool) => ({
      ...pool,
      poolSize: pool.pool_size,
      createdAt: pool.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('Forex pools error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex pools' } },
      { status: 500 }
    );
  }
}
