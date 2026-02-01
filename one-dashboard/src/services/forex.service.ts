/**
 * Forex Service
 * Queries forex_investments, forex_trades, forex_pools, forex_daily_snapshots
 */

import { supabaseEngine } from '@/lib/supabase';
import type {
  ForexInvestment,
  ForexTrade,
  ForexPool,
  ForexDailySnapshot,
  ForexOverviewStats,
} from '@/types';

function mapInvestment(row: Record<string, unknown>): ForexInvestment {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    amount: Number(row.amount ?? 0),
    currentValue: Number(row.current_value ?? 0),
    profit: Number(row.profit ?? 0),
    profitPercent: Number(row.profit_percent ?? 0),
    pairs: row.pairs as string,
    cycleDays: Number(row.cycle_days ?? 0),
    status: row.status as ForexInvestment['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapTrade(row: Record<string, unknown>): ForexTrade {
  return {
    id: row.id as string,
    pair: row.pair as string,
    side: row.side as ForexTrade['side'],
    lots: Number(row.lots ?? 0),
    pips: Number(row.pips ?? 0),
    pnl: Number(row.pnl ?? 0),
    status: row.status as ForexTrade['status'],
    openedAt: row.opened_at as string,
    closedAt: row.closed_at as string | undefined,
  };
}

function mapPool(row: Record<string, unknown>): ForexPool {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    poolSize: Number(row.pool_size ?? 0),
    utilization: Number(row.utilization ?? 0),
    allocation: (row.allocation as Record<string, number>) || {},
    status: row.status as ForexPool['status'],
    createdAt: row.created_at as string,
  };
}

function mapSnapshot(row: Record<string, unknown>): ForexDailySnapshot {
  return {
    id: row.id as string,
    poolId: row.pool_id as string | undefined,
    totalInvested: Number(row.total_invested ?? 0),
    totalValue: Number(row.total_value ?? 0),
    pnl: Number(row.pnl ?? 0),
    tradeCount: Number(row.trade_count ?? 0),
    snapshotDate: row.snapshot_date as string,
  };
}

export class ForexService {
  async getInvestments(filters?: {
    status?: string;
    userId?: string;
  }): Promise<ForexInvestment[]> {
    let query = supabaseEngine
      .from('forex_investments')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.userId) query = query.eq('user_id', filters.userId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch investments: ${error.message}`);
    return (data || []).map(mapInvestment);
  }

  async getTrades(filters?: {
    status?: string;
    pair?: string;
  }): Promise<ForexTrade[]> {
    let query = supabaseEngine
      .from('forex_trades')
      .select('*')
      .order('opened_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.pair) query = query.eq('pair', filters.pair);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch trades: ${error.message}`);
    return (data || []).map(mapTrade);
  }

  async getPools(): Promise<ForexPool[]> {
    const { data, error } = await supabaseEngine
      .from('forex_pools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch pools: ${error.message}`);
    return (data || []).map(mapPool);
  }

  async getDailySnapshots(days?: number): Promise<ForexDailySnapshot[]> {
    let query = supabaseEngine
      .from('forex_daily_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: true });

    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      query = query.gte('snapshot_date', since.toISOString());
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch snapshots: ${error.message}`);
    return (data || []).map(mapSnapshot);
  }

  async getOverviewStats(): Promise<ForexOverviewStats> {
    const [
      { data: investments },
      { count: tradeCount },
    ] = await Promise.all([
      supabaseEngine.from('forex_investments').select('*'),
      supabaseEngine.from('forex_trades').select('*', { count: 'exact', head: true }),
    ]);

    const invs = investments || [];
    const active = invs.filter((i) => i.status === 'active');
    const totalInvested = invs.reduce((sum: number, i) => sum + Number(i.amount ?? 0), 0);
    const totalValue = invs.reduce((sum: number, i) => sum + Number(i.current_value ?? 0), 0);
    const totalProfit = invs.reduce((sum: number, i) => sum + Number(i.profit ?? 0), 0);
    const avgCycleDays = active.length > 0
      ? active.reduce((sum: number, i) => sum + Number(i.cycle_days ?? 0), 0) / active.length
      : 0;

    return {
      totalInvested,
      totalValue,
      totalProfit,
      activeInvestments: active.length,
      totalTrades: tradeCount || 0,
      avgCycleDays: Math.round(avgCycleDays),
    };
  }
}

export const forexService = new ForexService();
