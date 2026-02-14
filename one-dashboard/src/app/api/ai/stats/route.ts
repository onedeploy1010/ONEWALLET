import { NextRequest, NextResponse } from 'next/server';
import { getSession, getUserProjectIds, verifyProjectAccess } from '@/lib/auth';
import { supabaseEngine } from '@/lib/supabase';

// GET /api/ai/stats - Returns AI overview stats scoped by project
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

    // Build scoped queries
    let strategiesQuery = supabaseEngine.from('ai_strategies').select('*');
    let ordersQuery = supabaseEngine.from('ai_orders').select('*', { count: 'exact', head: true });

    if (projectId) {
      strategiesQuery = strategiesQuery.eq('project_id', projectId);
      ordersQuery = ordersQuery.eq('project_id', projectId);
    } else if (userProjectIds.length > 0) {
      // Filter to user's projects or global strategies
      strategiesQuery = strategiesQuery.or(`project_id.in.(${userProjectIds.join(',')}),project_id.is.null`);
      ordersQuery = ordersQuery.in('project_id', userProjectIds);
    } else {
      // User has no projects, only show global stats
      strategiesQuery = strategiesQuery.is('project_id', null);
      // No orders for user without projects
      return NextResponse.json({
        success: true,
        data: {
          totalAum: 0,
          totalStrategies: 0,
          activeStrategies: 0,
          totalOrders: 0,
          avgWinRate: 0,
          avgSharpe: 0,
          totalProfit: 0,
        },
      });
    }

    const [
      { data: strategies, error: strategiesError },
      { count: totalOrders, error: ordersError },
    ] = await Promise.all([strategiesQuery, ordersQuery]);

    const strategiesMissing = strategiesError?.code === '42P01';
    const ordersMissing = ordersError?.code === '42P01';
    if (strategiesError && !strategiesMissing) throw strategiesError;
    if (ordersError && !ordersMissing) throw ordersError;

    const allStrategies = strategies || [];

    const totalAum = allStrategies.reduce((sum, s) => sum + (Number(s.tvl) || 0), 0);
    const totalStrategies = allStrategies.length;
    const activeStrategies = allStrategies.filter((s) => s.status === 'active').length;
    const totalProfit = allStrategies.reduce((sum, s) => sum + (Number(s.total_pnl) || 0), 0);

    const winRates = allStrategies.filter((s) => s.win_rate != null);
    const avgWinRate = winRates.length > 0
      ? winRates.reduce((sum, s) => sum + Number(s.win_rate), 0) / winRates.length
      : 0;

    const sharpes = allStrategies.filter((s) => s.sharpe_ratio != null);
    const avgSharpe = sharpes.length > 0
      ? sharpes.reduce((sum, s) => sum + Number(s.sharpe_ratio), 0) / sharpes.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalAum,
        totalStrategies,
        activeStrategies,
        totalOrders: totalOrders || 0,
        avgWinRate,
        avgSharpe,
        totalProfit,
      },
    });
  } catch (error) {
    console.error('AI stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'E5000', message: 'Failed to fetch AI stats' } },
      { status: 500 }
    );
  }
}
