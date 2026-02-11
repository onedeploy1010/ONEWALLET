'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ContractDetails {
  id: string;
  name: string;
  address: string;
  chain_id: number;
  type: string;
  status: 'active' | 'paused' | 'deprecated';
  deployed_at: string;
  deployer_address: string;
  transaction_hash: string;
  bytecode_hash?: string;
  verified: boolean;
  abi?: object[];
  source_code?: string;
  constructor_args?: string;
  version?: string;
  proxy_type?: string;
  implementation_address?: string;
}

interface ContractStats {
  total_transactions: number;
  unique_users: number;
  total_value: string;
  gas_used: string;
  last_activity: string;
}

interface ContractEvent {
  id: string;
  event_name: string;
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  args: Record<string, string>;
}

interface ReadFunction {
  name: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
}

interface WriteFunction {
  name: string;
  inputs: { name: string; type: string }[];
  payable: boolean;
}

const chainConfig: Record<number, { name: string; icon: string; color: string; explorer: string }> = {
  1: { name: 'Ethereum', icon: '⟠', color: 'from-blue-500/20 to-indigo-500/10', explorer: 'https://etherscan.io' },
  137: { name: 'Polygon', icon: '🟣', color: 'from-purple-500/20 to-violet-500/10', explorer: 'https://polygonscan.com' },
  56: { name: 'BNB Chain', icon: '🟡', color: 'from-yellow-500/20 to-amber-500/10', explorer: 'https://bscscan.com' },
  42161: { name: 'Arbitrum', icon: '🔷', color: 'from-blue-500/20 to-cyan-500/10', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', icon: '🔴', color: 'from-red-500/20 to-rose-500/10', explorer: 'https://optimistic.etherscan.io' },
  8453: { name: 'Base', icon: '🔵', color: 'from-blue-400/20 to-sky-500/10', explorer: 'https://basescan.org' },
};

export default function ContractDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;
  const address = params.address as string;

  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'read' | 'write' | 'events' | 'source'>('overview');
  const [readFunctions, setReadFunctions] = useState<ReadFunction[]>([]);
  const [writeFunctions, setWriteFunctions] = useState<WriteFunction[]>([]);
  const [functionInputs, setFunctionInputs] = useState<Record<string, Record<string, string>>>({});
  const [functionResults, setFunctionResults] = useState<Record<string, string>>({});
  const [executingFunction, setExecutingFunction] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchContractData = useCallback(async () => {
    setLoading(true);
    try {
      const [contractRes, statsRes, eventsRes] = await Promise.all([
        fetch(`/api/contracts/${address}?project_id=${projectId}`),
        fetch(`/api/contracts/${address}/stats?project_id=${projectId}`),
        fetch(`/api/contracts/${address}/events?project_id=${projectId}&limit=20`),
      ]);

      const [contractData, statsData, eventsData] = await Promise.all([
        contractRes.json(),
        statsRes.json(),
        eventsRes.json(),
      ]);

      if (contractData.success) {
        setContract(contractData.data);
        // Parse ABI for read/write functions
        if (contractData.data.abi) {
          const abi = contractData.data.abi;
          const reads: ReadFunction[] = [];
          const writes: WriteFunction[] = [];

          abi.forEach((item: { type: string; stateMutability?: string; name?: string; inputs?: { name: string; type: string }[]; outputs?: { name: string; type: string }[]; payable?: boolean }) => {
            if (item.type === 'function') {
              if (item.stateMutability === 'view' || item.stateMutability === 'pure') {
                reads.push({
                  name: item.name || '',
                  inputs: item.inputs || [],
                  outputs: item.outputs || [],
                });
              } else {
                writes.push({
                  name: item.name || '',
                  inputs: item.inputs || [],
                  payable: item.payable || item.stateMutability === 'payable',
                });
              }
            }
          });

          setReadFunctions(reads);
          setWriteFunctions(writes);
        }
      }
      if (statsData.success) setStats(statsData.data);
      if (eventsData.success) setEvents(eventsData.data || []);
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
    } finally {
      setLoading(false);
    }
  }, [address, projectId]);

  useEffect(() => {
    fetchContractData();
  }, [fetchContractData]);

  const handleReadFunction = async (funcName: string) => {
    setExecutingFunction(funcName);
    try {
      const inputs = functionInputs[funcName] || {};
      const res = await fetch(`/api/contracts/${address}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          function_name: funcName,
          args: Object.values(inputs),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFunctionResults({ ...functionResults, [funcName]: JSON.stringify(data.data, null, 2) });
      } else {
        setFunctionResults({ ...functionResults, [funcName]: `Error: ${data.error?.message}` });
      }
    } catch (error) {
      setFunctionResults({ ...functionResults, [funcName]: `Error: ${(error as Error).message}` });
    } finally {
      setExecutingFunction(null);
    }
  };

  const handleWriteFunction = async (funcName: string) => {
    setExecutingFunction(funcName);
    try {
      const inputs = functionInputs[funcName] || {};
      const res = await fetch(`/api/contracts/${address}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          function_name: funcName,
          args: Object.values(inputs),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFunctionResults({ ...functionResults, [funcName]: `Transaction submitted: ${data.data.tx_hash}` });
      } else {
        setFunctionResults({ ...functionResults, [funcName]: `Error: ${data.error?.message}` });
      }
    } catch (error) {
      setFunctionResults({ ...functionResults, [funcName]: `Error: ${(error as Error).message}` });
    } finally {
      setExecutingFunction(null);
    }
  };

  const updateFunctionInput = (funcName: string, inputName: string, value: string) => {
    setFunctionInputs((prev) => ({
      ...prev,
      [funcName]: {
        ...(prev[funcName] || {}),
        [inputName]: value,
      },
    }));
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="font-semibold text-foreground mb-2">Contract Not Found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The contract at address {address.slice(0, 10)}... was not found
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-secondary text-foreground rounded-xl hover:bg-secondary/80"
        >
          Go Back
        </button>
      </div>
    );
  }

  const chain = chainConfig[contract.chain_id] || { name: 'Unknown', icon: '⬡', color: 'from-gray-500/20 to-gray-600/10', explorer: '' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href={`/dashboard/team/${teamSlug}/${projectId}/contracts/published`} className="hover:text-foreground">
            Contracts
          </Link>
          <span>/</span>
          <span className="font-mono">{address.slice(0, 10)}...</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{contract.name}</h1>
              <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                contract.status === 'active'
                  ? 'bg-green-500/10 text-green-500'
                  : contract.status === 'paused'
                  ? 'bg-yellow-500/10 text-yellow-500'
                  : 'bg-gray-500/10 text-gray-500'
              }`}>
                {contract.status}
              </span>
              {contract.verified && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm text-muted-foreground font-mono">{address}</code>
              <button
                onClick={() => copyToClipboard(address, 'address')}
                className={`p-1 rounded transition-colors ${copiedField === 'address' ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {copiedField === 'address' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          {chain.explorer && (
            <a
              href={`${chain.explorer}/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary flex items-center gap-2"
            >
              <span>{chain.icon}</span>
              View on {chain.name}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
            <p className="text-xl font-bold text-foreground">{stats.total_transactions.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Unique Users</p>
            <p className="text-xl font-bold text-foreground">{stats.unique_users.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Value</p>
            <p className="text-xl font-bold text-foreground">{stats.total_value}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Gas Used</p>
            <p className="text-xl font-bold text-foreground">{stats.gas_used}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Last Activity</p>
            <p className="text-lg font-bold text-foreground">{stats.last_activity ? new Date(stats.last_activity).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: '📋' },
          { id: 'read', label: 'Read Contract', icon: '👁️' },
          { id: 'write', label: 'Write Contract', icon: '✏️' },
          { id: 'events', label: 'Events', icon: '📢' },
          { id: 'source', label: 'Source Code', icon: '💻' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Contract Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Type</span>
                <span className="text-foreground">{contract.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Chain</span>
                <span className="text-foreground flex items-center gap-1.5">
                  {chain.icon} {chain.name}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Deployed</span>
                <span className="text-foreground">{new Date(contract.deployed_at).toLocaleString()}</span>
              </div>
              {contract.version && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Version</span>
                  <span className="text-foreground">{contract.version}</span>
                </div>
              )}
              {contract.proxy_type && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Proxy Type</span>
                  <span className="text-foreground">{contract.proxy_type}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Deployment Details</h3>
            <div className="space-y-3">
              <div className="py-2 border-b border-border">
                <span className="text-muted-foreground block text-sm mb-1">Deployer</span>
                <code className="text-foreground text-sm font-mono">{contract.deployer_address}</code>
              </div>
              <div className="py-2 border-b border-border">
                <span className="text-muted-foreground block text-sm mb-1">Transaction Hash</span>
                <div className="flex items-center gap-2">
                  <code className="text-foreground text-sm font-mono truncate">{contract.transaction_hash}</code>
                  {chain.explorer && (
                    <a
                      href={`${chain.explorer}/tx/${contract.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
              {contract.implementation_address && (
                <div className="py-2 border-b border-border">
                  <span className="text-muted-foreground block text-sm mb-1">Implementation</span>
                  <code className="text-foreground text-sm font-mono">{contract.implementation_address}</code>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'read' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {readFunctions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No read functions available</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {readFunctions.map((func) => (
                <div key={func.name} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-medium text-foreground">{func.name}</h4>
                      {func.outputs.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Returns: {func.outputs.map((o) => `${o.type}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleReadFunction(func.name)}
                      disabled={executingFunction === func.name}
                      className="px-3 py-1.5 bg-[#2563EB]/10 text-[#2563EB] rounded-lg text-sm font-medium hover:bg-[#2563EB]/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {executingFunction === func.name && (
                        <div className="w-3 h-3 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
                      )}
                      Query
                    </button>
                  </div>
                  {func.inputs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {func.inputs.map((input) => (
                        <div key={input.name}>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {input.name} ({input.type})
                          </label>
                          <input
                            type="text"
                            value={functionInputs[func.name]?.[input.name] || ''}
                            onChange={(e) => updateFunctionInput(func.name, input.name, e.target.value)}
                            placeholder={input.type}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {functionResults[func.name] && (
                    <div className="mt-3 p-3 bg-secondary rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Result:</p>
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                        {functionResults[func.name]}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'write' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {writeFunctions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No write functions available</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {writeFunctions.map((func) => (
                <div key={func.name} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        {func.name}
                        {func.payable && (
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-xs rounded-full">payable</span>
                        )}
                      </h4>
                    </div>
                    <button
                      onClick={() => handleWriteFunction(func.name)}
                      disabled={executingFunction === func.name}
                      className="px-3 py-1.5 bg-orange-500/10 text-orange-500 rounded-lg text-sm font-medium hover:bg-orange-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {executingFunction === func.name && (
                        <div className="w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                      )}
                      Write
                    </button>
                  </div>
                  {func.inputs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      {func.inputs.map((input) => (
                        <div key={input.name}>
                          <label className="block text-xs text-muted-foreground mb-1">
                            {input.name} ({input.type})
                          </label>
                          <input
                            type="text"
                            value={functionInputs[func.name]?.[input.name] || ''}
                            onChange={(e) => updateFunctionInput(func.name, input.name, e.target.value)}
                            placeholder={input.type}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  {functionResults[func.name] && (
                    <div className="mt-3 p-3 bg-secondary rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Result:</p>
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                        {functionResults[func.name]}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📢</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">No events yet</h3>
              <p className="text-sm text-muted-foreground">Contract events will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {events.map((event) => (
                <div key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">{event.event_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Block #{event.block_number} · {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {chain.explorer && (
                      <a
                        href={`${chain.explorer}/tx/${event.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563EB] hover:underline text-sm flex items-center gap-1"
                      >
                        View Tx
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  {Object.keys(event.args).length > 0 && (
                    <div className="mt-2 p-3 bg-secondary rounded-lg">
                      <div className="grid gap-1">
                        {Object.entries(event.args).map(([key, value]) => (
                          <div key={key} className="flex gap-2 text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="text-foreground font-mono truncate">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'source' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {contract.source_code ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Source Code</h3>
                <button
                  onClick={() => copyToClipboard(contract.source_code!, 'source')}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground hover:bg-secondary flex items-center gap-2"
                >
                  {copiedField === 'source' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="bg-secondary rounded-xl p-4 overflow-x-auto">
                <pre className="text-sm text-foreground font-mono whitespace-pre">
                  {contract.source_code}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Source Not Available</h3>
              <p className="text-sm text-muted-foreground">
                Contract source code has not been verified or uploaded
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
