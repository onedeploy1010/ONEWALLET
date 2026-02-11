'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge, RiskBadge, PnlBadge, ConfidenceBar, PerformanceChart, DataTable } from '@/components/ai-forex';

interface Strategy {
  id: string; name: string; category: string; riskLevel: 'low' | 'medium' | 'high'; status: string;
  description?: string; tvl: number; winRate: number; sharpeRatio: number; totalPnl: number; maxDrawdown: number;
}
interface Pool { totalDeposits: number; totalShares: number; navPerShare: number; utilizationRate: number; }
interface Position { id: string; symbol: string; side: string; entryPrice: number; currentPrice: number; quantity: number; leverage: number; pnl: number; pnlPercent: number; openedAt: string; }
interface Decision { id: string; action: string; symbol: string; confidence: number; executed: boolean; pnl?: number; reasoning?: string; createdAt: string; }
interface Snapshot { snapshotDate: string; nav: number; tvl: number; pnl: number; }

export default function StrategyDetailPage() {
  const params = useParams();
  const strategyId = params.strategyId as string;
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, [strategyId]);

  const fetchAll = async () => {
    try {
      const [detailRes, posRes, perfRes, decRes] = await Promise.all([
        fetch(`/api/ai/strategies/${strategyId}`),
        fetch(`/api/ai/strategies/${strategyId}/positions`),
        fetch(`/api/ai/strategies/${strategyId}/performance?days=90`),
        fetch(`/api/ai/strategies/${strategyId}/decisions?limit=20`),
      ]);
      const [detail, pos, perf, dec] = await Promise.all([detailRes.json(), posRes.json(), perfRes.json(), decRes.json()]);
      if (detail.success) { setStrategy(detail.data.strategy); setPool(detail.data.pool); }
      if (pos.success) setPositions(pos.data || []);
      if (perf.success) setSnapshots(perf.data || []);
      if (dec.success) setDecisions(dec.data || []);
    } catch (error) { console.error('Failed to fetch strategy detail:', error); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-80 bg-secondary rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!strategy) {
    return <div className="p-12 text-center"><h3 className="text-lg font-semibold text-foreground">Strategy not found</h3></div>;
  }

  const chartData = snapshots.map((s) => ({ date: new Date(s.snapshotDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }), value: s.nav }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{strategy.name}</h1>
          <p className="text-muted-foreground">{strategy.category}{strategy.description ? ` - ${strategy.description}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={strategy.riskLevel} />
          <StatusBadge status={strategy.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'TVL', value: `$${(Number(strategy.tvl) || 0).toLocaleString()}` },
          { label: 'Win Rate', value: `${(Number(strategy.winRate) || 0).toFixed(1)}%` },
          { label: 'Sharpe Ratio', value: (Number(strategy.sharpeRatio) || 0).toFixed(2) },
          { label: 'Max Drawdown', value: `${(Number(strategy.maxDrawdown) || 0).toFixed(1)}%` },
          ...(pool ? [
            { label: 'Total Deposits', value: `$${(Number(pool.totalDeposits) || 0).toLocaleString()}` },
            { label: 'NAV/Share', value: `$${(Number(pool.navPerShare) || 0).toFixed(4)}` },
            { label: 'Total Shares', value: (Number(pool.totalShares) || 0).toLocaleString() },
            { label: 'Utilization', value: `${(Number(pool.utilizationRate) || 0).toFixed(1)}%` },
          ] : []),
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Performance</h2>
          <PnlBadge value={strategy.totalPnl} />
        </div>
        <PerformanceChart data={chartData} color="blue" />
      </div>

      <DataTable
        columns={[
          { key: 'symbol', header: 'Symbol', render: (r: Position) => <span className="font-medium text-foreground">{r.symbol}</span> },
          { key: 'side', header: 'Side', render: (r: Position) => <span className={r.side === 'long' ? 'text-green-500' : 'text-red-500'}>{r.side}</span> },
          { key: 'entryPrice', header: 'Entry', render: (r: Position) => <span className="text-foreground">${(Number(r.entryPrice) || 0).toFixed(2)}</span> },
          { key: 'currentPrice', header: 'Current', render: (r: Position) => <span className="text-foreground">${(Number(r.currentPrice) || 0).toFixed(2)}</span> },
          { key: 'pnl', header: 'P&L', render: (r: Position) => <PnlBadge value={r.pnl} percent={r.pnlPercent} /> },
          { key: 'leverage', header: 'Leverage', render: (r: Position) => <span className="text-foreground">{r.leverage}x</span> },
        ]}
        data={positions}
        emptyMessage="No open positions"
        emptyIcon="📊"
      />

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border"><h2 className="font-semibold text-foreground">Decision Log</h2></div>
        {decisions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No decisions recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Executed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">P&L</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{d.action}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{d.symbol}</td>
                    <td className="px-4 py-3 w-32"><ConfidenceBar value={d.confidence} /></td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${d.executed ? 'text-green-500' : 'text-gray-500'}`}>{d.executed ? 'Yes' : 'No'}</span></td>
                    <td className="px-4 py-3">{d.pnl != null ? <PnlBadge value={d.pnl} showPercent={false} /> : <span className="text-muted-foreground">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
