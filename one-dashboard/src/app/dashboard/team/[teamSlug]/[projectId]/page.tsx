'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { useTranslations } from 'next-intl';

interface ProjectData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  client_id: string;
  api_key_prefix?: string;
  created_at: string;
  updated_at: string;
}

interface ProjectStats {
  totalWallets: number;
  totalTransactions: number;
  activeContracts: number;
  apiCallsToday: number;
}

interface ApiKey {
  id: string;
  name: string;
  type: string;
  prefix: string;
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('projects');
  const tc = useTranslations('common');
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [stats, setStats] = useState<ProjectStats>({
    totalWallets: 0,
    totalTransactions: 0,
    activeContracts: 0,
    apiCallsToday: 0,
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Key rotation state
  const [rotatingKey, setRotatingKey] = useState<string | null>(null);
  const [rotatedKey, setRotatedKey] = useState<{ type: string; key: string } | null>(null);

  // Delete project state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const [projectRes, keysRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/keys`),
      ]);

      const [projectData, keysData] = await Promise.all([
        projectRes.json(),
        keysRes.json(),
      ]);

      if (projectData.success) {
        setProject(projectData.data.project);
        setStats({
          totalWallets: 0,
          totalTransactions: 0,
          activeContracts: 0,
          apiCallsToday: projectData.data.project.api_calls_today || 0,
        });
      }

