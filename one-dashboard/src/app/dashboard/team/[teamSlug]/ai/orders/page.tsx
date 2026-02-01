'use client';

import { useEffect, useState } from 'react';
import { StatusBadge, PnlBadge, DataTable } from '@/components/ai-forex';

interface Order {
  id: string; userId: string; strategyId: string; strategyName?: string; amount: number;
  shares: number; status: string; pnl: number; pnlPercent: number; createdAt: string;
}

export default function AiOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/ai/orders?${params}`);
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch (error) { console.error('Failed to fetch orders:', error); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Orders</h1>
        <p className="text-muted-foreground">View and filter AI trading orders</p>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="redeemed">Redeemed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'userId', header: 'User', render: (r: Order) => <span className="text-muted-foreground font-mono text-xs">{r.userId.slice(0, 8)}...</span> },
          { key: 'strategyName', header: 'Strategy', render: (r: Order) => <span className="font-medium text-foreground">{r.strategyName || '-'}</span> },
          { key: 'amount', header: 'Amount', render: (r: Order) => <span className="text-foreground">${r.amount.toLocaleString()}</span> },
          { key: 'shares', header: 'Shares', render: (r: Order) => <span className="text-foreground">{r.shares.toFixed(4)}</span> },
          { key: 'status', header: 'Status', render: (r: Order) => <StatusBadge status={r.status} /> },
          { key: 'pnl', header: 'P&L', render: (r: Order) => <PnlBadge value={r.pnl} percent={r.pnlPercent} /> },
          { key: 'createdAt', header: 'Date', render: (r: Order) => <span className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleDateString()}</span> },
        ]}
        data={orders}
        loading={loading}
        emptyMessage="No orders found"
        emptyIcon="📋"
      />
    </div>
  );
}
