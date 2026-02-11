'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Contract {
  id: string;
  name: string;
  address: string;
  chain_id: number;
  chain_name: string;
  type: string;
  status: 'active' | 'paused' | 'deprecated';
  deployed_at: string;
  transaction_count: number;
  version?: string;
}

const chainConfig: Record<number, { name: string; icon: string; color: string; explorer: string }> = {
  1: { name: 'Ethereum', icon: '⟠', color: 'from-blue-500/20 to-indigo-500/10', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', icon: '🟣', color: 'from-purple-500/20 to-violet-500/10', explorer: 'https://polygonscan.com' },
  56: { name: 'BNB Chain', icon: '🟡', color: 'from-yellow-500/20 to-amber-500/10', explorer: 'https://bscscan.com' },
  42161: { name: 'Arbitrum', icon: '🔷', color: 'from-blue-500/20 to-cyan-500/10', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', icon: '🔴', color: 'from-red-500/20 to-rose-500/10', explorer: 'https://optimistic.etherscan.io' },
  8453: { name: 'Base', icon: '🔵', color: 'from-blue-400/20 to-sky-500/10', explorer: 'https://basescan.org' },
  43114: { name: 'Avalanche', icon: '🔺', color: 'from-red-500/20 to-orange-500/10', explorer: 'https://snowtrace.io' },
};

const typeIcons: Record<string, string> = {
  'ERC-20': '🪙',
  'ERC-721': '🖼️',
  'ERC-1155': '📦',
  'Marketplace': '🏪',
  'Governor': '🗳️',
  'Split': '💰',
  'Staking': '📈',
  'Custom': '⚡',
};

export default function PublishedContractsPage() {
  const params = useParams();
  const t = useTranslations('contracts');
  const tc = useTranslations('common');
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContracts();
  }, [projectId]);

  const fetchContracts = async () => {
    try {
      const res = await fetch(`/api/contracts?project_id=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setContracts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('published.title')}</h1>
          <p className="text-muted-foreground">
            {t('published.subtitle')}
          </p>
        </div>
        <Link
          href={`/dashboard/team/${teamSlug}/${projectId}/contracts/deploy`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('published.deployNew')}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#2563EB]/10 to-[#3B82F6]/5 border border-[#2563EB]/20 rounded-2xl p-5">
          <p className="text-sm text-muted-foreground mb-1">{t('published.totalContracts')}</p>
          <p className="text-2xl font-bold text-foreground">{contracts.length}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-5">
          <p className="text-sm text-muted-foreground mb-1">{tc('status.active')}</p>
          <p className="text-2xl font-bold text-green-500">{contracts.filter(c => c.status === 'active').length}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-2xl p-5">
          <p className="text-sm text-muted-foreground mb-1">{tc('status.paused')}</p>
          <p className="text-2xl font-bold text-yellow-500">{contracts.filter(c => c.status === 'paused').length}</p>
        </div>
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5">
          <p className="text-sm text-muted-foreground mb-1">{t('published.totalTransactions')}</p>
          <p className="text-2xl font-bold text-blue-500">{contracts.reduce((sum, c) => sum + c.transaction_count, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={t('published.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
          />
        </div>
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
          {(['all', 'active', 'paused'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List */}
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
      ) : filteredContracts.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📜</span>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {contracts.length === 0 ? t('published.noContracts') : t('published.noMatching')}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {contracts.length === 0
              ? t('published.noContractsHint')
              : t('published.noMatchingHint')}
          </p>
          {contracts.length === 0 && (
            <Link
              href={`/dashboard/team/${teamSlug}/${projectId}/contracts/deploy`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('published.deployContract')}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const chain = chainConfig[contract.chain_id] || { name: 'Unknown', icon: '⬡', color: 'from-gray-500/20 to-gray-600/10', explorer: '' };
            const typeIcon = typeIcons[contract.type] || '📄';

            return (
              <div
                key={contract.id}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-[#2563EB]/30 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl">{chain.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{contract.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            contract.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                              : contract.status === 'paused'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}>
                            {contract.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-muted-foreground font-mono">
                            {contract.address.slice(0, 10)}...{contract.address.slice(-8)}
                          </code>
                          <button
                            onClick={() => copyAddress(contract.address)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/team/${teamSlug}/${projectId}/contracts/${contract.address}`}
                        className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        {t('published.viewDetails')}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span>{typeIcon}</span>
                        {contract.type}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span>{chain.icon}</span>
                        {chain.name}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {t('published.txs', { count: contract.transaction_count.toLocaleString() })}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(contract.deployed_at).toLocaleDateString()}
                      </span>
                      {chain.explorer && (
                        <a
                          href={`${chain.explorer}/address/${contract.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[#2563EB] hover:underline"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          {t('published.explorer')}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
