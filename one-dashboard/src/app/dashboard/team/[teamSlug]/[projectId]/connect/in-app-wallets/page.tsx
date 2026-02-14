'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CodeBlock } from '@/components/ui/CodeBlock';

interface WalletUser {
  id: string;
  email: string | null;
  wallet_address: string;
  auth_method: 'email' | 'phone' | 'social' | 'passkey' | 'external';
  status: 'active' | 'inactive';
  last_login_at: string | null;
  created_at: string;
  metadata?: {
    device?: string;
    country?: string;
  };
}

export default function InAppWalletsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const t = useTranslations('connect');
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    newToday: 0,
  });
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, [projectId, filter]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        project_id: projectId,
        type: 'in-app',
      });
      if (filter !== 'all') {
        params.append('auth_method', filter);
      }

      const res = await fetch(`/api/connect/wallets?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setStats(data.stats || { total: 0, active: 0, newToday: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const authMethodIcons: Record<string, string> = {
    email: '📧',
    phone: '📱',
    social: '🌐',
    passkey: '🔑',
    external: '🔗',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('inAppWallets.title')}</h1>
        <p className="text-muted-foreground">
          {t('inAppWallets.subtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">{t('inAppWallets.totalUsers')}</p>
          <p className="text-2xl font-bold text-foreground">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">{t('inAppWallets.active7d')}</p>
          <p className="text-2xl font-bold text-foreground">{stats.active.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">{t('inAppWallets.newToday')}</p>
          <p className="text-2xl font-bold text-foreground">{stats.newToday.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters — horizontally scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {['all', 'email', 'phone', 'social', 'passkey'].map((method) => (
          <button
            key={method}
            onClick={() => setFilter(method)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === method
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            }`}
          >
            {method === 'all' ? t('inAppWallets.all') : `${authMethodIcons[method]} ${method.charAt(0).toUpperCase() + method.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Users — Desktop table, Mobile cards */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* ── Desktop table (hidden on small screens) ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('inAppWallets.columns.user')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('inAppWallets.columns.walletAddress')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('inAppWallets.columns.authMethod')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('inAppWallets.columns.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('inAppWallets.columns.lastActive')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('inAppWallets.columns.joined')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="animate-pulse h-4 bg-secondary rounded" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="text-4xl mb-4">👛</div>
                    <p className="text-foreground font-medium mb-2">{t('inAppWallets.noUsers')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('inAppWallets.noUsersHint')}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{user.email || t('inAppWallets.anonymous')}</p>
                        <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">
                      {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <span>{authMethodIcons[user.auth_method]}</span>
                        <span className="text-sm capitalize text-foreground">{user.auth_method}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        user.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile card list (hidden on md+) ── */}
        <div className="md:hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-secondary rounded w-2/3" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">👛</div>
              <p className="text-foreground font-medium mb-2">{t('inAppWallets.noUsers')}</p>
              <p className="text-sm text-muted-foreground">
                {t('inAppWallets.noUsersHint')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  {/* Row 1: User + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{user.email || t('inAppWallets.anonymous')}</p>
                      <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium shrink-0 ${
                      user.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {user.status}
                    </span>
                  </div>

                  {/* Row 2: Details grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('inAppWallets.columns.wallet')}</p>
                      <p className="font-mono text-foreground">{user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('inAppWallets.columns.auth')}</p>
                      <p className="text-foreground">
                        {authMethodIcons[user.auth_method]} <span className="capitalize">{user.auth_method}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('inAppWallets.columns.lastActive')}</p>
                      <p className="text-foreground">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('inAppWallets.columns.joined')}</p>
                      <p className="text-foreground">{new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Integration */}
      <CodeBlock
        title="Wallets API"
        tabs={[
          {
            label: 'JavaScript',
            language: 'javascript',
            code: `import { OneWallet } from '@onewallet/sdk';

const client = new OneWallet({ clientId: 'YOUR_CLIENT_ID' });

// List in-app wallets
const wallets = await client.wallets.list();

// Create wallet for user
const wallet = await client.wallets.create({
  authMethod: 'email',
  email: 'user@example.com'
});

// Get wallet balance
const balance = await client.wallets.getBalance(wallet.address);`,
          },
          {
            label: 'cURL',
            language: 'bash',
            code: `# List wallets
curl https://api.onewallet.com/v1/wallets \\
  -H "X-API-Key: YOUR_CLIENT_ID"

# Create wallet (Server-side)
curl -X POST https://api.onewallet.com/v1/wallets \\
  -H "X-API-Key: YOUR_CLIENT_ID" \\
  -H "X-Secret-Key: YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"auth_method":"email","email":"user@example.com"}'`,
          },
        ]}
      />
    </div>
  );
}
