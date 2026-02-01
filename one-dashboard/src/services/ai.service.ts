/**
 * AI Trading Service
 * Queries ai_strategies, ai_orders, ai_strategy_pools, ai_open_positions,
 * ai_decision_log, ai_performance_snapshots via supabaseEngine
 */

import { supabaseEngine } from '@/lib/supabase';
import type {
  AiStrategy,
  AiOrder,
  AiStrategyPool,
  AiOpenPosition,
  AiDecisionLog,
  AiPerformanceSnapshot,
  AiOverviewStats,
} from '@/types';

function mapStrategy(row: Record<string, unknown>): AiStrategy {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    riskLevel: row.risk_level as AiStrategy['riskLevel'],
    status: row.status as AiStrategy['status'],
    description: row.description as string | undefined,
    tvl: Number(row.tvl ?? 0),
    winRate: Number(row.win_rate ?? 0),
    sharpeRatio: Number(row.sharpe_ratio ?? 0),
    totalPnl: Number(row.total_pnl ?? 0),
    maxDrawdown: Number(row.max_drawdown ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapOrder(row: Record<string, unknown>): AiOrder {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    strategyId: row.strategy_id as string,
    strategyName: row.strategy_name as string | undefined,
    amount: Number(row.amount ?? 0),
    shares: Number(row.shares ?? 0),
    status: row.status as AiOrder['status'],
    pnl: Number(row.pnl ?? 0),
    pnlPercent: Number(row.pnl_percent ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapPosition(row: Record<string, unknown>): AiOpenPosition {
  return {
    id: row.id as string,
    strategyId: row.strategy_id as string,
    symbol: row.symbol as string,
    side: row.side as AiOpenPosition['side'],
    entryPrice: Number(row.entry_price ?? 0),
    currentPrice: Number(row.current_price ?? 0),
    quantity: Number(row.quantity ?? 0),
    leverage: Number(row.leverage ?? 1),
    pnl: Number(row.pnl ?? 0),
    pnlPercent: Number(row.pnl_percent ?? 0),
    openedAt: row.opened_at as string,
  };
}

function mapDecision(row: Record<string, unknown>): AiDecisionLog {
  return {
    id: row.id as string,
    strategyId: row.strategy_id as string,
    strategyName: row.strategy_name as string | undefined,
    action: row.action as string,
    symbol: row.symbol as string,
    confidence: Number(row.confidence ?? 0),
    executed: row.executed as boolean,
    pnl: row.pnl != null ? Number(row.pnl) : undefined,
    reasoning: row.reasoning as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapSnapshot(row: Record<string, unknown>): AiPerformanceSnapshot {
  return {
    id: row.id as string,
    strategyId: row.strategy_id as string,
    nav: Number(row.nav ?? 0),
    tvl: Number(row.tvl ?? 0),
    pnl: Number(row.pnl ?? 0),
    drawdown: Number(row.drawdown ?? 0),
    snapshotDate: row.snapshot_date as string,
  };
}

function mapPool(row: Record<string, unknown>): AiStrategyPool {
  return {
    id: row.id as string,
    strategyId: row.strategy_id as string,
    totalDeposits: Number(row.total_deposits ?? 0),
    totalShares: Number(row.total_shares ?? 0),
    navPerShare: Number(row.nav_per_share ?? 0),
    utilizationRate: Number(row.utilization_rate ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export class AiService {
  async getStrategies(filters?: {
    category?: string;
    riskLevel?: string;
    status?: string;
  }): Promise<AiStrategy[]> {
    let query = supabaseEngine
      .from('ai_strategies')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.riskLevel) query = query.eq('risk_level', filters.riskLevel);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch strategies: ${error.message}`);
    return (data || []).map(mapStrategy);
  }

  async getStrategy(strategyId: string): Promise<AiStrategy | null> {
    const { data, error } = await supabaseEngine
      .from('ai_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch strategy: ${error.message}`);
    }
    return data ? mapStrategy(data) : null;
  }

  async getStrategyPool(strategyId: string): Promise<AiStrategyPool | null> {
    const { data, error } = await supabaseEngine
      .from('ai_strategy_pools')
      .select('*')
      .eq('strategy_id', strategyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch pool: ${error.message}`);
    }
    return data ? mapPool(data) : null;
  }

  async getOrders(filters?: {
    status?: string;
    userId?: string;
  }): Promise<AiOrder[]> {
    let query = supabaseEngine
      .from('ai_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.userId) query = query.eq('user_id', filters.userId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch orders: ${error.message}`);
    return (data || []).map(mapOrder);
  }

  async getOpenPositions(strategyId?: string): Promise<AiOpenPosition[]> {
    let query = supabaseEngine
      .from('ai_open_positions')
      .select('*')
      .order('opened_at', { ascending: false });

    if (strategyId) query = query.eq('strategy_id', strategyId);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch positions: ${error.message}`);
    return (data || []).map(mapPosition);
  }

  async getDecisionLog(filters?: {
    strategyId?: string;
    limit?: number;
  }): Promise<AiDecisionLog[]> {
    let query = supabaseEngine
      .from('ai_decision_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.strategyId) query = query.eq('strategy_id', filters.strategyId);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch decisions: ${error.message}`);
    return (data || []).map(mapDecision);
  }

  async getPerformanceSnapshots(
    strategyId: string,
    days?: number
  ): Promise<AiPerformanceSnapshot[]> {
    let query = supabaseEngine
      .from('ai_performance_snapshots')
      .select('*')
      .eq('strategy_id', strategyId)
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

  async getOverviewStats(): Promise<AiOverviewStats> {
    const [
      { data: strategies },
      { count: orderCount },
    ] = await Promise.all([
      supabaseEngine.from('ai_strategies').select('*'),
      supabaseEngine.from('ai_orders').select('*', { count: 'exact', head: true }),
    ]);

    const strats = strategies || [];
    const active = strats.filter((s) => s.status === 'active');
    const totalAum = strats.reduce((sum: number, s) => sum + Number(s.tvl ?? 0), 0);
    const avgWinRate = active.length > 0
      ? active.reduce((sum: number, s) => sum + Number(s.win_rate ?? 0), 0) / active.length
      : 0;
    const avgSharpe = active.length > 0
      ? active.reduce((sum: number, s) => sum + Number(s.sharpe_ratio ?? 0), 0) / active.length
      : 0;
    const totalProfit = strats.reduce((sum: number, s) => sum + Number(s.total_pnl ?? 0), 0);

    return {
      totalAum,
      totalStrategies: strats.length,
      activeStrategies: active.length,
      totalOrders: orderCount || 0,
      avgWinRate,
      avgSharpe,
      totalProfit,
    };
  }
}

export const aiService = new AiService();
