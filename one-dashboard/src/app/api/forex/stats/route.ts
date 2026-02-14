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

    const url = new URL(req.url);
    const projectId = url.searchParams.get('project_id');

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
      // User has no projects
      return NextResponse.json({
        success: true,
        data: {
          totalInvested: 0,
          totalValue: 0,
          totalProfit: 0,
          activeInvestments: 0,
          totalTrades: 0,
          avgCycleDays: 0,
        },
      });
    }

    // Build scoped queries
    let investmentsQuery = supabaseEngine
      .from('forex_investments')
      .select('amount, current_value, profit, status, cycle_days');
    let tradesQuery = supabaseEngine
      .from('forex_trades')
      .select('*', { count: 'exact', head: true });

    if (projectId) {
      investmentsQuery = investmentsQuery.eq('project_id', projectId);
      tradesQuery = tradesQuery.eq('project_id', projectId);
    } else {
      investmentsQuery = investmentsQuery.in('project_id', userProjectIds);
      tradesQuery = tradesQuery.in('project_id', userProjectIds);
    }

    const [
      { data: investments, error: investmentsError },
      { count: totalTrades, error: tradesError },
    ] = await Promise.all([investmentsQuery, tradesQuery]);

    if (investmentsError && investmentsError.code !== '42P01') {
      console.error('Forex investments query error:', investmentsError);
      return NextResponse.json(
        { success: false, error: { code: 'E5001', message: 'Failed to query forex investments' } },
        { status: 500 }
      );
    }

    if (tradesError && tradesError.code !== '42P01') {
      console.error('Forex trades count error:', tradesError);
      return NextResponse.json(
        { success: false, error: { code: 'E5002', message: 'Failed to count forex trades' } },
        { status: 500 }
      );
    }

    const allInvestments = investments || [];
    const activeInvestments = allInvestments.filter((i) => i.status === 'active');

    const totalInvested = allInvestments.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalValue = allInvestments.reduce((sum, i) => sum + (Number(i.current_value) || 0), 0);
    const totalProfit = allInvestments.reduce((sum, i) => sum + (Number(i.profit) || 0), 0);

    const avgCycleDays =
      activeInvestments.length > 0
        ? activeInvestments.reduce((sum, i) => sum + (Number(i.cycle_days) || 0), 0) /
          activeInvestments.length
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalInvested,
        totalValue,
        totalProfit,
        activeInvestments: activeInvestments.length,
        totalTrades: totalTrades || 0,
        avgCycleDays: Math.round(avgCycleDays * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Forex stats error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch forex stats' } },
      { status: 500 }
    );
  }
}
