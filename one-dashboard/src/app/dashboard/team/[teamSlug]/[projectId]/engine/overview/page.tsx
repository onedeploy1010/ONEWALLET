'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface EngineStats {
  backendWallets: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  totalGasSpent: string;
  avgResponseTime: number;
}

interface RecentTransaction {
  id: string;
  type: string;
  status: 'pending' | 'submitted' | 'mined' | 'failed';
  from_address: string;
  to_address: string;
  chain_id: number;
  value: string;
  gas_used?: string;
  created_at: string;
}

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'BNB Chain',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
};

export default function EngineOverviewPage() {
  const t = useTranslations('engine');
  const tc = useTranslations('common');
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [statsRes, txRes] = await Promise.all([
        fetch(`/api/engine/stats?project_id=${projectId}`),
        fetch(`/api/engine/transactions?project_id=${projectId}&limit=10`),
      ]);

      const [statsData, txData] = await Promise.all([
        statsRes.json(),
        txRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (txData.success) setTransactions(txData.data || []);
    } catch (error) {
      console.error('Failed to fetch engine data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: '⏳' },
    submitted: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: '📤' },
    mined: { bg: 'bg-green-500/10', text: 'text-green-500', icon: '✅' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500', icon: '❌' },
  };

  const quickActions = [
    {
      title: t('overviewPage.backendWalletsAction'),
      description: t('overviewPage.backendWalletsDesc'),
      icon: '🔑',
      href: `/dashboard/team/${teamSlug}/${projectId}/engine/backend-wallets`,
      gradient: 'from-[#2563EB]/20 to-[#3B82F6]/10',
    },
    {
      title: t('overviewPage.transactionQueueAction'),
      description: t('overviewPage.transactionQueueDesc'),
      icon: '📋',
      href: `/dashboard/team/${teamSlug}/${projectId}/engine/transactions`,
      gradient: 'from-blue-500/20 to-indigo-500/10',
    },
    {
      title: t('overviewPage.webhooksAction'),
      description: t('overviewPage.webhooksDesc'),
      icon: '🔔',
      href: `/dashboard/team/${teamSlug}/${projectId}/engine/webhooks`,
      gradient: 'from-purple-500/20 to-violet-500/10',
    },
    {
      title: t('overviewPage.accessControlAction'),
      description: t('overviewPage.accessControlDesc'),
      icon: '🛡️',
      href: `/dashboard/team/${teamSlug}/${projectId}/engine/access`,
      gradient: 'from-orange-500/20 to-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('overviewPage.heading')}</h1>
        <p className="text-muted-foreground">
          {t('overviewPage.description')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2563EB]/10 to-[#3B82F6]/5 border border-[#2563EB]/20 rounded-2xl p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#2563EB]/20 to-transparent rounded-full -mr-8 -mt-8" />
          <p className="text-xs text-muted-foreground mb-1">{t('overviewPage.backendWalletsLabel')}</p>
          <p className="text-2xl font-bold text-foreground">{stats?.backendWallets || 0}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full -mr-8 -mt-8" />
          <p className="text-xs text-muted-foreground mb-1">{t('overviewPage.pendingLabel')}</p>
          <p className="text-2xl font-bold text-yellow-500">{stats?.pendingTransactions || 0}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/20 to-transparent rounded-full -mr-8 -mt-8" />
          <p className="text-xs text-muted-foreground mb-1">{t('overviewPage.completedLabel')}</p>
          <p className="text-2xl font-bold text-green-500">{stats?.completedTransactions || 0}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-500/20 to-transparent rounded-full -mr-8 -mt-8" />
          <p className="text-xs text-muted-foreground mb-1">{t('overviewPage.failedLabel')}</p>
          <p className="text-2xl font-bold text-red-500">{stats?.failedTransactions || 0}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-8 -mt-8" />
          <p className="text-xs text-muted-foreground mb-1">{t('overviewPage.gasSpentLabel')}</p>
          <p className="text-2xl font-bold text-blue-500">{stats?.totalGasSpent || '0'}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-4">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-8 -mt-8" />
          <p className="text-xs text-muted-foreground mb-1">{t('overviewPage.avgResponseLabel')}</p>
          <p className="text-2xl font-bold text-purple-500">{stats?.avgResponseTime || 0}ms</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:border-[#2563EB]/30 transition-all"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="text-2xl">{action.icon}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Integration Guide */}
      <div className="bg-gradient-to-r from-[#2563EB]/10 via-[#3B82F6]/5 to-transparent border border-[#2563EB]/20 rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {t('overviewPage.quickStart')}
        </h3>
        <div className="bg-secondary/50 rounded-xl p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-muted-foreground">
{`import { Engine } from "@one/engine";

const engine = new Engine({
  clientId: "your_client_id",
  secretKey: "your_secret_key"
});

// Create a backend wallet
const wallet = await engine.createBackendWallet({
  label: "Treasury Wallet"
});

// Send a transaction
const tx = await engine.sendTransaction({
  to: "0x...",
  value: "0.1",
  chainId: 137
});`}
          </pre>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{t('overviewPage.recentTransactions')}</h3>
          <Link
            href={`/dashboard/team/${teamSlug}/${projectId}/engine/transactions`}
            className="text-sm text-[#2563EB] hover:underline flex items-center gap-1"
          >
            {tc('actions.viewAll')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{t('overviewPage.noTransactions')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('overviewPage.noTransactionsHint')}</p>
            <Link
              href={`/dashboard/team/${teamSlug}/${projectId}/engine/backend-wallets`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              {t('overviewPage.createBackendWallet')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map((tx) => {
              const status = statusConfig[tx.status] || statusConfig.pending;
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center`}>
                      <span className="text-lg">{status.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tx.type}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {tx.from_address.slice(0, 8)}... → {tx.to_address.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{chainNames[tx.chain_id] || `Chain ${tx.chain_id}`}</p>
                    {tx.value && <p className="text-xs text-muted-foreground">{tx.value} ETH</p>}
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${status.bg} ${status.text}`}>
                      {tx.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
