import { supabaseEngine } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import Link from 'next/link';

async function getForexStats() {
  const [
    { data: investments },
    { count: tradeCount },
  ] = await Promise.all([
    supabaseEngine.from('forex_investments').select('*'),
    supabaseEngine.from('forex_trades').select('*', { count: 'exact', head: true }),
  ]);

  const invs = investments || [];
  const active = invs.filter((i) => i.status === 'active');
  const totalInvested = invs.reduce((sum: number, i) => sum + Number(i.amount ?? 0), 0);
  const totalValue = invs.reduce((sum: number, i) => sum + Number(i.current_value ?? 0), 0);
  const totalProfit = invs.reduce((sum: number, i) => sum + Number(i.profit ?? 0), 0);
  const avgCycleDays = active.length > 0
    ? Math.round(active.reduce((sum: number, i) => sum + Number(i.cycle_days ?? 0), 0) / active.length)
    : 0;

  return { totalInvested, totalValue, totalProfit, activeInvestments: active.length, totalTrades: tradeCount || 0, avgCycleDays };
}

async function getRecentPools() {
  const { data } = await supabaseEngine.from('forex_pools').select('*').order('created_at', { ascending: false }).limit(3);
  return data || [];
}

async function getRecentInvestments() {
  const { data } = await supabaseEngine
    .from('forex_investments')
    .select('id, user_id, amount, current_value, profit, status, pairs, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

const InvestedIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ValueIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const ProfitIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ActiveIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);
const TradeIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);
const CycleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);
const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-500 border-green-500/20',
  matured: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  withdrawn: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

export default async function ForexOverviewPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const [stats, pools, investments] = await Promise.all([
    getForexStats(),
    getRecentPools(),
    getRecentInvestments(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Forex</h1>
        <p className="text-muted-foreground mt-1">Monitor forex investments, trades, and pool performance</p>
      </div>

      <GradientCard variant="purple" showDecorations>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Forex Dashboard</h2>
            <p className="text-white/80 text-sm max-w-md">
              Track forex investments, monitor trade execution, and analyze pool utilization.
            </p>
          </div>
          <Link
            href={`/dashboard/team/${teamSlug}/forex/investments`}
            className="px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            View Investments
          </Link>
        </div>
      </GradientCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title="Total Invested" value={`$${stats.totalInvested.toLocaleString()}`} icon={<InvestedIcon />} trend="up" change="All portfolios" />
        <StatsCard title="Current Value" value={`$${stats.totalValue.toLocaleString()}`} icon={<ValueIcon />} trend="up" change="Market value" />
        <StatsCard title="Total Profit" value={`$${stats.totalProfit.toLocaleString()}`} icon={<ProfitIcon />} trend={stats.totalProfit >= 0 ? 'up' : 'down'} change="Net P&L" />
        <StatsCard title="Active Investments" value={stats.activeInvestments} icon={<ActiveIcon />} trend="up" change="Running" />
        <StatsCard title="Total Trades" value={stats.totalTrades} icon={<TradeIcon />} trend="up" change="Executed" />
        <StatsCard title="Avg Cycle" value={`${stats.avgCycleDays} days`} icon={<CycleIcon />} trend="neutral" change="Active avg" />
      </div>

      {pools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Pool Summary</h2>
            <Link href={`/dashboard/team/${teamSlug}/forex/pools`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              View All <ArrowIcon />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{pool.name}</h3>
                    <p className="text-xs text-muted-foreground">{pool.type}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[pool.status] || statusColors.active}`}>{pool.status}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium text-foreground">${Number(pool.pool_size ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-medium text-foreground">{Number(pool.utilization ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED]" style={{ width: `${Math.min(100, Number(pool.utilization ?? 0))}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card padding="none">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent Investments</h2>
            <p className="text-sm text-muted-foreground">Latest forex investments</p>
          </div>
          <Link href={`/dashboard/team/${teamSlug}/forex/investments`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            View All <ArrowIcon />
          </Link>
        </div>
        {investments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] mb-4"><InvestedIcon /></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No investments yet</h3>
            <p className="text-muted-foreground">Forex investments will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Profit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Pairs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{(inv.user_id || '').slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(inv.amount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(inv.current_value ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${Number(inv.profit ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{Number(inv.profit ?? 0) >= 0 ? '+' : ''}${Number(inv.profit ?? 0).toFixed(2)}</span></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{inv.pairs || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[inv.status] || statusColors.active}`}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
