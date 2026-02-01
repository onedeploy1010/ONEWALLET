'use client';

import Link from 'next/link';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { PnlBadge } from './PnlBadge';

interface StrategyCardProps {
  strategy: {
    id: string;
    name: string;
    category: string;
    riskLevel: 'low' | 'medium' | 'high';
    status: string;
    tvl: number;
    winRate: number;
    sharpeRatio: number;
    totalPnl: number;
  };
  teamSlug: string;
}

export function StrategyCard({ strategy, teamSlug }: StrategyCardProps) {
  return (
    <Link
      href={`/dashboard/team/${teamSlug}/ai/strategies/${strategy.id}`}
      className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-[#188775]/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-[#188775] transition-colors">
            {strategy.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{strategy.category}</p>
        </div>
        <StatusBadge status={strategy.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">TVL</p>
          <p className="text-sm font-semibold text-foreground">
            ${strategy.tvl.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Win Rate</p>
          <p className="text-sm font-semibold text-foreground">
            {strategy.winRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sharpe</p>
          <p className="text-sm font-semibold text-foreground">
            {strategy.sharpeRatio.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">P&L</p>
          <PnlBadge value={strategy.totalPnl} />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50">
        <RiskBadge level={strategy.riskLevel} />
      </div>
    </Link>
  );
}
