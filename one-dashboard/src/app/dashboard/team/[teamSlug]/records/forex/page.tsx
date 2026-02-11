'use client';

import { useEffect, useState } from 'react';
import { StatusBadge, PnlBadge, DataTable } from '@/components/ai-forex';
import { useTranslations } from 'next-intl';

interface Investment {
  id: string; userId: string; amount: number; currentValue: number; profit: number;
  profitPercent: number; pairs: string; cycleDays: number; status: string; createdAt: string;
}
interface Trade {
  id: string; pair: string; side: string; lots: number; pips: number; pnl: number;
  status: string; openedAt: string;
}

export default function ForexActivityPage() {
  const t = useTranslations('records');
  const [tab, setTab] = useState<'investments' | 'trades'>('investments');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/forex/investments').then((r) => r.json()),
      fetch('/api/forex/trades').then((r) => r.json()),
    ]).then(([invData, tradeData]) => {
      if (invData.success) setInvestments(invData.data || []);
      if (tradeData.success) setTrades(tradeData.data || []);
    }).catch((e) => console.error('Failed to fetch forex activity:', e))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('forex.title')}</h1>
        <p className="text-muted-foreground">{t('forex.subtitle')}</p>
      </div>

      <div className="inline-flex bg-secondary/50 rounded-xl p-1">
        <button onClick={() => setTab('investments')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'investments' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{t('forex.investmentHistory')}</button>
        <button onClick={() => setTab('trades')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'trades' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{t('forex.tradeHistory')}</button>
      </div>

      {tab === 'investments' && (
        <DataTable
          columns={[
            { key: 'userId', header: t('forex.columns.user'), render: (r: Investment) => <span className="text-muted-foreground font-mono text-xs">{r.userId.slice(0, 8)}...</span> },
            { key: 'amount', header: t('forex.columns.amount'), render: (r: Investment) => <span className="text-foreground">${r.amount.toLocaleString()}</span> },
            { key: 'currentValue', header: t('forex.columns.value'), render: (r: Investment) => <span className="font-medium text-foreground">${r.currentValue.toLocaleString()}</span> },
            { key: 'profit', header: t('forex.columns.profit'), render: (r: Investment) => <PnlBadge value={r.profit} percent={r.profitPercent} /> },
            { key: 'pairs', header: t('forex.columns.pairs'), render: (r: Investment) => <span className="text-foreground">{r.pairs || '-'}</span> },
            { key: 'cycleDays', header: t('forex.columns.cycle'), render: (r: Investment) => <span className="text-foreground">{r.cycleDays}d</span> },
            { key: 'status', header: t('forex.columns.status'), render: (r: Investment) => <StatusBadge status={r.status} /> },
          ]}
          data={investments}
          loading={loading}
          emptyMessage={t('forex.noInvestmentHistory')}
          emptyIcon="📈"
        />
      )}

      {tab === 'trades' && (
        <DataTable
          columns={[
            { key: 'pair', header: t('forex.columns.pair'), render: (r: Trade) => <span className="font-medium text-foreground">{r.pair}</span> },
            { key: 'side', header: t('forex.columns.side'), render: (r: Trade) => <span className={`font-medium ${r.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{r.side}</span> },
            { key: 'lots', header: t('forex.columns.lots'), render: (r: Trade) => <span className="text-foreground">{r.lots}</span> },
            { key: 'pips', header: t('forex.columns.pips'), render: (r: Trade) => <span className={`font-medium ${r.pips >= 0 ? 'text-green-500' : 'text-red-500'}`}>{r.pips >= 0 ? '+' : ''}{r.pips}</span> },
            { key: 'pnl', header: t('forex.columns.pnl'), render: (r: Trade) => <PnlBadge value={r.pnl} showPercent={false} /> },
            { key: 'status', header: t('forex.columns.status'), render: (r: Trade) => <StatusBadge status={r.status} /> },
            { key: 'openedAt', header: t('forex.columns.date'), render: (r: Trade) => <span className="text-muted-foreground text-sm">{new Date(r.openedAt).toLocaleDateString()}</span> },
          ]}
          data={trades}
          loading={loading}
          emptyMessage={t('forex.noTradeHistory')}
          emptyIcon="💱"
        />
      )}
    </div>
  );
}