      if (keysData.success) {
        setApiKeys(keysData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleRotateKey = async (type: 'publishable' | 'secret') => {
    if (!confirm(t('apiCredentials.rotateConfirm', { keyType: type }))) {
      return;
    }

    setRotatingKey(type);
    try {
      const res = await fetch(`/api/projects/${projectId}/keys/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (data.success) {
        setRotatedKey({ type, key: data.data.key });
        fetchProjectData();
      } else {
        alert(data.error?.message || t('apiCredentials.failedRotate'));
      }
    } catch {
      alert(t('apiCredentials.failedRotate'));
    } finally {
      setRotatingKey(null);
    }
  };

  const handleDeleteProject = async () => {
    if (deleteConfirmName !== project?.name) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project?.slug || projectId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/team/${teamSlug}`);
      } else {
        alert(data.error?.message || t('dangerZone.failedDelete'));
      }
    } catch {
      alert(t('dangerZone.failedDelete'));
    } finally {
      setDeleting(false);
    }
  };

  const secretKey = apiKeys.find((k) => k.type === 'secret');
  const publishableKey = apiKeys.find((k) => k.type === 'publishable');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-secondary rounded w-1/3 mb-2" />
          <div className="h-4 bg-secondary rounded w-1/4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-secondary rounded w-1/2 mb-3" />
              <div className="h-8 bg-secondary rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{project?.name || t('overview.title')}</h1>
        <p className="text-muted-foreground">{t('overview.projectIdPrefix')}{projectId}</p>
      </div>

      {/* Project Info Card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{t('overview.projectInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('overview.name')}</p>
            <p className="font-medium text-foreground">{project?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('overview.slug')}</p>
            <p className="font-mono text-sm text-foreground">{project?.slug}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('overview.status')}</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
              project?.status === 'active'
                ? 'bg-green-500/10 text-green-500'
                : 'bg-gray-500/10 text-gray-500'
            }`}>
              {project?.status || tc('status.unknown')}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('overview.created')}</p>
            <p className="text-sm text-foreground">
              {project?.created_at ? new Date(project.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              }) : '-'}
            </p>
          </div>
          {project?.description && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">{t('overview.description')}</p>
              <p className="text-sm text-foreground">{project.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: t('stats.connectedWallets'), value: stats.totalWallets, icon: '👛', desc: t('stats.connectedWalletsDesc') },
          { title: t('stats.transactions'), value: stats.totalTransactions, icon: '💸', desc: t('stats.transactionsDesc') },
          { title: t('stats.activeContracts'), value: stats.activeContracts, icon: '📜', desc: t('stats.activeContractsDesc') },
          { title: t('stats.apiCallsToday'), value: stats.apiCallsToday, icon: '🔗', desc: t('stats.apiCallsTodayDesc') },
        ].map((stat) => (
          <div key={stat.title} className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-2">{t('quickActions.connect')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('quickActions.connectDesc')}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>{t('quickActions.inAppWallets', { count: stats.totalWallets })}</div>
            <div>{t('quickActions.ecosystemWallets')}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-2">{t('quickActions.contracts')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('quickActions.contractsDesc')}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>{t('quickActions.deployed', { count: stats.activeContracts })}</div>
            <div>{t('quickActions.publishedZero')}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-2">{t('quickActions.engine')}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t('quickActions.engineDesc')}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div>{t('quickActions.backendWallets')}</div>
            <div>{t('quickActions.pendingTxs')}</div>
          </div>
        </div>
      </div>

      {/* API Credentials */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">{t('apiCredentials.title')}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('apiCredentials.description')}
        </p>
        <div className="space-y-4">
          {/* Client ID */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-secondary/30 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">{t('apiCredentials.clientId')}</p>
              <p className="font-mono text-sm text-muted-foreground truncate">
                {project?.client_id || publishableKey?.prefix || 'one_pk_...'}
                {!(project?.client_id) && '••••••••'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(project?.client_id || '', 'client_id')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                {copiedField === 'client_id' ? tc('actions.copied') : tc('actions.copy')}
              </button>
              <button
                onClick={() => handleRotateKey('publishable')}
                disabled={rotatingKey === 'publishable'}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {rotatingKey === 'publishable' ? tc('status.rotating') : tc('actions.rotate')}
              </button>
            </div>
          </div>

          {/* Secret Key */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-secondary/30 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">{t('apiCredentials.secretKey')}</p>
              <p className="font-mono text-sm text-muted-foreground">
                {secretKey?.prefix || 'one_sk_'}••••••••
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleRotateKey('secret')}
                disabled={rotatingKey === 'secret'}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {rotatingKey === 'secret' ? tc('status.rotating') : tc('actions.rotate')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rotated Key Modal */}
      {rotatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('apiCredentials.keyRotated')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('apiCredentials.keyRotatedDesc', { keyType: rotatedKey.type })}
                </p>
              </div>
            </div>
            <div className="bg-[#0d1117] rounded-xl p-4 mb-4">
              <p className="font-mono text-sm text-[#e6edf3] break-all">{rotatedKey.key}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => copyToClipboard(rotatedKey.key, 'rotated')}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                {copiedField === 'rotated' ? tc('actions.copied') : t('apiCredentials.copyKey')}
              </button>
              <button
                onClick={() => setRotatedKey(null)}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                {tc('actions.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Integration */}
      <CodeBlock
        title={t('gettingStarted.title')}
        tabs={[
          {
            label: t('gettingStarted.javascript'),
            language: 'javascript',
            code: `import { OneWallet } from '@onewallet/sdk';

// Initialize the client
const client = new OneWallet({
  clientId: '${project?.client_id || 'YOUR_CLIENT_ID'}'
});

// Connect a wallet
const wallet = await client.connect();
console.log('Connected:', wallet.address);

// Read contract
const balance = await client.contracts.read({
  address: '0x...',
  method: 'balanceOf',
  args: [wallet.address]
});`,
          },
          {
            label: t('gettingStarted.curl'),
            language: 'bash',
            code: `# Get project info
curl https://api.onewallet.com/v1/project \\
  -H "X-API-Key: YOUR_CLIENT_ID"

# List project wallets
curl https://api.onewallet.com/v1/wallets \\
  -H "X-API-Key: YOUR_CLIENT_ID"

# Server-side: create transaction
curl -X POST https://api.onewallet.com/v1/transactions \\
  -H "X-API-Key: YOUR_CLIENT_ID" \\
  -H "X-Secret-Key: YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"0x...","value":"1000000","chain":137}'`,
          },
        ]}
      />

      {/* Danger Zone */}
      <div className="border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-red-500 mb-1">{t('dangerZone.title')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('dangerZone.description')}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-500/10 rounded-xl">
          <div>
            <p className="font-medium text-foreground">{t('dangerZone.deleteTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {t('dangerZone.deleteWarning')}
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors shrink-0"
          >
            {t('dangerZone.deleteProject')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{t('dangerZone.deleteProject')}</h3>
                <p className="text-sm text-muted-foreground">{t('dangerZone.cannotBeUndone')}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {t.rich('dangerZone.confirmType', { name: project?.name })}
            </p>

            <input
              type="text"
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              placeholder={project?.name || ''}
              className="w-full px-4 py-2.5 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 mb-4"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmName('');
                }}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                {tc('actions.cancel')}
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={deleteConfirmName !== project?.name || deleting}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? tc('status.deleting') : t('dangerZone.deleteProject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
