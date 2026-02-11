'use client';

import { useEffect, useState } from 'react';
import { StatusBadge, PnlBadge, DataTable } from '@/components/ai-forex';
import { useTranslations } from 'next-intl';

interface Investment {
  id: string; userId: string; amount: number; currentValue: number; profit: number;
  profitPercent: number; pairs: string; cycleDays: number; status: string; createdAt: string;
}

export default function ForexInvestmentsPage() {
  const t = useTranslations('forex');
  const tc = useTranslations('common');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchInvestments(); }, [statusFilter]);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/forex/investments?${params}`);
      const data = await res.json();
      if (data.success) setInvestments(data.data || []);
    } catch (error) { console.error('Failed to fetch investments:', error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('investments.title')}</h1>
        <p className="text-muted-foreground">{t('investments.subtitle')}</p>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">{t('investments.allStatuses')}</option>
          <option value="active">{tc('status.active')}</option>
          <option value="matured">{t('investments.matured')}</option>
          <option value="withdrawn">{t('investments.withdrawn')}</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'userId', header: t('columns.user'), render: (r: Investment) => <span className="text-muted-foreground font-mono text-xs">{r.userId.slice(0, 8)}...</span> },
          { key: 'amount', header: t('columns.amount'), render: (r: Investment) => <span className="text-foreground">${(Number(r.amount) || 0).toLocaleString()}</span> },
          { key: 'currentValue', header: t('columns.value'), render: (r: Investment) => <span className="font-medium text-foreground">${(Number(r.currentValue) || 0).toLocaleString()}</span> },
          { key: 'profit', header: t('columns.profit'), render: (r: Investment) => <PnlBadge value={r.profit} percent={r.profitPercent} /> },
          { key: 'pairs', header: t('columns.pairs'), render: (r: Investment) => <span className="text-foreground">{r.pairs || '-'}</span> },
          { key: 'cycleDays', header: t('columns.cycle'), render: (r: Investment) => <span className="text-foreground">{r.cycleDays}d</span> },
          { key: 'status', header: t('columns.status'), render: (r: Investment) => <StatusBadge status={r.status} /> },
        ]}
        data={investments}
        loading={loading}
        emptyMessage={t('investments.noInvestmentsFound')}
        emptyIcon="📈"
      />
    </div>
  );
}
