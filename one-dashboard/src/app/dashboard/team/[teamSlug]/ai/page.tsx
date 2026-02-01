import { supabaseEngine } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import Link from 'next/link';

async function getAiStats() {
  const [
    { data: strategies },
    { count: orderCount },
  ] = await Promise.all([
    supabaseEngine.from('ai_strategies').select('*'),
    supabaseEngine.from('ai_orders').select('*', { count: 'exact', head: true }),
  ]);

  const strats = strategies || [];
  const active = strats.filter((s) => s.status === 'active');
  const totalAum = strats.reduce((sum: number, s) => sum + Number(s.tvl ?? 0), 0);
  const avgWinRate = active.length > 0
    ? active.reduce((sum: number, s) => sum + Number(s.win_rate ?? 0), 0) / active.length
    : 0;
  const avgSharpe = active.length > 0
    ? active.reduce((sum: number, s) => sum + Number(s.sharpe_ratio ?? 0), 0) / active.length
    : 0;
  const totalProfit = strats.reduce((sum: number, s) => sum + Number(s.total_pnl ?? 0), 0);

  return { totalAum, totalStrategies: strats.length, activeStrategies: active.length, totalOrders: orderCount || 0, avgWinRate, avgSharpe, totalProfit };
}

async function getRecentStrategies() {
  const { data } = await supabaseEngine
    .from('ai_strategies')
    .select('id, name, category, risk_level, status, tvl, win_rate, sharpe_ratio, total_pnl')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

async function getRecentOrders() {
  const { data } = await supabaseEngine
    .from('ai_orders')
    .select('id, user_id, strategy_name, amount, shares, status, pnl, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return data || [];
}

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
const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

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
};

export default async function AiOverviewPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const [stats, strategies, orders] = await Promise.all([
    getAiStats(),
    getRecentStrategies(),
    getRecentOrders(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Trading</h1>
        <p className="text-muted-foreground mt-1">Monitor AI-powered trading strategies and performance</p>
      </div>

      <GradientCard showDecorations>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">AI Trading Dashboard</h2>
            <p className="text-white/80 text-sm max-w-md">
              Manage automated trading strategies, monitor orders, and track real-time performance metrics.
            </p>
          </div>
          <Link
            href={`/dashboard/team/${teamSlug}/ai/strategies`}
            className="px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            View Strategies
          </Link>
        </div>
      </GradientCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title="Total AUM" value={`$${stats.totalAum.toLocaleString()}`} icon={<AumIcon />} trend="up" change={`${stats.activeStrategies} active`} />
        <StatsCard title="Strategies" value={stats.totalStrategies} icon={<StrategyIcon />} trend="up" change={`${stats.activeStrategies} active`} />
        <StatsCard title="Total Orders" value={stats.totalOrders} icon={<OrderIcon />} trend="up" change="All time" />
        <StatsCard title="Avg Win Rate" value={`${stats.avgWinRate.toFixed(1)}%`} icon={<WinRateIcon />} trend="up" change="Active strategies" />
        <StatsCard title="Avg Sharpe" value={stats.avgSharpe.toFixed(2)} icon={<SharpeIcon />} trend="up" change="Risk-adjusted" />
        <StatsCard title="Total Profit" value={`$${stats.totalProfit.toLocaleString()}`} icon={<ProfitIcon />} trend={stats.totalProfit >= 0 ? 'up' : 'down'} change="Cumulative" />
      </div>

      <Card padding="none">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent Strategies</h2>
            <p className="text-sm text-muted-foreground">Latest AI trading strategies</p>
          </div>
          <Link href={`/dashboard/team/${teamSlug}/ai/strategies`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            View All <ArrowIcon />
          </Link>
        </div>
        {strategies.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4"><StrategyIcon /></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No strategies yet</h3>
            <p className="text-muted-foreground">AI strategies will appear here when created</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">TVL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Win Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {strategies.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/team/${teamSlug}/ai/strategies/${s.id}`} className="text-sm font-medium text-foreground hover:text-primary">{s.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.category}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${riskColors[s.risk_level] || riskColors.medium}`}>{s.risk_level}</span></td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(s.tvl ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{Number(s.win_rate ?? 0).toFixed(1)}%</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[s.status] || statusColors.active}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="none">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
            <p className="text-sm text-muted-foreground">Latest AI trading orders</p>
          </div>
          <Link href={`/dashboard/team/${teamSlug}/ai/orders`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            View All <ArrowIcon />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4"><OrderIcon /></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground">Orders will appear here when placed</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Strategy</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">P&L</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{(o.user_id || '').slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm text-foreground">{o.strategy_name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(o.amount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${Number(o.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{Number(o.pnl ?? 0) >= 0 ? '+' : ''}${Number(o.pnl ?? 0).toFixed(2)}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[o.status] || statusColors.pending}`}>{o.status}</span></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
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
