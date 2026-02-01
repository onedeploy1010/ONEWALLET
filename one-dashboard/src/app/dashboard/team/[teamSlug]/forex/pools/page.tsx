'use client';

import { useEffect, useState } from 'react';
import { PoolCard } from '@/components/ai-forex/PoolCard';

interface Pool {
  id: string; name: string; type: string; poolSize: number; utilization: number;
  allocation: Record<string, number>; status: string;
}

export default function ForexPoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/forex/pools')
      .then((r) => r.json())
      .then((data) => { if (data.success) setPools(data.data || []); })
      .catch((e) => console.error('Failed to fetch pools:', e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Forex Pools</h1>
        <p className="text-muted-foreground">Monitor forex liquidity pools and utilization</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-secondary rounded mb-2" />
              <div className="h-3 w-1/3 bg-secondary rounded mb-4" />
              <div className="space-y-3">
                <div className="h-8 bg-secondary rounded" />
                <div className="h-8 bg-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : pools.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏊</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No pools found</h3>
          <p className="text-muted-foreground">Forex pools will appear here when created</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map((pool) => <PoolCard key={pool.id} pool={pool} />)}
        </div>
      )}
    </div>
  );
}
