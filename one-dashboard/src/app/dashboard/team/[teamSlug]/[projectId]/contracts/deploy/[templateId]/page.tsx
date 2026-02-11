'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

// Template configurations
const templateConfigs: Record<string, {
  name: string;
  icon: string;
  description: string;
  fields: FieldConfig[];
}> = {
  erc20: {
    name: 'Token (ERC-20)',
    icon: '🪙',
    description: 'Create a fungible token with customizable supply and features',
    fields: [
      { name: 'name', label: 'Token Name', type: 'text', placeholder: 'My Token', required: true },
      { name: 'symbol', label: 'Token Symbol', type: 'text', placeholder: 'MTK', required: true, maxLength: 10 },
      { name: 'initialSupply', label: 'Initial Supply', type: 'number', placeholder: '1000000', required: true },
      { name: 'decimals', label: 'Decimals', type: 'number', placeholder: '18', defaultValue: '18' },
      { name: 'mintable', label: 'Mintable', type: 'checkbox', description: 'Allow minting new tokens' },
      { name: 'burnable', label: 'Burnable', type: 'checkbox', description: 'Allow burning tokens' },
      { name: 'pausable', label: 'Pausable', type: 'checkbox', description: 'Allow pausing transfers' },
    ],
  },
  erc721: {
    name: 'NFT Collection (ERC-721)',
    icon: '🖼️',
    description: 'Deploy a unique NFT collection with metadata',
    fields: [
      { name: 'name', label: 'Collection Name', type: 'text', placeholder: 'My NFT Collection', required: true },
      { name: 'symbol', label: 'Symbol', type: 'text', placeholder: 'MNFT', required: true, maxLength: 10 },
      { name: 'baseUri', label: 'Base URI', type: 'text', placeholder: 'ipfs://.../', description: 'Base URI for token metadata' },
      { name: 'maxSupply', label: 'Max Supply', type: 'number', placeholder: '10000', description: '0 for unlimited' },
      { name: 'royaltyBps', label: 'Royalty (%)', type: 'number', placeholder: '5', description: 'Secondary sale royalty percentage' },
      { name: 'royaltyRecipient', label: 'Royalty Recipient', type: 'address', placeholder: '0x...', description: 'Address to receive royalties' },
    ],
  },
  erc1155: {
    name: 'Edition (ERC-1155)',
    icon: '📦',
    description: 'Multi-token standard for gaming and collectibles',
    fields: [
      { name: 'name', label: 'Collection Name', type: 'text', placeholder: 'My Edition', required: true },
      { name: 'symbol', label: 'Symbol', type: 'text', placeholder: 'MED', required: true },
      { name: 'baseUri', label: 'Base URI', type: 'text', placeholder: 'ipfs://.../' },
      { name: 'royaltyBps', label: 'Royalty (%)', type: 'number', placeholder: '5' },
      { name: 'royaltyRecipient', label: 'Royalty Recipient', type: 'address', placeholder: '0x...' },
    ],
  },
  'nft-drop': {
    name: 'NFT Drop',
    icon: '🎁',
    description: 'Claimable NFT drop with allowlist and phases',
    fields: [
      { name: 'name', label: 'Drop Name', type: 'text', placeholder: 'My NFT Drop', required: true },
      { name: 'symbol', label: 'Symbol', type: 'text', placeholder: 'DROP', required: true },
      { name: 'baseUri', label: 'Base URI', type: 'text', placeholder: 'ipfs://.../' },
      { name: 'maxSupply', label: 'Max Supply', type: 'number', placeholder: '10000', required: true },
      { name: 'price', label: 'Mint Price (ETH)', type: 'number', placeholder: '0.01', step: '0.001' },
      { name: 'maxPerWallet', label: 'Max Per Wallet', type: 'number', placeholder: '5' },
      { name: 'startTime', label: 'Start Time', type: 'datetime-local' },
      { name: 'royaltyBps', label: 'Royalty (%)', type: 'number', placeholder: '5' },
    ],
  },
  marketplace: {
    name: 'Marketplace',
    icon: '🏪',
    description: 'Create an NFT marketplace with auctions and direct listings',
    fields: [
      { name: 'name', label: 'Marketplace Name', type: 'text', placeholder: 'My Marketplace', required: true },
      { name: 'platformFeeBps', label: 'Platform Fee (%)', type: 'number', placeholder: '2.5', step: '0.1' },
      { name: 'platformFeeRecipient', label: 'Fee Recipient', type: 'address', placeholder: '0x...', required: true },
    ],
  },
  vote: {
    name: 'Vote (Governor)',
    icon: '🗳️',
    description: 'On-chain voting and governance for DAOs',
    fields: [
      { name: 'name', label: 'Governor Name', type: 'text', placeholder: 'My DAO Governor', required: true },
      { name: 'tokenAddress', label: 'Voting Token Address', type: 'address', placeholder: '0x...', required: true, description: 'ERC20 token for voting power' },
      { name: 'votingDelay', label: 'Voting Delay (blocks)', type: 'number', placeholder: '1', description: 'Blocks before voting starts' },
      { name: 'votingPeriod', label: 'Voting Period (blocks)', type: 'number', placeholder: '45818', description: '~1 week on Ethereum' },
      { name: 'proposalThreshold', label: 'Proposal Threshold', type: 'number', placeholder: '0', description: 'Tokens needed to propose' },
      { name: 'quorumPercent', label: 'Quorum (%)', type: 'number', placeholder: '4', description: 'Percentage of tokens needed' },
    ],
  },
  split: {
    name: 'Split',
    icon: '💰',
    description: 'Revenue sharing between multiple addresses',
    fields: [
      { name: 'name', label: 'Split Name', type: 'text', placeholder: 'Revenue Split', required: true },
      { name: 'recipients', label: 'Recipients', type: 'recipients', description: 'Add addresses and their share percentages' },
    ],
  },
  staking: {
    name: 'Staking',
    icon: '📈',
    description: 'Allow users to stake tokens and earn rewards',
    fields: [
      { name: 'name', label: 'Staking Pool Name', type: 'text', placeholder: 'Staking Pool', required: true },
      { name: 'stakingToken', label: 'Staking Token Address', type: 'address', placeholder: '0x...', required: true },
      { name: 'rewardToken', label: 'Reward Token Address', type: 'address', placeholder: '0x...', required: true },
      { name: 'rewardRatio', label: 'Reward Ratio', type: 'number', placeholder: '1', description: 'Rewards per token per second' },
      { name: 'lockDuration', label: 'Lock Duration (seconds)', type: 'number', placeholder: '0', description: '0 for no lock' },
    ],
  },
  airdrop: {
    name: 'Airdrop',
    icon: '🪂',
    description: 'Distribute tokens or NFTs to multiple recipients',
    fields: [
      { name: 'name', label: 'Airdrop Name', type: 'text', placeholder: 'Token Airdrop', required: true },
      { name: 'tokenAddress', label: 'Token Address', type: 'address', placeholder: '0x...', required: true },
      { name: 'tokenType', label: 'Token Type', type: 'select', options: ['ERC20', 'ERC721', 'ERC1155'], required: true },
      { name: 'merkleRoot', label: 'Merkle Root', type: 'text', placeholder: '0x...', description: 'For merkle proof claims (optional)' },
    ],
  },
};

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'address' | 'select' | 'datetime-local' | 'recipients';
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  maxLength?: number;
  step?: string;
  options?: string[];
}

