'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ForexStrategyCard } from '@/components/ai-forex';
import { useTranslations } from 'next-intl';

interface Strategy {
  id: string;
  name: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: string;
  aum: number;
  winRate: number;
  sharpeRatio: number;
  totalPnl: number;
  pairs?: string[];
}

export default function ForexStrategiesPage() {
  const params = useParams();
  const t = useTranslations('forex');
  const tc = useTranslations('common');
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [risk, setRisk] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchStrategies();
  }, [category, risk, status, projectId]);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (risk) params.set('risk_level', risk);
      if (status) params.set('status', status);
      if (projectId) params.set('project_id', projectId);
      const res = await fetch(`/api/forex/strategies?${params}`);
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
        <h1 className="text-2xl font-bold text-foreground">{t('strategies.title')}</h1>
        <p className="text-muted-foreground">{t('strategies.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">{t('strategies.allCategories')}</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={risk} onChange={(e) => setRisk(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">{t('strategies.allRiskLevels')}</option>
          <option value="low">{tc('risk.low')}</option>
          <option value="medium">{tc('risk.medium')}</option>
          <option value="high">{tc('risk.high')}</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 bg-secondary/50 border border-border rounded-xl text-sm text-foreground">
          <option value="">{t('strategies.allStatuses')}</option>
          <option value="active">{tc('status.active')}</option>
          <option value="paused">{tc('status.paused')}</option>
          <option value="stopped">{tc('status.stopped')}</option>
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
          <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('strategies.noStrategiesFound')}</h3>
          <p className="text-muted-foreground">{t('strategies.adjustFilters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strategy) => (
            <ForexStrategyCard key={strategy.id} strategy={strategy} teamSlug={teamSlug} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}
