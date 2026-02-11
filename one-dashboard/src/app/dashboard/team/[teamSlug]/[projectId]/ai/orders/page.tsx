'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge, PnlBadge, DataTable } from '@/components/ai-forex';
import { useTranslations } from 'next-intl';

interface Order {
  id: string; userId: string; strategyId: string; strategyName?: string; amount: number;
  shares: number; status: string; pnl: number; pnlPercent: number; createdAt: string;
}

export default function AiOrdersPage() {
  const params = useParams();
  const t = useTranslations('ai');
  const tc = useTranslations('common');
  const projectId = params.projectId as string;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchOrders(); }, [statusFilter, projectId]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter) queryParams.set('status', statusFilter);
      if (projectId) queryParams.set('project_id', projectId);
      const res = await fetch(`/api/ai/orders?${queryParams}`);
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch (error) { console.error('Failed to fetch orders:', error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('orders.title')}</h1>
        <p className="text-muted-foreground">{t('orders.subtitle')}</p>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">{t('orders.allStatuses')}</option>
          <option value="pending">{tc('status.pending')}</option>
          <option value="active">{tc('status.active')}</option>
          <option value="redeemed">{t('orders.redeemed')}</option>
          <option value="cancelled">{tc('status.cancelled')}</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'userId', header: t('columns.user'), render: (r: Order) => <span className="text-muted-foreground font-mono text-xs">{r.userId.slice(0, 8)}...</span> },
          { key: 'strategyName', header: t('columns.strategy'), render: (r: Order) => <span className="font-medium text-foreground">{r.strategyName || '-'}</span> },
          { key: 'amount', header: t('columns.amount'), render: (r: Order) => <span className="text-foreground">${(Number(r.amount) || 0).toLocaleString()}</span> },
          { key: 'shares', header: t('columns.shares'), render: (r: Order) => <span className="text-foreground">{(Number(r.shares) || 0).toFixed(4)}</span> },
          { key: 'status', header: t('columns.status'), render: (r: Order) => <StatusBadge status={r.status} /> },
          { key: 'pnl', header: t('columns.pnl'), render: (r: Order) => <PnlBadge value={r.pnl} percent={r.pnlPercent} /> },
          { key: 'createdAt', header: t('columns.date'), render: (r: Order) => <span className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleDateString()}</span> },
        ]}
        data={orders}
        loading={loading}
        emptyMessage={t('orders.noOrdersFound')}
        emptyIcon="📋"
      />
    </div>
  );
}
