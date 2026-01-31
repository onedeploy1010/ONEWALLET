'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', icon: '⟠', color: 'from-blue-500/20 to-indigo-500/10' },
  { id: 137, name: 'Polygon', icon: '🟣', color: 'from-purple-500/20 to-violet-500/10' },
  { id: 56, name: 'BNB Chain', icon: '🟡', color: 'from-yellow-500/20 to-amber-500/10' },
  { id: 42161, name: 'Arbitrum', icon: '🔷', color: 'from-blue-500/20 to-cyan-500/10' },
  { id: 10, name: 'Optimism', icon: '🔴', color: 'from-red-500/20 to-rose-500/10' },
  { id: 8453, name: 'Base', icon: '🔵', color: 'from-blue-400/20 to-sky-500/10' },
];

const PROJECT_TEMPLATES = [
  {
    id: 'wallet',
    name: 'Wallet App',
    description: 'In-app wallets with social login, fiat on-ramp',
    icon: '💳',
    features: ['In-App Wallets', 'Fiat On-Ramp', 'Multi-Chain'],
  },
  {
    id: 'nft',
    name: 'NFT Platform',
    description: 'NFT minting, marketplace, and collections',
    icon: '🖼️',
    features: ['NFT Minting', 'Marketplace', 'Royalties'],
  },
  {
    id: 'defi',
    name: 'DeFi App',
    description: 'Token swaps, liquidity, and staking',
    icon: '📈',
    features: ['Token Swap', 'Liquidity', 'Staking'],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'In-game assets and player rewards',
    icon: '🎮',
    features: ['Game Assets', 'Rewards', 'Leaderboards'],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start from scratch',
    icon: '⚡',
    features: ['Full Control', 'API Access', 'Webhooks'],
  },
];

export default function NewTeamProjectPage() {
  const params = useParams();
  const router = useRouter();
  const teamSlug = params.teamSlug as string;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: 'custom',
    chains: [1, 137] as number[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdProject, setCreatedProject] = useState<{
    id: string;
    slug: string;
    clientId: string;
    secretKey: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleChainToggle = (chainId: number) => {
    const chains = formData.chains.includes(chainId)
      ? formData.chains.filter((id) => id !== chainId)
      : [...formData.chains, chainId];
    setFormData({ ...formData, chains });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          template: formData.template,
          chains: formData.chains,
          teamSlug,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create project');
      }

      setCreatedProject({
        id: data.data.id,
        slug: data.data.slug,
        clientId: data.data.clientId || data.data.client_id,
        secretKey: data.data.secretKey || data.data.apiKey || '',
      });
      setStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/team/${teamSlug}/projects`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Create New Project</h1>
        <p className="text-muted-foreground">Set up a new project for your team</p>
      </div>

      {/* Progress Steps */}
      {step < 3 && (
        <div className="flex items-center gap-4 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step >= s
                    ? 'bg-gradient-to-r from-[#188775] to-[#14a085] text-white'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step > s ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span className={`text-sm ${step >= s ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Details' : 'Chains'}
              </span>
              {s < 2 && <div className={`w-16 h-0.5 ${step > s ? 'bg-[#188775]' : 'bg-secondary'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Project Details & Template */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Awesome App"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your project..."
                rows={2}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775] resize-none"
              />
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Project Template</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {PROJECT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setFormData({ ...formData, template: template.id })}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    formData.template === template.id
                      ? 'border-[#188775] bg-[#188775]/5 ring-2 ring-[#188775]/20'
                      : 'border-border hover:border-[#188775]/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <h4 className="font-medium text-foreground text-sm">{template.name}</h4>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.name.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Chain Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Select Chains</h2>
            <p className="text-muted-foreground text-sm">Choose which blockchain networks your project will support</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {SUPPORTED_CHAINS.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainToggle(chain.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  formData.chains.includes(chain.id)
                    ? 'border-[#188775] bg-[#188775]/5 ring-2 ring-[#188775]/20'
                    : 'border-border hover:border-[#188775]/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${chain.color} flex items-center justify-center mb-3`}>
                  <span className="text-xl">{chain.icon}</span>
                </div>
                <h3 className="font-medium text-foreground">{chain.name}</h3>
                <p className="text-xs text-muted-foreground">Chain ID: {chain.id}</p>
              </button>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 border border-border rounded-xl text-foreground hover:bg-secondary transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && createdProject && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Project Created!</h2>
          <p className="text-muted-foreground mb-8">
            Your project "{formData.name}" has been created successfully
          </p>

          {createdProject.secretKey && (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Save your credentials</p>
                    <p className="text-xs text-yellow-600/80">You won't be able to see the secret key again.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-left mb-8">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Client ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={createdProject.clientId}
                      readOnly
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-xl font-mono text-sm text-foreground pr-20"
                    />
                    <button
                      onClick={() => copyToClipboard(createdProject.clientId, 'clientId')}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        copiedKey === 'clientId'
                          ? 'bg-green-500 text-white'
                          : 'bg-card border border-border text-foreground hover:bg-secondary'
                      }`}
                    >
                      {copiedKey === 'clientId' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Secret Key</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={createdProject.secretKey}
                      readOnly
                      className="w-full px-4 py-3 bg-secondary border border-border rounded-xl font-mono text-sm text-foreground pr-20"
                    />
                    <button
                      onClick={() => copyToClipboard(createdProject.secretKey, 'secretKey')}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        copiedKey === 'secretKey'
                          ? 'bg-green-500 text-white'
                          : 'bg-card border border-border text-foreground hover:bg-secondary'
                      }`}
                    >
                      {copiedKey === 'secretKey' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            onClick={() => router.push(`/dashboard/team/${teamSlug}/${createdProject.id}`)}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Go to Project Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
