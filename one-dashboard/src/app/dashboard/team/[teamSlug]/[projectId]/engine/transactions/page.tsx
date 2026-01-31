'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Transaction {
  id: string;
  queue_id: string;
  type: string;
  status: 'pending' | 'submitted' | 'mined' | 'failed' | 'cancelled';
  from_address: string;
  to_address: string;
  chain_id: number;
  value: string;
  data?: string;
  gas_limit?: string;
  gas_price?: string;
  gas_used?: string;
  tx_hash?: string;
  error_message?: string;
  nonce?: number;
  retries: number;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const chainNames: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Ethereum', icon: '⟠', color: 'from-blue-500/20 to-indigo-500/10' },
  137: { name: 'Polygon', icon: '🟣', color: 'from-purple-500/20 to-violet-500/10' },
  56: { name: 'BNB Chain', icon: '🟡', color: 'from-yellow-500/20 to-amber-500/10' },
  42161: { name: 'Arbitrum', icon: '🔷', color: 'from-blue-500/20 to-cyan-500/10' },
  10: { name: 'Optimism', icon: '🔴', color: 'from-red-500/20 to-rose-500/10' },
  8453: { name: 'Base', icon: '🔵', color: 'from-blue-400/20 to-sky-500/10' },
};

const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: '⏳', label: 'Pending' },
  submitted: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: '📤', label: 'Submitted' },
  mined: { bg: 'bg-green-500/10', text: 'text-green-500', icon: '✅', label: 'Mined' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-500', icon: '❌', label: 'Failed' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: '🚫', label: 'Cancelled' },
};

export default function TransactionsPage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    status: string;
    chainId: string;
    search: string;
  }>({
    status: 'all',
    chainId: 'all',
    search: '',
  });
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        project_id: projectId,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filter.status !== 'all') queryParams.set('status', filter.status);
      if (filter.chainId !== 'all') queryParams.set('chain_id', filter.chainId);
      if (filter.search) queryParams.set('search', filter.search);

      const res = await fetch(`/api/engine/transactions?${queryParams}`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, pagination.page, pagination.limit, filter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRetry = async (txId: string) => {
    setActionLoading(txId);
    try {
      const res = await fetch(`/api/engine/transactions/${txId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to retry transaction:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (txId: string) => {
    if (!confirm('Are you sure you want to cancel this transaction?')) return;
    setActionLoading(txId);
    try {
      const res = await fetch(`/api/engine/transactions/${txId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Failed to cancel transaction:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href={`/dashboard/team/${teamSlug}/${projectId}/engine/overview`} className="hover:text-foreground">
              Engine
            </Link>
            <span>/</span>
            <span>Transactions</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Transaction Queue</h1>
          <p className="text-muted-foreground">
            Monitor and manage your transaction queue
          </p>
        </div>
        <button
          onClick={() => fetchTransactions()}
          className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1.5">Search</label>
            <input
              type="text"
              placeholder="Search by address or tx hash..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="mined">Mined</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-muted-foreground mb-1.5">Chain</label>
            <select
              value={filter.chainId}
              onChange={(e) => setFilter({ ...filter, chainId: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
            >
              <option value="all">All Chains</option>
              {Object.entries(chainNames).map(([id, chain]) => (
                <option key={id} value={id}>{chain.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-2 border-[#188775] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#188775]/20 to-[#14a085]/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">No transactions found</h3>
            <p className="text-sm text-muted-foreground">
              {filter.status !== 'all' || filter.chainId !== 'all' || filter.search
                ? 'Try adjusting your filters'
                : 'Transactions will appear here when you use the Engine API'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Chain</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">From / To</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Value</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Gas</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Created</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const status = statusConfig[tx.status] || statusConfig.pending;
                    const chain = chainNames[tx.chain_id] || { name: `Chain ${tx.chain_id}`, icon: '🔗', color: 'from-gray-500/20 to-gray-600/10' };
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedTx(tx)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground text-sm">{tx.type}</span>
                          {tx.retries > 0 && (
                            <span className="ml-2 text-xs text-orange-500">({tx.retries} retries)</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${status.bg} ${status.text}`}>
                            <span>{status.icon}</span>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{chain.icon}</span>
                            <span className="text-sm text-foreground">{chain.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-muted-foreground">
                            <div>{formatAddress(tx.from_address)}</div>
                            <div className="text-[#188775]">→ {formatAddress(tx.to_address)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-foreground">{tx.value || '0'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {tx.gas_used ? (
                            <span className="text-sm text-muted-foreground">{tx.gas_used}</span>
                          ) : tx.gas_limit ? (
                            <span className="text-sm text-muted-foreground">{tx.gas_limit} (est)</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}
                            <br />
                            {new Date(tx.created_at).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {tx.status === 'failed' && (
                              <button
                                onClick={() => handleRetry(tx.id)}
                                disabled={actionLoading === tx.id}
                                className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                title="Retry"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                            {(tx.status === 'pending' || tx.status === 'submitted') && (
                              <button
                                onClick={() => handleCancel(tx.id)}
                                disabled={actionLoading === tx.id}
                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Cancel"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                            {tx.tx_hash && (
                              <a
                                href={`https://etherscan.io/tx/${tx.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-[#188775] hover:bg-[#188775]/10 rounded-lg transition-colors"
                                title="View on Explorer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedTx(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Queue ID</label>
                  <p className="font-mono text-sm text-foreground">{selectedTx.queue_id}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <p className={`text-sm font-medium ${statusConfig[selectedTx.status]?.text}`}>
                    {statusConfig[selectedTx.status]?.icon} {statusConfig[selectedTx.status]?.label}
                  </p>
                </div>
              </div>

              {selectedTx.tx_hash && (
                <div>
                  <label className="text-xs text-muted-foreground">Transaction Hash</label>
                  <p className="font-mono text-sm text-foreground break-all">{selectedTx.tx_hash}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <p className="font-mono text-sm text-foreground break-all">{selectedTx.from_address}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <p className="font-mono text-sm text-foreground break-all">{selectedTx.to_address}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Chain</label>
                  <p className="text-sm text-foreground">
                    {chainNames[selectedTx.chain_id]?.icon} {chainNames[selectedTx.chain_id]?.name || `Chain ${selectedTx.chain_id}`}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Value</label>
                  <p className="text-sm text-foreground">{selectedTx.value || '0'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Nonce</label>
                  <p className="text-sm text-foreground">{selectedTx.nonce ?? '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Gas Limit</label>
                  <p className="text-sm text-foreground">{selectedTx.gas_limit || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Gas Price</label>
                  <p className="text-sm text-foreground">{selectedTx.gas_price || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Gas Used</label>
                  <p className="text-sm text-foreground">{selectedTx.gas_used || '-'}</p>
                </div>
              </div>

              {selectedTx.data && (
                <div>
                  <label className="text-xs text-muted-foreground">Data</label>
                  <div className="mt-1 p-3 bg-secondary rounded-lg overflow-x-auto">
                    <p className="font-mono text-xs text-muted-foreground break-all">{selectedTx.data}</p>
                  </div>
                </div>
              )}

              {selectedTx.error_message && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <label className="text-xs text-red-500">Error</label>
                  <p className="text-sm text-red-400">{selectedTx.error_message}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Created</label>
                  <p className="text-foreground">{new Date(selectedTx.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Updated</label>
                  <p className="text-foreground">{new Date(selectedTx.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
