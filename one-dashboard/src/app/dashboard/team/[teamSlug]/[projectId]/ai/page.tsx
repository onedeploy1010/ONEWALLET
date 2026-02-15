import { supabaseEngine } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { CodeBlock } from '@/components/ui/CodeBlock';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

// Icons
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
};

const riskMap = (level: unknown) => {
  const n = Number(level) || 1;
  return n <= 2 ? 'low' : n <= 3 ? 'medium' : 'high';
};
const statusFromActive = (isActive: unknown) => (isActive === false ? 'paused' : 'active');

async function getCryptoStats(projectId: string) {
  try {
    const [strategiesRes, ordersRes, poolsRes] = await Promise.all([
      supabaseEngine.from('ai_strategies').select('*').eq('project_id', projectId),
      supabaseEngine.from('ai_orders').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabaseEngine.from('ai_strategy_pools').select('strategy_id, total_pnl').eq('project_id', projectId),
    ]);
    const strategies = strategiesRes.error?.code === '42P01' ? [] : strategiesRes.data;
    const orderCount = ordersRes.error?.code === '42P01' ? 0 : ordersRes.count;
    const pools = poolsRes.error?.code === '42P01' ? [] : poolsRes.data;
    const strats = strategies || [];
    const active = strats.filter((s) => s.is_active !== false);
    const totalAum = strats.reduce((sum: number, s) => sum + Number(s.tvl ?? 0), 0);
    const avgWinRate = active.length > 0 ? active.reduce((sum: number, s) => sum + Number(s.win_rate ?? 0), 0) / active.length : 0;
    const avgSharpe = active.length > 0 ? active.reduce((sum: number, s) => sum + Number(s.sharpe_ratio ?? 0), 0) / active.length : 0;
    const totalProfit = (pools || []).reduce((sum: number, p) => sum + Number(p.total_pnl ?? 0), 0);
    return { totalAum, totalStrategies: strats.length, activeStrategies: active.length, totalOrders: orderCount || 0, avgWinRate, avgSharpe, totalProfit };
  } catch {
    return { totalAum: 0, totalStrategies: 0, activeStrategies: 0, totalOrders: 0, avgWinRate: 0, avgSharpe: 0, totalProfit: 0 };
  }
}

async function getCryptoStrategies(projectId: string) {
  try {
    const { data, error } = await supabaseEngine
      .from('ai_strategies').select('id, name, category, risk_level, is_active, tvl, win_rate, sharpe_ratio')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }).limit(5);
    if (error?.code === '42P01') return [];
    return data || [];
  } catch { return []; }
}

async function getCryptoOrders(projectId: string) {
  try {
    const { data, error } = await supabaseEngine
      .from('ai_orders').select('id, user_id, strategy_id, amount, status, realized_profit, unrealized_profit, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }).limit(5);
    if (error?.code === '42P01') return [];
    const orders = data || [];
    const stratIds = Array.from(new Set(orders.map((o) => o.strategy_id).filter(Boolean)));
    let nameMap = new Map<string, string>();
    if (stratIds.length > 0) {
      const { data: strats } = await supabaseEngine.from('ai_strategies').select('id, name').in('id', stratIds);
      nameMap = new Map((strats || []).map((s) => [s.id, s.name]));
    }
    return orders.map((o) => ({
      ...o,
      strategy_name: nameMap.get(o.strategy_id) || o.strategy_id,
      pnl: Number(o.realized_profit ?? 0) + Number(o.unrealized_profit ?? 0),
    }));
  } catch { return []; }
}

export default async function AiOverviewPage({
  params,
}: {
  params: Promise<{ teamSlug: string; projectId: string }>;
}) {
  const { teamSlug, projectId } = await params;
  const t = await getTranslations('ai');
  const tc = await getTranslations('common');

  const [stats, strategies, orders] = await Promise.all([
    getCryptoStats(projectId),
    getCryptoStrategies(projectId),
    getCryptoOrders(projectId),
  ]);

  const baseUrl = `/dashboard/team/${teamSlug}/${projectId}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <GradientCard showDecorations>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{t('dashboardTitle')}</h2>
            <p className="text-white/80 text-sm max-w-md">{t('dashboardDescFull')}</p>
          </div>
          <Link
            href={`${baseUrl}/ai/strategies`}
            className="w-full sm:w-auto text-center px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            {t('viewStrategies')}
          </Link>
        </div>
      </GradientCard>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title={t('stats.totalAum')} value={`$${stats.totalAum.toLocaleString()}`} icon={<AumIcon />} trend="up" change={t('stats.activeCount', { count: stats.activeStrategies })} />
        <StatsCard title={t('stats.strategies')} value={stats.totalStrategies} icon={<StrategyIcon />} trend="up" change={t('stats.activeCount', { count: stats.activeStrategies })} />
        <StatsCard title={t('stats.totalOrders')} value={stats.totalOrders} icon={<OrderIcon />} trend="up" change={t('stats.allTime')} />
        <StatsCard title={t('stats.avgWinRate')} value={`${stats.avgWinRate.toFixed(1)}%`} icon={<WinRateIcon />} trend="up" change={t('stats.activeStrategies')} />
        <StatsCard title={t('stats.avgSharpe')} value={stats.avgSharpe.toFixed(2)} icon={<SharpeIcon />} trend="up" change={t('stats.riskAdjusted')} />
        <StatsCard title={t('stats.totalProfit')} value={`$${stats.totalProfit.toLocaleString()}`} icon={<ProfitIcon />} trend={stats.totalProfit >= 0 ? 'up' : 'down'} change={t('stats.cumulative')} />
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
        {strategies.length === 0 ? (
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
                {strategies.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`${baseUrl}/ai/strategies/${s.id}`} className="text-sm font-medium text-foreground hover:text-primary">{s.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.category}</td>
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
        {orders.length === 0 ? (
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
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{(o.user_id || '').slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-sm text-foreground">{o.strategy_name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">${Number(o.amount ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${o.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{o.pnl >= 0 ? '+' : ''}${o.pnl.toFixed(2)}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[o.status] || statusColors.pending}`}>{o.status}</span></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* API Integration */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('apiIntegration')}</h2>
        <CodeBlock
          title={t('apiTitle')}
          tabs={[
            {
              label: t('tabs.javascript'),
              language: 'javascript',
              code: `// Client-side (API Key)
const res = await fetch('https://api.onewallet.com/v1/ai/strategies', {
  headers: { 'X-API-Key': 'YOUR_CLIENT_ID' }
});
const strategies = await res.json();

// Server-side (Secret Key)
const res = await fetch('https://api.onewallet.com/v1/ai/orders', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_CLIENT_ID',
    'X-Secret-Key': 'YOUR_SECRET_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    strategy_id: 'strategy_123',
    amount: 1000,
    action: 'subscribe'
  })
});`,
            },
            {
              label: t('tabs.curl'),
              language: 'bash',
              code: `# List strategies (Client-side)
curl https://api.onewallet.com/v1/ai/strategies \\
  -H "X-API-Key: YOUR_CLIENT_ID"

# Place order (Server-side)
curl -X POST https://api.onewallet.com/v1/ai/orders \\
  -H "X-API-Key: YOUR_CLIENT_ID" \\
  -H "X-Secret-Key: YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"strategy_id":"strategy_123","amount":1000,"action":"subscribe"}'`,
            },
          ]}
        />
      </div>
    </div>
  );
}
