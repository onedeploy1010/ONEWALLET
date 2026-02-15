'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { PnlBadge } from './PnlBadge';

interface ForexStrategyCardProps {
  strategy: {
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
  };
  teamSlug: string;
  projectId?: string;
}

export function ForexStrategyCard({ strategy, teamSlug, projectId }: ForexStrategyCardProps) {
  const t = useTranslations('forex');
  const basePath = projectId
    ? `/dashboard/team/${teamSlug}/${projectId}`
    : `/dashboard/team/${teamSlug}`;

  return (
    <Link
      href={`${basePath}/forex/strategies/${strategy.id}`}
      className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-[#8B5CF6]/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-[#8B5CF6] transition-colors">
            {strategy.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{strategy.category}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <RiskBadge level={strategy.riskLevel} />
          <StatusBadge status={strategy.status} />
        </div>
      </div>

      {strategy.pairs && strategy.pairs.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {strategy.pairs.slice(0, 3).map((pair) => (
            <span key={pair} className="px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs rounded-md">
              {pair}
            </span>
          ))}
          {strategy.pairs.length > 3 && (
            <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-md">
              +{strategy.pairs.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('strategyCard.aum')}</p>
          <p className="text-sm font-semibold text-foreground">
            ${(Number(strategy.aum) || 0).toLocaleString()}
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
