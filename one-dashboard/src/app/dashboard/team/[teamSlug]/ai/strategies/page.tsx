'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StrategyCard } from '@/components/ai-forex/StrategyCard';

interface Strategy {
  id: string;
  name: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: string;
  tvl: number;
  winRate: number;
  sharpeRatio: number;
  totalPnl: number;
}

export default function AiStrategiesPage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [risk, setRisk] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchStrategies();
  }, [category, risk, status]);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (risk) params.set('risk_level', risk);
      if (status) params.set('status', status);
      const res = await fetch(`/api/ai/strategies?${params}`);
      const data = await res.json();
      if (data.success) setStrategies(data.data || []);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(strategies.map((s) => s.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Strategies</h1>
        <p className="text-muted-foreground">Browse and monitor AI trading strategies</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">All Risk Levels</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-secondary rounded mb-2" />
              <div className="h-3 w-1/3 bg-secondary rounded mb-4" />
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-10 bg-secondary rounded" />)}
              </div>
            </div>
          ))}
        </div>
      ) : strategies.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No strategies found</h3>
          <p className="text-muted-foreground">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy) => (
            <StrategyCard key={strategy.id} strategy={strategy} teamSlug={teamSlug} />
          ))}
        </div>
      )}
    </div>
  );
}
