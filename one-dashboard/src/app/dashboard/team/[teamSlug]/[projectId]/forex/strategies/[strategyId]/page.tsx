'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { StatusBadge, RiskBadge, PnlBadge, ConfidenceBar, PerformanceChart, DataTable } from '@/components/ai-forex';

interface Strategy {
  id: string;
  name: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: string;
  description?: string;
  aum: number;
  winRate: number;
  sharpeRatio: number;
  totalPnl: number;
  maxDrawdown: number;
  pairs?: string[];
}

interface Pool {
  totalDeposits: number;
  totalShares: number;
  navPerShare: number;
  utilizationRate: number;
}

interface Trade {
  id: string;
  pair: string;
  side: string;
  entryPrice: number;
  currentPrice: number;
  lots: number;
  pips: number;
  pnl: number;
  pnlPercent: number;
  openedAt: string;
  status: string;
}

interface Decision {
  id: string;
  action: string;
  pair: string;
  confidence: number;
  executed: boolean;
  pnl?: number;
  reasoning?: string;
  createdAt: string;
}

interface Snapshot {
  snapshotDate: string;
  nav: number;
  aum: number;
  pnl: number;
}

export default function ForexStrategyDetailPage() {
  const t = useTranslations('forex');
  const tr = useTranslations('records');
  const params = useParams();
  const strategyId = params.strategyId as string;
  const projectId = params.projectId as string;
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [pool, setPool] = useState<Pool | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, [strategyId, projectId]);

  const fetchAll = async () => {
    try {
      const projectParam = projectId ? `project_id=${projectId}` : '';
      const [detailRes, tradesRes, perfRes, decRes] = await Promise.all([
        fetch(`/api/forex/strategies/${strategyId}`),
        fetch(`/api/forex/strategies/${strategyId}/trades?${projectParam}`),
        fetch(`/api/forex/strategies/${strategyId}/performance?days=90`),
        fetch(`/api/forex/strategies/${strategyId}/decisions?limit=20&${projectParam}`),
      ]);
      const [detail, tradesData, perf, dec] = await Promise.all([
        detailRes.json(),
        tradesRes.json(),
        perfRes.json(),
        decRes.json(),
      ]);
      if (detail.success) {
        setStrategy(detail.data.strategy);
        setPool(detail.data.pool);
      }
      if (tradesData.success) setTrades(tradesData.data || []);
      if (perf.success) setSnapshots(perf.data || []);
      if (dec.success) setDecisions(dec.data || []);
    } catch (error) {
      console.error('Failed to fetch strategy detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-secondary rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-semibold text-foreground">{t('strategyDetail.notFound')}</h3>
      </div>
    );
  }

  const chartData = snapshots.map((s) => ({
    date: new Date(s.snapshotDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    value: s.nav,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{strategy.name}</h1>
          <p className="text-muted-foreground">
            {strategy.category}
            {strategy.description ? ` - ${strategy.description}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={strategy.riskLevel} />
          <StatusBadge status={strategy.status} />
        </div>
      </div>

      {strategy.pairs && strategy.pairs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">{t('strategyDetail.pairs')}:</span>
          {strategy.pairs.map((pair) => (
            <span key={pair} className="px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-sm rounded-md font-medium">
              {pair}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('strategyDetail.aum'), value: `$${(Number(strategy.aum) || 0).toLocaleString()}` },
          { label: t('strategyDetail.winRate'), value: `${(Number(strategy.winRate) || 0).toFixed(1)}%` },
          { label: t('strategyDetail.sharpeRatio'), value: (Number(strategy.sharpeRatio) || 0).toFixed(2) },
          { label: t('strategyDetail.maxDrawdown'), value: `${(Number(strategy.maxDrawdown) || 0).toFixed(1)}%` },
          ...(pool
            ? [
                { label: t('strategyDetail.totalDeposits'), value: `$${(Number(pool.totalDeposits) || 0).toLocaleString()}` },
                { label: t('strategyDetail.navPerShare'), value: `$${(Number(pool.navPerShare) || 0).toFixed(4)}` },
                { label: t('strategyDetail.totalShares'), value: (Number(pool.totalShares) || 0).toLocaleString() },
                { label: t('strategyDetail.utilization'), value: `${(Number(pool.utilizationRate) || 0).toFixed(1)}%` },
              ]
            : []),
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('strategyDetail.performance')}</h2>
          <PnlBadge value={strategy.totalPnl} />
        </div>
        <PerformanceChart data={chartData} color="purple" />
      </div>

      <DataTable
        columns={[
          { key: 'pair', header: t('columns.pair'), render: (r: Trade) => <span className="font-medium text-foreground">{r.pair}</span> },
          { key: 'side', header: t('columns.side'), render: (r: Trade) => <span className={r.side === 'buy' ? 'text-green-500' : 'text-red-500'}>{r.side}</span> },
          { key: 'entryPrice', header: t('strategyDetail.entry'), render: (r: Trade) => <span className="text-foreground">{(Number(r.entryPrice) || 0).toFixed(5)}</span> },
          { key: 'currentPrice', header: t('strategyDetail.current'), render: (r: Trade) => <span className="text-foreground">{(Number(r.currentPrice) || 0).toFixed(5)}</span> },
          { key: 'lots', header: t('columns.lots'), render: (r: Trade) => <span className="text-foreground">{r.lots}</span> },
          { key: 'pips', header: t('columns.pips'), render: (r: Trade) => <span className={Number(r.pips) >= 0 ? 'text-green-500' : 'text-red-500'}>{Number(r.pips) >= 0 ? '+' : ''}{r.pips}</span> },
          { key: 'pnl', header: t('columns.pnl'), render: (r: Trade) => <PnlBadge value={r.pnl} percent={r.pnlPercent} /> },
        ]}
        data={trades}
        emptyMessage={t('trades.noTrades')}
        emptyIcon="📊"
      />

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{tr('decisions.title')}</h2>
        </div>
        {decisions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">{t('strategyDetail.noDecisions')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{tr('columns.time')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{tr('columns.action')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.pair')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{tr('columns.confidence')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{tr('decisions.executed')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.pnl')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{d.action}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{d.pair}</td>
                    <td className="px-4 py-3 w-32"><ConfidenceBar value={d.confidence} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${d.executed ? 'text-green-500' : 'text-gray-500'}`}>
                        {d.executed ? tr('ai.yes') : tr('ai.no')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.pnl != null ? <PnlBadge value={d.pnl} showPercent={false} /> : <span className="text-muted-foreground">-</span>}
                    </td>
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