interface Recipient {
  address: string;
  share: number;
}

const chains: Record<number, { name: string; icon: string; explorer: string }> = {
  1: { name: 'Ethereum', icon: '⟠', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', icon: '🟣', explorer: 'https://polygonscan.com' },
  8453: { name: 'Base', icon: '🔵', explorer: 'https://basescan.org' },
  42161: { name: 'Arbitrum', icon: '🔷', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', icon: '🔴', explorer: 'https://optimistic.etherscan.io' },
  56: { name: 'BNB Chain', icon: '🟡', explorer: 'https://bscscan.com' },
};

export default function DeployTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;
  const templateId = params.templateId as string;
  const chainId = parseInt(searchParams.get('chain') || '137');

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([{ address: '', share: 100 }]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ address: string; txHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = templateConfigs[templateId];
  const chain = chains[chainId];

  useEffect(() => {
    if (template) {
      const defaults: Record<string, any> = {};
      template.fields.forEach((field) => {
        if (field.defaultValue) {
          defaults[field.name] = field.defaultValue;
        }
        if (field.type === 'checkbox') {
          defaults[field.name] = false;
        }
      });
      setFormData(defaults);
    }
  }, [template]);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-6xl mb-4">❓</div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Template not found</h2>
        <p className="text-muted-foreground mb-4">The contract template "{templateId}" does not exist.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', share: 0 }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: 'address' | 'share', value: string | number) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const totalShares = recipients.reduce((sum, r) => sum + (r.share || 0), 0);

  const handleDeploy = async () => {
    setIsDeploying(true);
    setError(null);

    try {
      // Validate required fields
      for (const field of template.fields) {
        if (field.required && !formData[field.name]) {
          throw new Error(`${field.label} is required`);
        }
      }

      // For split contract, validate recipients
      if (templateId === 'split') {
        if (recipients.length < 2) {
          throw new Error('At least 2 recipients are required');
        }
        if (totalShares !== 100) {
          throw new Error('Total shares must equal 100%');
        }
        formData.recipients = recipients;
      }

      const response = await fetch('/api/contracts/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          chainId,
          projectId,
          params: formData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Deployment failed');
      }

      setDeployResult({
        address: data.data.contractAddress,
        txHash: data.data.transactionHash,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  // Success state
  if (deployResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Contract Deployed!</h2>
          <p className="text-muted-foreground mb-6">Your {template.name} has been deployed successfully.</p>

          <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-left">
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
              <p className="font-mono text-sm text-foreground break-all">{deployResult.address}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
              <p className="font-mono text-sm text-foreground break-all">{deployResult.txHash}</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <a
              href={`${chain.explorer}/address/${deployResult.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              View on Explorer
            </a>
            <button
              onClick={() => router.push(`/dashboard/team/${teamSlug}/${projectId}/contracts/${deployResult.address}`)}
              className="px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Manage Contract
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center">
            <span className="text-2xl">{template.icon}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Deploy {template.name}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>{chain.icon}</span>
              <span>{chain.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <p className="text-muted-foreground">{template.description}</p>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {template.fields.map((field) => (
            <div key={field.name}>
              {field.type === 'checkbox' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[field.name] || false}
                    onChange={(e) => handleInputChange(field.name, e.target.checked)}
                    className="w-5 h-5 rounded border-border bg-secondary text-[#2563EB] focus:ring-[#2563EB]/20"
                  />
                  <div>
                    <span className="text-foreground font-medium">{field.label}</span>
                    {field.description && (
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                </label>
              ) : field.type === 'select' ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              ) : field.type === 'recipients' ? (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {field.label}
                    {field.description && (
                      <span className="text-xs text-muted-foreground ml-2">{field.description}</span>
                    )}
                  </label>
                  <div className="space-y-3">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          type="text"
                          placeholder="0x..."
                          value={recipient.address}
                          onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                          className="flex-1 px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] font-mono text-sm"
                        />
                        <div className="relative w-24">
                          <input
                            type="number"
                            placeholder="50"
                            value={recipient.share || ''}
                            onChange={(e) => updateRecipient(index, 'share', parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 pr-8 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                        </div>
                        {recipients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipient(index)}
                            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={addRecipient}
                        className="text-sm text-[#2563EB] hover:underline"
                      >
                        + Add Recipient
                      </button>
                      <span className={`text-sm ${totalShares === 100 ? 'text-green-500' : 'text-red-500'}`}>
                        Total: {totalShares}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type === 'address' ? 'text' : field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    maxLength={field.maxLength}
                    step={field.step}
                    className={`w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] ${field.type === 'address' ? 'font-mono text-sm' : ''}`}
                  />
                  {field.description && (
                    <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Deploy Button */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full py-4 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeploying ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deploying...
              </>
            ) : (
              <>
                Deploy Contract
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Deployment will require gas fees on {chain.name}
          </p>
        </div>
      </div>
    </div>
  );
}
