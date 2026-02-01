'use client';

import { useEffect, useState } from 'react';
import { StatusBadge, PnlBadge, DataTable } from '@/components/ai-forex';

interface Investment {
  id: string; userId: string; amount: number; currentValue: number; profit: number;
  profitPercent: number; pairs: string; cycleDays: number; status: string; createdAt: string;
}

export default function ForexInvestmentsPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Forex Investments</h1>
        <p className="text-muted-foreground">View and manage forex investment positions</p>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="matured">Matured</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'userId', header: 'User', render: (r: Investment) => <span className="text-muted-foreground font-mono text-xs">{r.userId.slice(0, 8)}...</span> },
          { key: 'amount', header: 'Amount', render: (r: Investment) => <span className="text-foreground">${r.amount.toLocaleString()}</span> },
          { key: 'currentValue', header: 'Value', render: (r: Investment) => <span className="font-medium text-foreground">${r.currentValue.toLocaleString()}</span> },
          { key: 'profit', header: 'Profit', render: (r: Investment) => <PnlBadge value={r.profit} percent={r.profitPercent} /> },
          { key: 'pairs', header: 'Pairs', render: (r: Investment) => <span className="text-foreground">{r.pairs || '-'}</span> },
          { key: 'cycleDays', header: 'Cycle', render: (r: Investment) => <span className="text-foreground">{r.cycleDays}d</span> },
          { key: 'status', header: 'Status', render: (r: Investment) => <StatusBadge status={r.status} /> },
        ]}
        data={investments}
        loading={loading}
        emptyMessage="No investments found"
        emptyIcon="📈"
      />
    </div>
  );
}
