'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CodeBlock } from '@/components/ui/CodeBlock';

interface PaymentStats {
  totalVolume: number;
  transactionCount: number;
  avgTransactionSize: number;
  successRate: number;
}

interface PaymentTransaction {
  id: string;
  type: 'buy' | 'sell' | 'onramp' | 'offramp';
  amount: number;
  currency: string;
  fiat_amount: number;
  fiat_currency: string;
  status: 'pending' | 'completed' | 'failed';
  provider: string;
  user_id: string;
  created_at: string;
}

interface Provider {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'inactive' | 'configure';
  features: string[];
}

const providers: Provider[] = [
  {
    id: 'onramper',
    name: 'Onramper',
    description: 'Aggregated fiat on-ramp with 100+ payment methods',
    icon: '🌐',
    status: 'active',
    features: ['Credit Card', 'Bank Transfer', 'Apple Pay'],
  },
  {
    id: 'moonpay',
    name: 'MoonPay',
    description: 'NFT checkout and crypto purchases',
    icon: '🌙',
    status: 'configure',
    features: ['NFT Checkout', 'Crypto Buy', 'Swap'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Card payments and subscriptions',
    icon: '💳',
    status: 'configure',
    features: ['Cards', 'Subscriptions', 'Invoices'],
  },
  {
    id: 'coinbase',
    name: 'Coinbase Pay',
    description: 'Direct crypto payments from Coinbase',
    icon: '🔵',
    status: 'configure',
    features: ['Direct Transfer', 'Low Fees', 'Fast'],
  },
];

export default function PayPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'providers'>('overview');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [statsRes, txRes] = await Promise.all([
        fetch(`/api/connect/pay/stats?project_id=${projectId}`),
        fetch(`/api/connect/pay/transactions?project_id=${projectId}&limit=20`),
      ]);

      const [statsData, txData] = await Promise.all([
        statsRes.json(),
        txRes.json(),
      ]);

      if (statsData.success) setStats(statsData.data);
      if (txData.success) setTransactions(txData.data || []);
    } catch (error) {
      console.error('Failed to fetch pay data:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeConfig: Record<string, { icon: string; label: string; color: string }> = {
    buy: { icon: '💰', label: 'Buy Crypto', color: 'text-green-500' },
    sell: { icon: '💸', label: 'Sell Crypto', color: 'text-orange-500' },
    onramp: { icon: '⬆️', label: 'On-Ramp', color: 'text-blue-500' },
    offramp: { icon: '⬇️', label: 'Off-Ramp', color: 'text-purple-500' },
  };

  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500' },
    completed: { bg: 'bg-green-500/10', text: 'text-green-500' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-500' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pay</h1>
          <p className="text-muted-foreground">
            Fiat on-ramp, off-ramp, and crypto payment solutions
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
          {(['overview', 'transactions', 'providers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">Total Volume</p>
              <p className="text-3xl font-bold text-foreground">
                ${(stats?.totalVolume || 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-500 mt-2">All time payments</p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">Transactions</p>
              <p className="text-3xl font-bold text-foreground">
                {(stats?.transactionCount || 0).toLocaleString()}
              </p>
              <p className="text-xs text-blue-500 mt-2">Total processed</p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">Avg Transaction</p>
              <p className="text-3xl font-bold text-foreground">
                ${(stats?.avgTransactionSize || 0).toFixed(2)}
              </p>
              <p className="text-xs text-purple-500 mt-2">Per transaction</p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-[#2563EB]/10 to-[#3B82F6]/5 border border-[#2563EB]/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#2563EB]/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">Success Rate</p>
              <p className="text-3xl font-bold text-foreground">
                {(stats?.successRate || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-[#2563EB] mt-2">Completion rate</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="group bg-card border border-border rounded-2xl p-6 text-left hover:border-[#2563EB]/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Enable On-Ramp</h3>
              <p className="text-sm text-muted-foreground">Let users buy crypto with fiat</p>
            </button>
            <button className="group bg-card border border-border rounded-2xl p-6 text-left hover:border-[#2563EB]/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">Enable Off-Ramp</h3>
              <p className="text-sm text-muted-foreground">Let users cash out to fiat</p>
            </button>
            <button className="group bg-card border border-border rounded-2xl p-6 text-left hover:border-[#2563EB]/50 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-2xl">🖼️</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">NFT Checkout</h3>
              <p className="text-sm text-muted-foreground">Credit card NFT purchases</p>
            </button>
          </div>

          {/* API Integration */}
          <CodeBlock
            title="Pay Integration"
            tabs={[
              {
                label: 'JavaScript',
                language: 'javascript',
                code: `import { OneWallet } from '@onewallet/sdk';

const client = new OneWallet({ clientId: 'YOUR_CLIENT_ID' });

// Embed pay widget
import { PayEmbed } from "@onewallet/react";

<PayEmbed
  client={client}
  payOptions={{
    mode: "fund_wallet",
    prefillBuy: { token: "USDC", amount: "10" }
  }}
/>

// Or use the API directly
const tx = await client.pay.createTransaction({
  type: 'onramp',
  amount: 100,
  currency: 'USD',
  token: 'USDC'
});`,
              },
              {
                label: 'cURL',
                language: 'bash',
                code: `# Create payment transaction
curl -X POST https://api.onewallet.com/v1/pay/transactions \\
  -H "X-API-Key: YOUR_CLIENT_ID" \\
  -H "X-Secret-Key: YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "onramp",
    "amount": 100,
    "currency": "USD",
    "token": "USDC"
  }'

# Get transaction status
curl https://api.onewallet.com/v1/pay/transactions/tx_123 \\
  -H "X-API-Key: YOUR_CLIENT_ID"`,
              },
            ]}
          />
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Recent Transactions</h3>
            <button className="text-sm text-[#2563EB] hover:underline">Export CSV</button>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">No transactions yet</h3>
              <p className="text-sm text-muted-foreground">Transactions will appear here when users make payments</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const type = typeConfig[tx.type] || typeConfig.buy;
                const status = statusConfig[tx.status] || statusConfig.pending;
                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <span className="text-xl">{type.icon}</span>
                      </div>
                      <div>
                        <p className={`font-medium ${type.color}`}>{type.label}</p>
                        <p className="text-xs text-muted-foreground">{tx.provider}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {tx.amount} {tx.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.fiat_currency} {tx.fiat_amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${status.bg} ${status.text}`}>
                        {tx.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#2563EB]/10 via-[#3B82F6]/5 to-transparent border border-[#2563EB]/20 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-2">Payment Providers</h3>
            <p className="text-sm text-muted-foreground">Configure payment providers to enable fiat-to-crypto and crypto-to-fiat transactions for your users.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <div key={provider.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <span className="text-2xl">{provider.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{provider.name}</h4>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    provider.status === 'active'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-gray-500/10 text-gray-500'
                  }`}>
                    {provider.status === 'active' ? 'Active' : 'Configure'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.features.map((feature) => (
                    <span key={feature} className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                      {feature}
                    </span>
                  ))}
                </div>
                <button className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
                  provider.status === 'active'
                    ? 'bg-secondary text-foreground hover:bg-secondary/80'
                    : 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white hover:opacity-90'
                }`}>
                  {provider.status === 'active' ? 'Manage Settings' : 'Enable Provider'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
