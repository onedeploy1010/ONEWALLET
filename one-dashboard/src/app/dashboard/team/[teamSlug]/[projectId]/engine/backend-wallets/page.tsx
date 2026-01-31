'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface BackendWallet {
  id: string;
  label: string;
  address: string;
  type: 'local' | 'aws-kms' | 'gcp-kms' | 'smart';
  chain_id: number;
  balance: string;
  nonce: number;
  created_at: string;
  transaction_count?: number;
}

const chainConfig: Record<number, { name: string; icon: string; symbol: string }> = {
  1: { name: 'Ethereum', icon: '⟠', symbol: 'ETH' },
  137: { name: 'Polygon', icon: '🟣', symbol: 'MATIC' },
  56: { name: 'BNB Chain', icon: '🟡', symbol: 'BNB' },
  42161: { name: 'Arbitrum', icon: '🔷', symbol: 'ETH' },
  10: { name: 'Optimism', icon: '🔴', symbol: 'ETH' },
  8453: { name: 'Base', icon: '🔵', symbol: 'ETH' },
};

const walletTypeConfig: Record<string, { label: string; icon: string; description: string; gradient: string }> = {
  local: { label: 'Local', icon: '🔐', description: 'Encrypted key storage', gradient: 'from-blue-500/20 to-indigo-500/10' },
  'aws-kms': { label: 'AWS KMS', icon: '☁️', description: 'AWS Key Management', gradient: 'from-orange-500/20 to-amber-500/10' },
  'gcp-kms': { label: 'GCP KMS', icon: '🌩️', description: 'Google Cloud KMS', gradient: 'from-blue-400/20 to-cyan-500/10' },
  smart: { label: 'Smart Wallet', icon: '🧠', description: 'Account abstraction', gradient: 'from-purple-500/20 to-violet-500/10' },
};

export default function BackendWalletsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [wallets, setWallets] = useState<BackendWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newWallet, setNewWallet] = useState({
    label: '',
    type: 'local' as const,
    chain_id: 137,
  });
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    fetchWallets();
  }, [projectId]);

  const fetchWallets = async () => {
    try {
      const res = await fetch(`/api/engine/backend-wallets?project_id=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setWallets(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    if (!newWallet.label) return;
    setCreating(true);
    try {
      const res = await fetch('/api/engine/backend-wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          ...newWallet,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewWallet({ label: '', type: 'local', chain_id: 137 });
        fetchWallets();
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance || '0'), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Backend Wallets</h1>
          <p className="text-muted-foreground">
            Server-side wallets for signing and sending transactions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Wallet
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#188775]/10 to-[#14a085]/5 border border-[#188775]/20 rounded-2xl p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#188775]/20 to-transparent rounded-full -mr-10 -mt-10" />
          <p className="text-sm text-muted-foreground mb-1">Total Wallets</p>
          <p className="text-3xl font-bold text-foreground">{wallets.length}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-10 -mt-10" />
          <p className="text-sm text-muted-foreground mb-1">Combined Balance</p>
          <p className="text-3xl font-bold text-foreground">{totalBalance.toFixed(4)} ETH</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-10 -mt-10" />
          <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
          <p className="text-3xl font-bold text-foreground">{wallets.reduce((sum, w) => sum + (w.transaction_count || 0), 0)}</p>
        </div>
      </div>

      {/* Wallet Types Info */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Wallet Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(walletTypeConfig).map(([type, config]) => (
            <div key={type} className={`p-4 rounded-xl bg-gradient-to-br ${config.gradient} border border-border/50`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{config.icon}</span>
                <span className="font-medium text-foreground">{config.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wallets List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-secondary rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-secondary rounded w-1/4 mb-2" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#188775]/20 to-[#14a085]/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔑</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No backend wallets</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a wallet to start sending transactions from your backend
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Wallet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {wallets.map((wallet) => {
            const chain = chainConfig[wallet.chain_id] || { name: 'Unknown', icon: '⬡', symbol: 'ETH' };
            const typeConfig = walletTypeConfig[wallet.type] || walletTypeConfig.local;

            return (
              <div
                key={wallet.id}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-[#188775]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${typeConfig.gradient} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{typeConfig.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{wallet.label}</h3>
                          <span className="px-2 py-0.5 text-xs bg-secondary rounded-md text-muted-foreground">
                            {typeConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-muted-foreground font-mono">
                            {wallet.address}
                          </code>
                          <button
                            onClick={() => copyAddress(wallet.address)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedAddress === wallet.address ? (
                              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">{wallet.balance} {chain.symbol}</p>
                        <p className="text-xs text-muted-foreground">Nonce: {wallet.nonce}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span>{chain.icon}</span>
                        {chain.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Created {new Date(wallet.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex-1" />
                      <button className="text-sm text-[#188775] hover:underline">Send Funds</button>
                      <button className="text-sm text-[#188775] hover:underline">View Transactions</button>
                      <button className="text-sm text-muted-foreground hover:text-red-500">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Create Backend Wallet</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Wallet Label</label>
                <input
                  type="text"
                  value={newWallet.label}
                  onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                  placeholder="e.g., Treasury Wallet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Wallet Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(walletTypeConfig).map(([type, config]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewWallet({ ...newWallet, type: type as typeof newWallet.type })}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        newWallet.type === type
                          ? 'border-[#188775] bg-[#188775]/5 ring-2 ring-[#188775]/20'
                          : 'border-border hover:border-[#188775]/50'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{config.icon}</span>
                      <p className="font-medium text-foreground text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground">{config.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Network</label>
                <select
                  value={newWallet.chain_id}
                  onChange={(e) => setNewWallet({ ...newWallet, chain_id: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                >
                  {Object.entries(chainConfig).map(([id, chain]) => (
                    <option key={id} value={id}>
                      {chain.icon} {chain.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-xl text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createWallet}
                disabled={!newWallet.label || creating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  'Create Wallet'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
