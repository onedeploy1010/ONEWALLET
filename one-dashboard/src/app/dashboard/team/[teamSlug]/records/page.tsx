'use client';

import { useEffect, useState } from 'react';
import { PeriodSelector, ActivityFeed } from '@/components/ai-forex';

interface ActivityItem {
  id: string;
  type: 'ai_order' | 'ai_decision' | 'forex_trade' | 'forex_investment';
  title: string;
  description: string;
  timestamp: string;
}

export default function ClientRecordsPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { fetchActivity(); }, []);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/usage/ai-forex?limit=50');
      const data = await res.json();
      if (data.success) setItems(data.data || []);
    } catch (error) { console.error('Failed to fetch activity:', error); }
    finally { setLoading(false); }
  };

  const filtered = typeFilter === 'all' ? items : items.filter((i) => {
    if (typeFilter === 'ai') return i.type.startsWith('ai_');
    if (typeFilter === 'forex') return i.type.startsWith('forex_');
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Client Records</h1>
        <p className="text-muted-foreground">Unified activity feed for AI and Forex operations</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <PeriodSelector value={period} onChange={setPeriod} />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="all">All Activity</option>
          <option value="ai">AI Only</option>
          <option value="forex">Forex Only</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <ActivityFeed items={filtered} loading={loading} />
      </div>
    </div>
  );
}
