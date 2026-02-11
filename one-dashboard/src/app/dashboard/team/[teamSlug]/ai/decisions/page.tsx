'use client';

import { useEffect, useState } from 'react';
import { ConfidenceBar, PnlBadge } from '@/components/ai-forex';
import { useTranslations } from 'next-intl';

interface Decision {
  id: string; strategyId: string; strategyName?: string; action: string; symbol: string;
  confidence: number; executed: boolean; pnl?: number; reasoning?: string; createdAt: string;
}

export default function AiDecisionsPage() {
  const t = useTranslations('ai');
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'executed' | 'skipped'>('all');

  useEffect(() => {
    fetch('/api/ai/strategies')
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.success) return;
        const all: Decision[] = [];
        for (const s of data.data || []) {
          const res = await fetch(`/api/ai/strategies/${s.id}/decisions?limit=50`);
          const decData = await res.json();
          if (decData.success) all.push(...(decData.data || []).map((d: Decision) => ({ ...d, strategyName: d.strategyName || s.name })));
        }
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDecisions(all);
      })
      .catch((e) => console.error('Failed to fetch decisions:', e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? decisions : filter === 'executed' ? decisions.filter((d) => d.executed) : decisions.filter((d) => !d.executed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('decisions.title')}</h1>
        <p className="text-muted-foreground">{t('decisions.subtitle')}</p>
      </div>

      <div className="flex gap-3">
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="all">{t('decisions.allDecisions')}</option>
          <option value="executed">{t('decisions.executed')}</option>
          <option value="skipped">{t('decisions.skipped')}</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">🧠</span></div>
          <p className="text-muted-foreground">No decisions found</p>
        </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reasoning</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.slice(0, 50).map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(d.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{d.strategyName || d.strategyId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{d.action}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{d.symbol}</td>
                    <td className="px-4 py-3 w-32"><ConfidenceBar value={d.confidence} /></td>
                    <td className="px-4 py-3"><span className={`text-xs font-medium ${d.executed ? 'text-green-500' : 'text-gray-500'}`}>{d.executed ? 'Yes' : 'No'}</span></td>
                    <td className="px-4 py-3">{d.pnl != null ? <PnlBadge value={d.pnl} showPercent={false} /> : <span className="text-muted-foreground">-</span>}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{d.reasoning || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
