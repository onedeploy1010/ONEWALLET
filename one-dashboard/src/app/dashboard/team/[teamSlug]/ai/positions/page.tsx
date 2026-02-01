'use client';

import { useEffect, useState } from 'react';
import { PnlBadge, DataTable } from '@/components/ai-forex';

interface Position {
  id: string; strategyId: string; symbol: string; side: string; entryPrice: number;
  currentPrice: number; quantity: number; leverage: number; pnl: number; pnlPercent: number; openedAt: string;
}

export default function AiPositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/strategies')
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.success) return;
        const allPositions: Position[] = [];
        for (const s of data.data || []) {
          const res = await fetch(`/api/ai/strategies/${s.id}/positions`);
          const posData = await res.json();
          if (posData.success) allPositions.push(...(posData.data || []));
        }
        setPositions(allPositions);
      })
      .catch((e) => console.error('Failed to fetch positions:', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Open Positions</h1>
        <p className="text-muted-foreground">All currently open AI trading positions</p>
      </div>

      <DataTable
        columns={[
          { key: 'symbol', header: 'Symbol', render: (r: Position) => <span className="font-medium text-foreground">{r.symbol}</span> },
          { key: 'side', header: 'Side', render: (r: Position) => <span className={`font-medium ${r.side === 'long' ? 'text-green-500' : 'text-red-500'}`}>{r.side}</span> },
          { key: 'entryPrice', header: 'Entry Price', render: (r: Position) => <span className="text-foreground">${r.entryPrice.toFixed(2)}</span> },
          { key: 'currentPrice', header: 'Current Price', render: (r: Position) => <span className="text-foreground">${r.currentPrice.toFixed(2)}</span> },
          { key: 'pnl', header: 'P&L', render: (r: Position) => <PnlBadge value={r.pnl} percent={r.pnlPercent} /> },
          { key: 'leverage', header: 'Leverage', render: (r: Position) => <span className="text-foreground">{r.leverage}x</span> },
          { key: 'strategyId', header: 'Strategy', render: (r: Position) => <span className="text-muted-foreground font-mono text-xs">{r.strategyId.slice(0, 8)}...</span> },
        ]}
        data={positions}
        loading={loading}
        emptyMessage="No open positions"
        emptyIcon="📊"
      />
    </div>
  );
}
