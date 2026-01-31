'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'token' | 'nft' | 'marketplace' | 'governance' | 'defi' | 'custom';
  icon: string;
  gradient: string;
  features: string[];
  popular?: boolean;
}

const templates: ContractTemplate[] = [
  {
    id: 'erc20',
    name: 'Token (ERC-20)',
    description: 'Create a fungible token with customizable supply and features',
    category: 'token',
    icon: '🪙',
    gradient: 'from-yellow-500/20 to-orange-500/10',
    features: ['Mintable', 'Burnable', 'Pausable'],
    popular: true,
  },
  {
    id: 'erc721',
    name: 'NFT Collection (ERC-721)',
    description: 'Deploy a unique NFT collection with metadata',
    category: 'nft',
    icon: '🖼️',
    gradient: 'from-purple-500/20 to-pink-500/10',
    features: ['Lazy Mint', 'Royalties', 'Reveal'],
    popular: true,
  },
  {
    id: 'erc1155',
    name: 'Edition (ERC-1155)',
    description: 'Multi-token standard for gaming and collectibles',
    category: 'nft',
    icon: '📦',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    features: ['Batch Transfers', 'Mixed Fungibility', 'Gas Efficient'],
  },
  {
    id: 'nft-drop',
    name: 'NFT Drop',
    description: 'Claimable NFT drop with allowlist and phases',
    category: 'nft',
    icon: '🎁',
    gradient: 'from-green-500/20 to-emerald-500/10',
    features: ['Allowlist', 'Claim Phases', 'Delayed Reveal'],
    popular: true,
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Create an NFT marketplace with auctions and direct listings',
    category: 'marketplace',
    icon: '🏪',
    gradient: 'from-indigo-500/20 to-violet-500/10',
    features: ['Auctions', 'Direct Sales', 'Offers'],
  },
  {
    id: 'vote',
    name: 'Vote (Governor)',
    description: 'On-chain voting and governance for DAOs',
    category: 'governance',
    icon: '🗳️',
    gradient: 'from-red-500/20 to-rose-500/10',
    features: ['Proposals', 'Voting', 'Execution'],
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Revenue sharing between multiple addresses',
    category: 'defi',
    icon: '💰',
    gradient: 'from-[#188775]/20 to-[#14a085]/10',
    features: ['Auto Split', 'Withdraw', 'Update Recipients'],
  },
  {
    id: 'staking',
    name: 'Staking',
    description: 'Allow users to stake tokens and earn rewards',
    category: 'defi',
    icon: '📈',
    gradient: 'from-amber-500/20 to-yellow-500/10',
    features: ['Stake/Unstake', 'Rewards', 'Lock Period'],
  },
  {
    id: 'airdrop',
    name: 'Airdrop',
    description: 'Distribute tokens or NFTs to multiple recipients',
    category: 'custom',
    icon: '🪂',
    gradient: 'from-sky-500/20 to-blue-500/10',
    features: ['Batch Send', 'Merkle Proof', 'Claim'],
  },
];

const categories = [
  { id: 'all', label: 'All Templates', icon: '📋' },
  { id: 'token', label: 'Tokens', icon: '🪙' },
  { id: 'nft', label: 'NFTs', icon: '🖼️' },
  { id: 'marketplace', label: 'Marketplace', icon: '🏪' },
  { id: 'governance', label: 'Governance', icon: '🗳️' },
  { id: 'defi', label: 'DeFi', icon: '📈' },
  { id: 'custom', label: 'Custom', icon: '⚡' },
];

const chains = [
  { id: 1, name: 'Ethereum', icon: '⟠', color: 'text-blue-500' },
  { id: 137, name: 'Polygon', icon: '🟣', color: 'text-purple-500' },
  { id: 8453, name: 'Base', icon: '🔵', color: 'text-blue-400' },
  { id: 42161, name: 'Arbitrum', icon: '🔷', color: 'text-blue-600' },
  { id: 10, name: 'Optimism', icon: '🔴', color: 'text-red-500' },
  { id: 56, name: 'BNB Chain', icon: '🟡', color: 'text-yellow-500' },
];

export default function DeployContractPage() {
  const params = useParams();
  const router = useRouter();
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<number>(137);
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = category === 'all' || t.category === category;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDeploy = () => {
    if (!selectedTemplate) return;
    router.push(`/dashboard/team/${teamSlug}/${projectId}/contracts/deploy/${selectedTemplate}?chain=${selectedChain}`);
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Deploy Contract</h1>
        <p className="text-muted-foreground">
          Choose a pre-built contract template or deploy your own
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
          />
        </div>
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl overflow-x-auto">
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                category === cat.id
                  ? 'bg-gradient-to-r from-[#188775] to-[#14a085] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Badge */}
      {category === 'all' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="px-2 py-1 bg-[#188775]/10 text-[#188775] rounded-md text-xs font-medium">Popular</span>
          <span>contracts are marked with a badge</span>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(template.id)}
            className={`relative text-left p-6 border rounded-2xl transition-all group ${
              selectedTemplate === template.id
                ? 'border-[#188775] bg-[#188775]/5 ring-2 ring-[#188775]/20'
                : 'border-border hover:border-[#188775]/50 hover:shadow-lg bg-card'
            }`}
          >
            {template.popular && (
              <span className="absolute top-4 right-4 px-2 py-1 bg-[#188775]/10 text-[#188775] rounded-md text-xs font-medium">
                Popular
              </span>
            )}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${template.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="text-3xl">{template.icon}</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">{template.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
            <div className="flex flex-wrap gap-2">
              {template.features.map((feature) => (
                <span key={feature} className="px-2 py-1 text-xs bg-secondary rounded-md text-muted-foreground">
                  {feature}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-semibold text-foreground mb-2">No contracts found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}

      {/* Deploy Panel */}
      {selectedTemplate && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-40">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTemplateData?.gradient} flex items-center justify-center`}>
                <span className="text-2xl">{selectedTemplateData?.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedTemplateData?.name}</p>
                <p className="text-sm text-muted-foreground">Ready to configure</p>
              </div>
            </div>

            {/* Chain Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Deploy to:</span>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(Number(e.target.value))}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20"
              >
                {chains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleDeploy}
              className="px-8 py-3 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
            >
              Continue to Deploy
            </button>
          </div>
        </div>
      )}

      {/* Spacer for fixed panel */}
      {selectedTemplate && <div className="h-24" />}
    </div>
  );
}
