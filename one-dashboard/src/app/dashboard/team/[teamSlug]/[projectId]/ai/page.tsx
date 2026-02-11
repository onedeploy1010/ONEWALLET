import { supabaseEngine } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { CodeBlock } from '@/components/ui/CodeBlock';
import Link from 'next/link';
import { AiTradingTabs } from './AiTradingTabs';
import { getTranslations } from 'next-intl/server';

// ── Crypto data ──────────────────────────────────────────────
async function getCryptoStats() {
  try {
    const [strategiesRes, ordersRes, poolsRes] = await Promise.all([
      supabaseEngine.from('ai_strategies').select('*'),
      supabaseEngine.from('ai_orders').select('*', { count: 'exact', head: true }),
      supabaseEngine.from('ai_strategy_pools').select('strategy_id, total_pnl'),
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

async function getCryptoStrategies() {
  try {
    const { data, error } = await supabaseEngine
      .from('ai_strategies').select('id, name, category, risk_level, is_active, tvl, win_rate, sharpe_ratio')
      .order('created_at', { ascending: false }).limit(5);
    if (error?.code === '42P01') return [];
    return data || [];
  } catch { return []; }
}

async function getCryptoOrders() {
  try {
    const { data, error } = await supabaseEngine
      .from('ai_orders').select('id, user_id, strategy_id, amount, status, realized_profit, unrealized_profit, created_at')
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

// ── Forex data ───────────────────────────────────────────────
async function getForexStats() {
  try {
    const [investmentsRes, tradesRes] = await Promise.all([
      supabaseEngine.from('forex_investments').select('*'),
      supabaseEngine.from('forex_trades').select('*', { count: 'exact', head: true }),
    ]);
    const investments = investmentsRes.error?.code === '42P01' ? [] : investmentsRes.data;
    const tradeCount = tradesRes.error?.code === '42P01' ? 0 : tradesRes.count;
    const invs = investments || [];
    const active = invs.filter((i) => i.status === 'active');
    const totalInvested = invs.reduce((sum: number, i) => sum + Number(i.amount ?? 0), 0);
    const totalValue = invs.reduce((sum: number, i) => sum + Number(i.current_value ?? 0), 0);
    const totalProfit = invs.reduce((sum: number, i) => sum + Number(i.profit ?? 0), 0);
    return { totalInvested, totalValue, totalProfit, activeInvestments: active.length, totalTrades: tradeCount || 0 };
  } catch {
    return { totalInvested: 0, totalValue: 0, totalProfit: 0, activeInvestments: 0, totalTrades: 0 };
  }
}

async function getForexInvestments() {
  try {
    const { data, error } = await supabaseEngine
      .from('forex_investments').select('id, user_id, amount, current_value, profit, status, selected_pairs, created_at')
      .order('created_at', { ascending: false }).limit(5);
    if (error?.code === '42P01') return [];
    return data || [];
  } catch { return []; }
}

// ── Page ─────────────────────────────────────────────────────
export default async function AiOverviewPage({
  params,
}: {
  params: Promise<{ teamSlug: string; projectId: string }>;
}) {
  const { teamSlug, projectId } = await params;
  const t = await getTranslations('ai');

  const [cryptoStats, cryptoStrategies, cryptoOrders, forexStats, forexInvestments] = await Promise.all([
    getCryptoStats(),
    getCryptoStrategies(),
    getCryptoOrders(),
    getForexStats(),
    getForexInvestments(),
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
            <p className="text-white/80 text-sm max-w-md">
              {t('dashboardDesc')}
            </p>
          </div>
          <Link
            href={`${baseUrl}/ai/strategies`}
            className="w-full sm:w-auto text-center px-4 py-2 bg-white/20 border border-white/30 text-white rounded-xl text-sm font-medium hover:bg-white/30 transition-colors"
          >
            {t('viewStrategies')}
          </Link>
        </div>
      </GradientCard>

      {/* Tab switcher (client component) + both sections */}
      <AiTradingTabs
        baseUrl={baseUrl}
        cryptoStats={cryptoStats}
        cryptoStrategies={cryptoStrategies}
        cryptoOrders={cryptoOrders}
        forexStats={forexStats}
        forexInvestments={forexInvestments}
      />

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
