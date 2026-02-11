'use client';

import { useTranslations } from 'next-intl';
import { StatusBadge } from './StatusBadge';

interface PoolCardProps {
  pool: {
    id: string;
    name: string;
    type: string;
    poolSize: number;
    utilization: number;
    allocation: Record<string, number>;
    status: string;
  };
}

export function PoolCard({ pool }: PoolCardProps) {
  const t = useTranslations('forex');
  const allocationEntries = Object.entries(pool.allocation || {});

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground">{pool.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{pool.type}</p>
        </div>
        <StatusBadge status={pool.status} />
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('poolCard.poolSize')}</span>
            <span className="font-medium text-foreground">${(Number(pool.poolSize) || 0).toLocaleString()}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t('poolCard.utilization')}</span>
            <span className="font-medium text-foreground">{(Number(pool.utilization) || 0).toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]"
              style={{ width: `${Math.min(100, Number(pool.utilization) || 0)}%` }}
            />
          </div>
        </div>

        {allocationEntries.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">{t('poolCard.allocation')}</p>
            <div className="space-y-1">
              {allocationEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{key}</span>
                  <span className="font-medium text-foreground">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
