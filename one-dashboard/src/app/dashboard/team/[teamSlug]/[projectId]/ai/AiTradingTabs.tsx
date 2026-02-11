'use client';

import { useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

// ── Icons ────────────────────────────────────────────────────
const AumIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const StrategyIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const OrderIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const WinRateIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const SharpeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const ProfitIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1" />
  </svg>
);
const TradeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);
const ActiveIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);
const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ── Color maps ───────────────────────────────────────────────
const riskColors: Record<string, string> = {
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
};
const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  stopped: 'bg-red-500/10 text-red-500 border-red-500/20',
  pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  redeemed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  cancelled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  matured: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  withdrawn: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

// ── Types ────────────────────────────────────────────────────
interface CryptoStats {
  totalAum: number;
  totalStrategies: number;
  activeStrategies: number;
  totalOrders: number;
  avgWinRate: number;
  avgSharpe: number;
  totalProfit: number;
}
interface ForexStats {
  totalInvested: number;
  totalValue: number;
  totalProfit: number;
  activeInvestments: number;
  totalTrades: number;
}

interface AiTradingTabsProps {
  baseUrl: string;
  cryptoStats: CryptoStats;
  cryptoStrategies: Record<string, unknown>[];
  cryptoOrders: Record<string, unknown>[];
  forexStats: ForexStats;
  forexInvestments: Record<string, unknown>[];
}

// ── Helpers ──────────────────────────────────────────────────
const riskMap = (level: unknown) => {
  const n = Number(level) || 1;
  return n <= 2 ? 'low' : n <= 3 ? 'medium' : 'high';
};
const statusFromActive = (isActive: unknown) => (isActive === false ? 'paused' : 'active');

