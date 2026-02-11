'use client';

import { useEffect, useState } from 'react';
import { PnlBadge, DataTable } from '@/components/ai-forex';
import { useTranslations } from 'next-intl';

interface Position {
  id: string; strategyId: string; symbol: string; side: string; entryPrice: number;
  currentPrice: number; quantity: number; leverage: number; pnl: number; pnlPercent: number; openedAt: string;
}

export default function AiPositionsPage() {
  const t = useTranslations('ai');
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
        <h1 className="text-2xl font-bold text-foreground">{t('positions.title')}</h1>
        <p className="text-muted-foreground">{t('positions.subtitle')}</p>
      </div>

      <DataTable
        columns={[
          { key: 'symbol', header: t('columns.symbol'), render: (r: Position) => <span className="font-medium text-foreground">{r.symbol}</span> },
          { key: 'side', header: t('columns.side'), render: (r: Position) => <span className={`font-medium ${r.side === 'long' ? 'text-green-500' : 'text-red-500'}`}>{r.side}</span> },
          { key: 'entryPrice', header: t('columns.entryPrice'), render: (r: Position) => <span className="text-foreground">${(Number(r.entryPrice) || 0).toFixed(2)}</span> },
          { key: 'currentPrice', header: t('columns.currentPrice'), render: (r: Position) => <span className="text-foreground">${(Number(r.currentPrice) || 0).toFixed(2)}</span> },
          { key: 'pnl', header: t('columns.pnl'), render: (r: Position) => <PnlBadge value={r.pnl} percent={r.pnlPercent} /> },
          { key: 'leverage', header: t('columns.leverage'), render: (r: Position) => <span className="text-foreground">{r.leverage}x</span> },
          { key: 'strategyId', header: t('columns.strategy'), render: (r: Position) => <span className="text-muted-foreground font-mono text-xs">{r.strategyId.slice(0, 8)}...</span> },
        ]}
        data={positions}
        loading={loading}
        emptyMessage={t('positions.noPositions')}
        emptyIcon="📊"
      />
    </div>
  );
}
