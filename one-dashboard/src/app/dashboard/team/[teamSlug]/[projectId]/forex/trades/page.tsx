'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge, PnlBadge, DataTable } from '@/components/ai-forex';
import { useTranslations } from 'next-intl';

interface Trade {
  id: string; pair: string; side: string; lots: number; pips: number; pnl: number;
  status: string; openedAt: string; closedAt?: string;
}

export default function ForexTradesPage() {
  const params = useParams();
  const t = useTranslations('forex');
  const tc = useTranslations('common');
  const projectId = params.projectId as string;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pairFilter, setPairFilter] = useState('');

  useEffect(() => { fetchTrades(); }, [statusFilter, pairFilter, projectId]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.set('status', statusFilter);
      if (pairFilter) queryParams.set('pair', pairFilter);
      if (projectId) queryParams.set('project_id', projectId);
      const res = await fetch(`/api/forex/trades?${queryParams}`);
      const data = await res.json();
      if (data.success) setTrades(data.data || []);
    } catch (error) { console.error('Failed to fetch trades:', error); }
    finally { setLoading(false); }
  };

  const pairs = Array.from(new Set(trades.map((t) => t.pair).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('trades.title')}</h1>
        <p className="text-muted-foreground">{t('trades.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">{t('trades.allStatuses')}</option>
          <option value="open">{t('trades.open')}</option>
          <option value="closed">{t('trades.closed')}</option>
          <option value="cancelled">{tc('status.cancelled')}</option>
        </select>
        <select value={pairFilter} onChange={(e) => setPairFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">{t('trades.allPairs')}</option>
          {pairs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'pair', header: t('columns.pair'), render: (r: Trade) => <span className="font-medium text-foreground">{r.pair}</span> },
          { key: 'side', header: t('columns.side'), render: (r: Trade) => <span className={`font-medium ${r.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{r.side}</span> },
          { key: 'lots', header: t('columns.lots'), render: (r: Trade) => <span className="text-foreground">{r.lots}</span> },
          { key: 'pips', header: t('columns.pips'), render: (r: Trade) => <span className={`font-medium ${(Number(r.pips) || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{(Number(r.pips) || 0) >= 0 ? '+' : ''}{Number(r.pips) || 0}</span> },
          { key: 'pnl', header: t('columns.pnl'), render: (r: Trade) => <PnlBadge value={r.pnl} showPercent={false} /> },
          { key: 'status', header: t('columns.status'), render: (r: Trade) => <StatusBadge status={r.status} /> },
          { key: 'openedAt', header: t('columns.date'), render: (r: Trade) => <span className="text-muted-foreground text-sm">{new Date(r.openedAt).toLocaleDateString()}</span> },
        ]}
        data={trades}
        loading={loading}
        emptyMessage={t('trades.noTrades')}
        emptyIcon="💱"
      />
    </div>
  );
}
