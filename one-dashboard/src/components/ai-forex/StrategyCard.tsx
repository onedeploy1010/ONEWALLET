'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { PnlBadge } from './PnlBadge';

interface StrategyCardProps {
  strategy: {
    id: string;
    name: string;
    category: string;
    strategyType?: 'crypto' | 'forex';
    riskLevel: 'low' | 'medium' | 'high';
    status: string;
    description?: string;
    tvl: number;
    winRate: number;
    sharpeRatio: number;
    totalPnl: number;
    supportedPairs?: string[];
  };
  teamSlug: string;
  projectId?: string;
}

export function StrategyCard({ strategy, teamSlug, projectId }: StrategyCardProps) {
  const t = useTranslations('ai');
  const basePath = projectId
    ? `/dashboard/team/${teamSlug}/${projectId}`
    : `/dashboard/team/${teamSlug}`;

  return (
    <Link
      href={`${basePath}/ai/strategies/${strategy.id}`}
      className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-[#2563EB]/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground group-hover:text-[#2563EB] transition-colors">
              {strategy.name}
            </h3>
            {strategy.strategyType && (
              <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                strategy.strategyType === 'crypto'
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'bg-green-500/10 text-green-500'
              }`}>
                {strategy.strategyType === 'crypto' ? '₿ Crypto' : '$ Forex'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{strategy.category}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <RiskBadge level={strategy.riskLevel} />
          <StatusBadge status={strategy.status} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('strategyCard.tvl')}</p>
          <p className="text-sm font-semibold text-foreground">
            ${(Number(strategy.tvl) || 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('strategyCard.winRate')}</p>
          <p className="text-sm font-semibold text-foreground">
            {(Number(strategy.winRate) || 0).toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('strategyCard.sharpe')}</p>
          <p className="text-sm font-semibold text-foreground">
            {(Number(strategy.sharpeRatio) || 0).toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('strategyCard.pnl')}</p>
          <PnlBadge value={strategy.totalPnl} />
        </div>
      </div>
    </Link>
  );
}