// ── Component ────────────────────────────────────────────────
export function AiTradingTabs({
  baseUrl,
  cryptoStats,
  cryptoStrategies,
  cryptoOrders,
  forexStats,
  forexInvestments,
}: AiTradingTabsProps) {
  const t = useTranslations('ai');
  const tc = useTranslations('common');
  const [activeTab, setActiveTab] = useState<'crypto' | 'forex'>('crypto');

  return (
    <>
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('crypto')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'crypto'
              ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          {t('tabs.crypto')}
        </button>
        <button
          onClick={() => setActiveTab('forex')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'forex'
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          {t('tabs.forex')}
        </button>
      </div>

      {/* ═══════════ Crypto Section ═══════════ */}
      {activeTab === 'crypto' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard title={t('stats.totalAum')} value={`$${cryptoStats.totalAum.toLocaleString()}`} icon={<AumIcon />} trend="up" change={t('stats.activeCount', { count: cryptoStats.activeStrategies })} />
            <StatsCard title={t('stats.strategies')} value={cryptoStats.totalStrategies} icon={<StrategyIcon />} trend="up" change={t('stats.activeCount', { count: cryptoStats.activeStrategies })} />
            <StatsCard title={t('stats.totalOrders')} value={cryptoStats.totalOrders} icon={<OrderIcon />} trend="up" change={t('stats.allTime')} />
            <StatsCard title={t('stats.avgWinRate')} value={`${cryptoStats.avgWinRate.toFixed(1)}%`} icon={<WinRateIcon />} trend="up" change={t('stats.activeStrategies')} />
            <StatsCard title={t('stats.avgSharpe')} value={cryptoStats.avgSharpe.toFixed(2)} icon={<SharpeIcon />} trend="up" change={t('stats.riskAdjusted')} />
            <StatsCard title={t('stats.totalProfit')} value={`$${cryptoStats.totalProfit.toLocaleString()}`} icon={<ProfitIcon />} trend={cryptoStats.totalProfit >= 0 ? 'up' : 'down'} change={t('stats.cumulative')} />
          </div>

          {/* Strategies table */}
          <Card padding="none">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('strategies.recentTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('strategies.recentSubtitle')}</p>
              </div>
              <Link href={`${baseUrl}/ai/strategies`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                {tc('actions.viewAll')} <ArrowIcon />
              </Link>
            </div>
            {cryptoStrategies.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4"><StrategyIcon /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('strategies.noStrategies')}</h3>
                <p className="text-muted-foreground">{t('strategies.noStrategiesHint')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.name')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.category')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.risk')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.tvl')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.winRate')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cryptoStrategies.map((s) => (
                      <tr key={s.id as string} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`${baseUrl}/ai/strategies/${s.id}`} className="text-sm font-medium text-foreground hover:text-primary">{s.name as string}</Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.category as string}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${riskColors[riskMap(s.risk_level)]}`}>{riskMap(s.risk_level)}</span></td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(s.tvl ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{Number(s.win_rate ?? 0).toFixed(1)}%</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[statusFromActive(s.is_active)]}`}>{statusFromActive(s.is_active)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Orders table */}
          <Card padding="none">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('orders.recentTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('orders.recentSubtitle')}</p>
              </div>
              <Link href={`${baseUrl}/ai/orders`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                {tc('actions.viewAll')} <ArrowIcon />
              </Link>
            </div>
            {cryptoOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4"><OrderIcon /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('orders.noOrders')}</h3>
                <p className="text-muted-foreground">{t('orders.noOrdersHint')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.user')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.strategy')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.amount')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.pnl')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cryptoOrders.map((o) => (
                      <tr key={o.id as string} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{((o.user_id as string) || '').slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm text-foreground">{(o.strategy_name as string) || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(o.amount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`text-sm font-medium ${Number(o.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{Number(o.pnl ?? 0) >= 0 ? '+' : ''}${Number(o.pnl ?? 0).toFixed(2)}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[o.status as string] || statusColors.pending}`}>{o.status as string}</span></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(o.created_at as string).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══════════ Forex Section ═══════════ */}
      {activeTab === 'forex' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard title={t('stats.totalInvested')} value={`$${forexStats.totalInvested.toLocaleString()}`} icon={<AumIcon />} trend="up" change={t('stats.allPortfolios')} />
            <StatsCard title={t('stats.currentValue')} value={`$${forexStats.totalValue.toLocaleString()}`} icon={<SharpeIcon />} trend="up" change={t('stats.marketValue')} />
            <StatsCard title={t('stats.totalProfit')} value={`$${forexStats.totalProfit.toLocaleString()}`} icon={<ProfitIcon />} trend={forexStats.totalProfit >= 0 ? 'up' : 'down'} change={t('stats.netPnl')} />
            <StatsCard title={t('stats.activeInvestments')} value={forexStats.activeInvestments} icon={<ActiveIcon />} trend="up" change={t('stats.running')} />
            <StatsCard title={t('stats.totalTrades')} value={forexStats.totalTrades} icon={<TradeIcon />} trend="up" change={t('stats.executed')} />
          </div>

          {/* Investments table */}
          <Card padding="none">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('forexInvestments.recentTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('forexInvestments.recentSubtitle')}</p>
              </div>
              <Link href={`${baseUrl}/forex/investments`} className="text-sm text-[#8B5CF6] hover:text-[#8B5CF6]/80 font-medium flex items-center gap-1">
                {tc('actions.viewAll')} <ArrowIcon />
              </Link>
            </div>
            {forexInvestments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] mb-4"><AumIcon /></div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{t('forexInvestments.noInvestments')}</h3>
                <p className="text-muted-foreground">{t('forexInvestments.noInvestmentsHint')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.user')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.amount')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.value')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.profit')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.pairs')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('columns.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {forexInvestments.map((inv) => (
                      <tr key={inv.id as string} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{((inv.user_id as string) || '').slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(inv.amount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(inv.current_value ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><span className={`text-sm font-medium ${Number(inv.profit ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{Number(inv.profit ?? 0) >= 0 ? '+' : ''}${Number(inv.profit ?? 0).toFixed(2)}</span></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{Array.isArray(inv.selected_pairs) ? (inv.selected_pairs as string[]).join(', ') : (inv.selected_pairs as string) || '-'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[inv.status as string] || statusColors.active}`}>{inv.status as string}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
