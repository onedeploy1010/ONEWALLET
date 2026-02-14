import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserProjectIds, verifyProjectAccess } from '@/lib/auth';
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
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');

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

    // Get user's accessible project IDs
    const userProjectIds = projectId ? [projectId] : await getUserProjectIds(session.user.id);

    if (userProjectIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    let query = supabaseEngine
      .from('forex_investments')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by project_id
    if (projectId) {
      query = query.eq('project_id', projectId);
    } else {
      query = query.in('project_id', userProjectIds);
    }

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
