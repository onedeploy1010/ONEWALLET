'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface AccessToken {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  last_used?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

interface AdminUser {
  id: string;
  email: string;
  wallet_address?: string;
  role: 'admin' | 'operator' | 'viewer';
  last_login?: string;
  created_at: string;
}

interface AllowedDomain {
  id: string;
  domain: string;
  is_active: boolean;
  created_at: string;
}

export default function AccessControlPage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;
  const t = useTranslations('engine');
  const tc = useTranslations('common');

  const PERMISSIONS = [
    { id: 'wallet:read', label: t('accessPage.permissions.readWallets'), description: t('accessPage.permissions.readWalletsDesc') },
    { id: 'wallet:create', label: t('accessPage.permissions.createWallets'), description: t('accessPage.permissions.createWalletsDesc') },
    { id: 'wallet:sign', label: t('accessPage.permissions.signTransactions'), description: t('accessPage.permissions.signTransactionsDesc') },
    { id: 'transaction:read', label: t('accessPage.permissions.readTransactions'), description: t('accessPage.permissions.readTransactionsDesc') },
    { id: 'transaction:write', label: t('accessPage.permissions.sendTransactions'), description: t('accessPage.permissions.sendTransactionsDesc') },
    { id: 'contract:read', label: t('accessPage.permissions.readContracts'), description: t('accessPage.permissions.readContractsDesc') },
    { id: 'contract:deploy', label: t('accessPage.permissions.deployContracts'), description: t('accessPage.permissions.deployContractsDesc') },
    { id: 'webhook:manage', label: t('accessPage.permissions.manageWebhooks'), description: t('accessPage.permissions.manageWebhooksDesc') },
  ];

  const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: PERMISSIONS.map((p) => p.id),
    operator: ['wallet:read', 'wallet:sign', 'transaction:read', 'transaction:write', 'contract:read'],
    viewer: ['wallet:read', 'transaction:read', 'contract:read'],
  };

  const [activeTab, setActiveTab] = useState<'tokens' | 'admins' | 'domains'>('tokens');
  const [accessTokens, setAccessTokens] = useState<AccessToken[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [loading, setLoading] = useState(true);

  // Token creation
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    permissions: [] as string[],
    expiresIn: 'never',
  });
  const [createdToken, setCreatedToken] = useState<{ token: string; secret: string } | null>(null);

  // Admin addition
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    wallet_address: '',
    role: 'viewer' as 'admin' | 'operator' | 'viewer',
  });

  // Domain addition
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [domainForm, setDomainForm] = useState({ domain: '' });

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tokensRes, adminsRes, domainsRes] = await Promise.all([
        fetch(`/api/engine/access/tokens?project_id=${projectId}`),
        fetch(`/api/engine/access/admins?project_id=${projectId}`),
        fetch(`/api/engine/access/domains?project_id=${projectId}`),
      ]);

      const [tokensData, adminsData, domainsData] = await Promise.all([
        tokensRes.json(),
        adminsRes.json(),
        domainsRes.json(),
      ]);

      if (tokensData.success) setAccessTokens(tokensData.data || []);
      if (adminsData.success) setAdmins(adminsData.data || []);
      if (domainsData.success) setDomains(domainsData.data || []);
    } catch (error) {
      console.error('Failed to fetch access data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateToken = async () => {
    if (!tokenForm.name.trim()) {
      setError('Token name is required');
      return;
    }
    if (tokenForm.permissions.length === 0) {
      setError('Select at least one permission');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/engine/access/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: tokenForm.name,
          permissions: tokenForm.permissions,
          expires_in: tokenForm.expiresIn !== 'never' ? tokenForm.expiresIn : undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCreatedToken(data.data);
        setTokenForm({ name: '', permissions: [], expiresIn: 'never' });
        fetchData();
      } else {
        setError(data.error?.message || 'Failed to create token');
      }
    } catch (err) {
      setError('Failed to create token');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token? This action cannot be undone.')) return;

    try {
      const res = await fetch(`/api/engine/access/tokens/${tokenId}?project_id=${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.email.trim() && !adminForm.wallet_address.trim()) {
      setError('Email or wallet address is required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/engine/access/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          email: adminForm.email || undefined,
          wallet_address: adminForm.wallet_address || undefined,
          role: adminForm.role,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowAddAdmin(false);
        setAdminForm({ email: '', wallet_address: '', role: 'viewer' });
        fetchData();
      } else {
        setError(data.error?.message || 'Failed to add admin');
      }
    } catch (err) {
      setError('Failed to add admin');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      const res = await fetch(`/api/engine/access/admins/${adminId}?project_id=${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to remove admin:', error);
    }
  };

  const handleAddDomain = async () => {
    if (!domainForm.domain.trim()) {
      setError('Domain is required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const res = await fetch('/api/engine/access/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          domain: domainForm.domain,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowAddDomain(false);
        setDomainForm({ domain: '' });
        fetchData();
      } else {
        setError(data.error?.message || 'Failed to add domain');
      }
    } catch (err) {
      setError('Failed to add domain');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return;

    try {
      const res = await fetch(`/api/engine/access/domains/${domainId}?project_id=${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to remove domain:', error);
    }
  };

  const togglePermission = (permId: string) => {
    setTokenForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href={`/dashboard/team/${teamSlug}/${projectId}/engine/overview`} className="hover:text-foreground">
            {t('accessPage.engine')}
          </Link>
          <span>/</span>
          <span>{t('accessPage.heading')}</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t('accessPage.heading')}</h1>
        <p className="text-muted-foreground">
          {t('accessPage.description')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
        {[
          { id: 'tokens', label: t('accessPage.tabs.apiTokens'), icon: '🔑' },
          { id: 'admins', label: t('accessPage.tabs.admins'), icon: '👤' },
          { id: 'domains', label: t('accessPage.tabs.allowedDomains'), icon: '🌐' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Created Token Modal */}
      {createdToken && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full m-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{t('accessPage.tokenCreated')}</h3>
              <p className="text-sm text-muted-foreground">{t('accessPage.saveCredentials')}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs text-muted-foreground mb-2">{t('accessPage.accessToken')}</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-secondary rounded-lg font-mono text-sm text-foreground overflow-x-auto">
                    {createdToken.token}
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdToken.token)}
                    className="p-2 border border-border rounded-lg hover:bg-secondary"
                  >
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
              {createdToken.secret && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">{t('accessPage.secretKey')}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-secondary rounded-lg font-mono text-sm text-foreground overflow-x-auto">
                      {createdToken.secret}
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdToken.secret)}
                      className="p-2 border border-border rounded-lg hover:bg-secondary"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setCreatedToken(null);
                setShowCreateToken(false);
              }}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90"
            >
              {t('accessPage.savedCredentials')}
            </button>
          </div>
        </div>
      )}

      {/* API Tokens Tab */}
      {activeTab === 'tokens' && (
        <div className="space-y-4">
          {showCreateToken ? (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">{t('accessPage.createAccessToken')}</h3>
                <button onClick={() => setShowCreateToken(false)} className="p-2 hover:bg-secondary rounded-lg">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('accessPage.tokenName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tokenForm.name}
                    onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                    placeholder="My API Token"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('accessPage.expiration')}</label>
                  <select
                    value={tokenForm.expiresIn}
                    onChange={(e) => setTokenForm({ ...tokenForm, expiresIn: e.target.value })}
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  >
                    <option value="never">{t('accessPage.expirationOptions.never')}</option>
                    <option value="7d">{t('accessPage.expirationOptions.7days')}</option>
                    <option value="30d">{t('accessPage.expirationOptions.30days')}</option>
                    <option value="90d">{t('accessPage.expirationOptions.90days')}</option>
                    <option value="365d">{t('accessPage.expirationOptions.1year')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    {t('accessPage.permissionsLabel')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PERMISSIONS.map((perm) => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePermission(perm.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          tokenForm.permissions.includes(perm.id)
                            ? 'border-[#2563EB] bg-[#2563EB]/5 ring-2 ring-[#2563EB]/20'
                            : 'border-border hover:border-[#2563EB]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            tokenForm.permissions.includes(perm.id) ? 'border-[#2563EB] bg-[#2563EB]' : 'border-border'
                          }`}>
                            {tokenForm.permissions.includes(perm.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-foreground text-sm">{perm.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{perm.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowCreateToken(false)}
                    className="px-5 py-2.5 border border-border rounded-xl text-foreground hover:bg-secondary"
                  >
                    {tc('actions.cancel')}
                  </button>
                  <button
                    onClick={handleCreateToken}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {t('accessPage.createToken')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateToken(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('accessPage.createToken')}
                </button>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : accessTokens.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔑</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{t('accessPage.noTokens')}</h3>
                    <p className="text-sm text-muted-foreground">{t('accessPage.noTokensDescription')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {accessTokens.map((token) => (
                      <div key={token.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            token.is_active ? 'bg-[#2563EB]/10' : 'bg-gray-500/10'
                          }`}>
                            <span className="text-lg">🔑</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{token.name}</span>
                              {!token.is_active && (
                                <span className="px-2 py-0.5 bg-gray-500/10 text-gray-500 text-xs rounded-full">{t('accessPage.revoked')}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">{token.key_prefix}...</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {token.last_used ? `Last used ${new Date(token.last_used).toLocaleDateString()}` : t('accessPage.neverUsed')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {token.expires_at ? `Expires ${new Date(token.expires_at).toLocaleDateString()}` : t('accessPage.neverExpires')}
                            </p>
                          </div>
                          {token.is_active && (
                            <button
                              onClick={() => handleRevokeToken(token.id)}
                              className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Revoke"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          {showAddAdmin ? (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">{t('accessPage.addAdmin')}</h3>
                <button onClick={() => setShowAddAdmin(false)} className="p-2 hover:bg-secondary rounded-lg">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('accessPage.email')}</label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('accessPage.walletAddress')}</label>
                  <input
                    type="text"
                    value={adminForm.wallet_address}
                    onChange={(e) => setAdminForm({ ...adminForm, wallet_address: e.target.value })}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">{t('accessPage.role')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['admin', 'operator', 'viewer'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAdminForm({ ...adminForm, role })}
                        className={`p-4 rounded-xl border text-center transition-all ${
                          adminForm.role === role
                            ? 'border-[#2563EB] bg-[#2563EB]/5 ring-2 ring-[#2563EB]/20'
                            : 'border-border hover:border-[#2563EB]/50'
                        }`}
                      >
                        <div className="text-2xl mb-2">
                          {role === 'admin' ? '👑' : role === 'operator' ? '⚙️' : '👁️'}
                        </div>
                        <div className="font-medium text-foreground">{t(`accessPage.roles.${role}`)}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t(`accessPage.roleDescriptions.${role}`)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowAddAdmin(false)}
                    className="px-5 py-2.5 border border-border rounded-xl text-foreground hover:bg-secondary"
                  >
                    {tc('actions.cancel')}
                  </button>
                  <button
                    onClick={handleAddAdmin}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {t('accessPage.addAdmin')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddAdmin(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('accessPage.addAdmin')}
                </button>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : admins.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">👤</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{t('accessPage.noAdmins')}</h3>
                    <p className="text-sm text-muted-foreground">{t('accessPage.noAdminsDescription')}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {admins.map((admin) => (
                      <div key={admin.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center">
                            <span className="text-lg">
                              {admin.role === 'admin' ? '👑' : admin.role === 'operator' ? '⚙️' : '👁️'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">{admin.email}</span>
                            {admin.wallet_address && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {admin.wallet_address.slice(0, 8)}...{admin.wallet_address.slice(-6)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-2.5 py-1 text-xs rounded-full ${
                            admin.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-500'
                              : admin.role === 'operator'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}>
                            {t(`accessPage.roles.${admin.role}`)}
                          </span>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Domains Tab */}
      {activeTab === 'domains' && (
        <div className="space-y-4">
          {showAddDomain ? (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">{t('accessPage.addDomain')}</h3>
                <button onClick={() => setShowAddDomain(false)} className="p-2 hover:bg-secondary rounded-lg">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t('accessPage.domain')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={domainForm.domain}
                    onChange={(e) => setDomainForm({ domain: e.target.value })}
                    placeholder="example.com or *.example.com"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('accessPage.domainHint')}
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowAddDomain(false)}
                    className="px-5 py-2.5 border border-border rounded-xl text-foreground hover:bg-secondary"
                  >
                    {tc('actions.cancel')}
                  </button>
                  <button
                    onClick={handleAddDomain}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {t('accessPage.addDomain')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddDomain(true)}
                  className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('accessPage.addDomain')}
                </button>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : domains.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🌐</span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{t('accessPage.noDomains')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('accessPage.noDomainsDescription')}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {domains.map((domain) => (
                      <div key={domain.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center">
                            <span className="text-lg">🌐</span>
                          </div>
                          <div>
                            <span className="font-medium text-foreground font-mono">{domain.domain}</span>
                            <p className="text-xs text-muted-foreground">
                              {t('accessPage.added')} {new Date(domain.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDomain(domain.id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
