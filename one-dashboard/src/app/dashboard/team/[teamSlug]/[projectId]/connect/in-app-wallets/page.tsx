'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
        <h1 className="text-2xl font-bold">In-App Wallets</h1>
        <p className="text-muted-foreground">
          Users who connected via email, phone, social login, or passkey
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active (7d)</p>
          <p className="text-2xl font-bold">{stats.active.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">New Today</p>
          <p className="text-2xl font-bold">{stats.newToday.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'email', 'phone', 'social', 'passkey'].map((method) => (
          <button
            key={method}
            onClick={() => setFilter(method)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              filter === method
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            {method === 'all' ? 'All' : `${authMethodIcons[method]} ${method.charAt(0).toUpperCase() + method.slice(1)}`}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Wallet Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Auth Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Last Active</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
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
                    <p className="text-muted-foreground mb-2">No users yet</p>
                    <p className="text-sm text-muted-foreground">
                      Users will appear here when they connect to your app
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{user.email || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1">
                        <span>{authMethodIcons[user.auth_method]}</span>
                        <span className="text-sm capitalize">{user.auth_method}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
