import { supabaseEngine } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { CodeBlock } from '@/components/ui/CodeBlock';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

async function getForexStats(projectId: string) {
  try {
    const [investmentsRes, tradesRes] = await Promise.all([
      supabaseEngine.from('forex_investments').select('*').eq('project_id', projectId),
      supabaseEngine.from('forex_trades').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
    ]);

    const investments = investmentsRes.error?.code === '42P01' ? [] : investmentsRes.data;
    const tradeCount = tradesRes.error?.code === '42P01' ? 0 : tradesRes.count;

    const invs = investments || [];
    const active = invs.filter((i) => i.status === 'active');
    const totalInvested = invs.reduce((sum: number, i) => sum + Number(i.amount ?? 0), 0);
    const totalValue = invs.reduce((sum: number, i) => sum + Number(i.current_value ?? 0), 0);
    const totalProfit = invs.reduce((sum: number, i) => sum + Number(i.profit ?? 0), 0);
    const avgCycleDays = active.length > 0
      ? Math.round(active.reduce((sum: number, i) => sum + Number(i.cycle_days ?? 0), 0) / active.length)
      : 0;

    return { totalInvested, totalValue, totalProfit, activeInvestments: active.length, totalTrades: tradeCount || 0, avgCycleDays };
  } catch {
    return { totalInvested: 0, totalValue: 0, totalProfit: 0, activeInvestments: 0, totalTrades: 0, avgCycleDays: 0 };
  }
}

async function getRecentPools(projectId: string) {
  try {
    const { data, error } = await supabaseEngine.from('forex_pools').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(3);
    if (error?.code === '42P01') return [];
    return data || [];
  } catch {
    return [];
  }
}

async function getRecentInvestments(projectId: string) {
  try {
    const { data, error } = await supabaseEngine
      .from('forex_investments')
      .select('id, user_id, amount, current_value, profit, status, pairs, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (error?.code === '42P01') return [];
    return data || [];
  } catch {
    return [];
  }
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
  matured: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  withdrawn: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

export default async function ForexOverviewPage({
  params,
}: {
  params: Promise<{ teamSlug: string; projectId: string }>;
}) {
  const { teamSlug, projectId } = await params;
  const t = await getTranslations('forex');
  const [stats, pools, investments] = await Promise.all([
    getForexStats(projectId),
    getRecentPools(projectId),
    getRecentInvestments(projectId),
  ]);

  const baseUrl = `/dashboard/team/${teamSlug}/${projectId}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <GradientCard variant="purple" showDecorations>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{t('dashboardTitle')}</h2>
            <p className="text-white/80 text-sm max-w-md">
              {t('dashboardDesc')}
            </p>
          </div>
          <Link
            href={`${baseUrl}/forex/investments`}
            className="px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            {t('viewInvestments')}
          </Link>
        </div>
      </GradientCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title={t('stats.totalInvested')} value={`$${stats.totalInvested.toLocaleString()}`} icon={<InvestedIcon />} trend="up" change={t('stats.allPortfolios')} />
        <StatsCard title={t('stats.currentValue')} value={`$${stats.totalValue.toLocaleString()}`} icon={<ValueIcon />} trend="up" change={t('stats.marketValue')} />
        <StatsCard title={t('stats.totalProfit')} value={`$${stats.totalProfit.toLocaleString()}`} icon={<ProfitIcon />} trend={stats.totalProfit >= 0 ? 'up' : 'down'} change={t('stats.netPnl')} />
        <StatsCard title={t('stats.activeInvestments')} value={stats.activeInvestments} icon={<ActiveIcon />} trend="up" change={t('stats.running')} />
        <StatsCard title={t('stats.totalTrades')} value={stats.totalTrades} icon={<TradeIcon />} trend="up" change={t('stats.executed')} />
        <StatsCard title={t('stats.avgCycle')} value={t('stats.days', { count: stats.avgCycleDays })} icon={<CycleIcon />} trend="neutral" change={t('stats.activeAvg')} />
      </div>

      {pools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('pools.summary')}</h2>
            <Link href={`${baseUrl}/forex/pools`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
              {t('viewInvestments')} <ArrowIcon />
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
                    <span className="text-muted-foreground">{t('pools.size')}</span>
                    <span className="font-medium text-foreground">${Number(pool.pool_size ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t('pools.utilization')}</span>
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
            <h2 className="text-lg font-semibold text-foreground">{t('investments.recentTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('investments.recentSubtitle')}</p>
          </div>
          <Link href={`${baseUrl}/forex/investments`} className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            {t('viewInvestments')} <ArrowIcon />
          </Link>
        </div>
        {investments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6] mb-4"><InvestedIcon /></div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('investments.noInvestments')}</h3>
            <p className="text-muted-foreground">{t('investments.noInvestmentsHint')}</p>
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

      {/* API Integration */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t('apiIntegration')}</h2>
        <CodeBlock
          title={t('apiTitle')}
          tabs={[
            {
              label: t('tabs.javascript'),
              language: 'javascript',
              code: `// List investments
const res = await fetch('https://api.onewallet.com/v1/forex/investments', {
  headers: { 'X-API-Key': 'YOUR_CLIENT_ID' }
});
const investments = await res.json();

// Create investment (Server-side)
const res = await fetch('https://api.onewallet.com/v1/forex/investments', {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_CLIENT_ID',
    'X-Secret-Key': 'YOUR_SECRET_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pool_id: 'pool_123',
    amount: 5000,
    pairs: ['EUR/USD', 'GBP/USD']
  })
});`,
            },
            {
              label: t('tabs.curl'),
              language: 'bash',
              code: `# List investments
curl https://api.onewallet.com/v1/forex/investments \\
  -H "X-API-Key: YOUR_CLIENT_ID"

# Create investment (Server-side)
curl -X POST https://api.onewallet.com/v1/forex/investments \\
  -H "X-API-Key: YOUR_CLIENT_ID" \\
  -H "X-Secret-Key: YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"pool_id":"pool_123","amount":5000,"pairs":["EUR/USD","GBP/USD"]}'`,
            },
          ]}
        />
      </div>
    </div>
  );
}
