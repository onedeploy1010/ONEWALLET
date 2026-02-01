'use client';

import { useEffect, useState } from 'react';
import { StatusBadge, PnlBadge, DataTable } from '@/components/ai-forex';

interface Trade {
  id: string; pair: string; side: string; lots: number; pips: number; pnl: number;
  status: string; openedAt: string; closedAt?: string;
}

export default function ForexTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pairFilter, setPairFilter] = useState('');

  useEffect(() => { fetchTrades(); }, [statusFilter, pairFilter]);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (pairFilter) params.set('pair', pairFilter);
      const res = await fetch(`/api/forex/trades?${params}`);
      const data = await res.json();
      if (data.success) setTrades(data.data || []);
    } catch (error) { console.error('Failed to fetch trades:', error); }
    finally { setLoading(false); }
  };

  const pairs = Array.from(new Set(trades.map((t) => t.pair).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Forex Trades</h1>
        <p className="text-muted-foreground">View forex trade history and open positions</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={pairFilter} onChange={(e) => setPairFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">All Pairs</option>
          {pairs.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable
        columns={[
          { key: 'pair', header: 'Pair', render: (r: Trade) => <span className="font-medium text-foreground">{r.pair}</span> },
          { key: 'side', header: 'Side', render: (r: Trade) => <span className={`font-medium ${r.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{r.side}</span> },
          { key: 'lots', header: 'Lots', render: (r: Trade) => <span className="text-foreground">{r.lots}</span> },
          { key: 'pips', header: 'Pips', render: (r: Trade) => <span className={`font-medium ${r.pips >= 0 ? 'text-green-500' : 'text-red-500'}`}>{r.pips >= 0 ? '+' : ''}{r.pips}</span> },
          { key: 'pnl', header: 'P&L', render: (r: Trade) => <PnlBadge value={r.pnl} showPercent={false} /> },
          { key: 'status', header: 'Status', render: (r: Trade) => <StatusBadge status={r.status} /> },
          { key: 'openedAt', header: 'Date', render: (r: Trade) => <span className="text-muted-foreground text-sm">{new Date(r.openedAt).toLocaleDateString()}</span> },
        ]}
        data={trades}
        loading={loading}
        emptyMessage="No trades found"
        emptyIcon="💱"
      />
    </div>
  );
}
