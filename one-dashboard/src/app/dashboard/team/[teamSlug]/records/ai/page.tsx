'use client';

import { useEffect, useState } from 'react';
import { StatusBadge, PnlBadge, ConfidenceBar, DataTable } from '@/components/ai-forex';

interface Order {
  id: string; userId: string; strategyName?: string; amount: number; shares: number;
  status: string; pnl: number; pnlPercent: number; createdAt: string;
}
interface Decision {
  id: string; strategyName?: string; action: string; symbol: string;
  confidence: number; executed: boolean; pnl?: number; reasoning?: string; createdAt: string;
}

export default function AiActivityPage() {
  const [tab, setTab] = useState<'orders' | 'decisions'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/ai/orders').then((r) => r.json()),
      fetch('/api/ai/strategies').then((r) => r.json()).then(async (data) => {
        const all: Decision[] = [];
        for (const s of data.data || []) {
          const res = await fetch(`/api/ai/strategies/${s.id}/decisions?limit=50`);
          const d = await res.json();
          if (d.success) all.push(...(d.data || []).map((dec: Decision) => ({ ...dec, strategyName: dec.strategyName || s.name })));
        }
        return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }),
    ]).then(([orderData, decisionData]) => {
      if (orderData.success) setOrders(orderData.data || []);
      setDecisions(decisionData);
    }).catch((e) => console.error('Failed to fetch AI activity:', e))
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Activity</h1>
        <p className="text-muted-foreground">Complete AI trading activity history</p>
      </div>

      <div className="inline-flex bg-secondary/50 rounded-xl p-1">
        <button onClick={() => setTab('orders')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'orders' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Orders History</button>
        <button onClick={() => setTab('decisions')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'decisions' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Decision History</button>
      </div>

      {tab === 'orders' && (
        <DataTable
          columns={[
            { key: 'userId', header: 'User', render: (r: Order) => <span className="text-muted-foreground font-mono text-xs">{r.userId.slice(0, 8)}...</span> },
            { key: 'strategyName', header: 'Strategy', render: (r: Order) => <span className="text-foreground">{r.strategyName || '-'}</span> },
            { key: 'amount', header: 'Amount', render: (r: Order) => <span className="text-foreground">${r.amount.toLocaleString()}</span> },
            { key: 'shares', header: 'Shares', render: (r: Order) => <span className="text-foreground">{r.shares.toFixed(4)}</span> },
            { key: 'status', header: 'Status', render: (r: Order) => <StatusBadge status={r.status} /> },
            { key: 'pnl', header: 'P&L', render: (r: Order) => <PnlBadge value={r.pnl} percent={r.pnlPercent} /> },
            { key: 'createdAt', header: 'Date', render: (r: Order) => <span className="text-muted-foreground text-sm">{new Date(r.createdAt).toLocaleDateString()}</span> },
          ]}
          data={orders}
          loading={loading}
          emptyMessage="No order history"
          emptyIcon="📋"
        />
      )}

      {tab === 'decisions' && (
        loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}</div>
        ) : decisions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center"><p className="text-muted-foreground">No decision history</p></div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Strategy</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Confidence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Executed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">P&L</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {decisions.slice(0, 50).map((d) => (
                    <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{d.strategyName}</td>
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
          </div>
        )
      )}
    </div>
  );
}
