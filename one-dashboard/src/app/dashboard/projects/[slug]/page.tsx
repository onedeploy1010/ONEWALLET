'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'inactive' | 'pending';
  api_key_prefix: string;
  settings: Record<string, unknown>;
  users_count: number;
  api_calls_today: number;
  created_at: string;
}

interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

const tabKeys: Record<string, string> = {
  'overview': 'detail.tabOverview',
  'api-keys': 'detail.tabApiKeys',
  'settings': 'detail.tabSettings',
};

export default function ProjectDetailPage() {
  const t = useTranslations('projects');
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'settings'>('overview');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [params.slug]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${params.slug}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.data.project);
        setApiKeys(data.data.apiKeys || []);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewKey = async () => {
    try {
      const res = await fetch(`/api/projects/${params.slug}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName || 'Default Key' }),
      });
      const data = await res.json();
      if (data.success) {
        setNewApiKey(data.data.apiKey);
        fetchProject();
      }
    } catch (error) {
      console.error('Failed to generate key:', error);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm(t('detail.revokeConfirm'))) {
      return;
    }

    try {
      await fetch(`/api/projects/${params.slug}/keys/${keyId}`, {
        method: 'DELETE',
      });
      fetchProject();
    } catch (error) {
      console.error('Failed to revoke key:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-secondary rounded w-1/4" />
        <div className="h-4 bg-secondary rounded w-1/2" />
        <div className="h-64 bg-secondary rounded" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">{t('detail.notFound')}</p>
        <Link href="/dashboard/projects" className="text-primary hover:underline">
          {t('detail.backToProjects')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard/projects"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {t('detail.breadcrumbProjects')}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            project.status === 'active'
              ? 'bg-green-500/10 text-green-500'
              : 'bg-gray-500/10 text-gray-500'
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-6">
          {(['overview', 'api-keys', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(tabKeys[tab])}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">{t('detail.projectId')}</p>
            <p className="font-mono text-sm">{project.id}</p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">{t('detail.users')}</p>
            <p className="text-2xl font-bold">{project.users_count.toLocaleString()}</p>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">{t('detail.apiCallsToday')}</p>
            <p className="text-2xl font-bold">{project.api_calls_today.toLocaleString()}</p>
          </div>
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('detail.manageApiKeys')}
            </p>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              {t('detail.generateNewKey')}
            </button>
          </div>

          {/* New API Key Modal */}
          {showNewKeyModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card border rounded-lg p-6 w-full max-w-md">
                {newApiKey ? (
                  <>
                    <h3 className="text-lg font-semibold mb-4">{t('detail.newKeyGenerated')}</h3>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 mb-4">
                      <p className="text-sm text-yellow-600">
                        {t('detail.copyKeyWarning')}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={newApiKey}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md bg-secondary font-mono text-sm mb-4"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newApiKey);
                        setShowNewKeyModal(false);
                        setNewApiKey(null);
                        setNewKeyName('');
                      }}
                      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                      {t('detail.copyAndClose')}
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-4">{t('detail.generateNewApiKey')}</h3>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder={t('detail.keyNamePlaceholder')}
                      className="w-full px-3 py-2 border rounded-md bg-background mb-4"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowNewKeyModal(false)}
                        className="flex-1 px-4 py-2 border rounded-md hover:bg-secondary"
                      >
                        {t('detail.cancel')}
                      </button>
                      <button
                        onClick={generateNewKey}
                        className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md"
                      >
                        {t('detail.generate')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="bg-card border rounded-lg divide-y">
            {apiKeys.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                {t('detail.noApiKeys')}
              </div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{key.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {key.prefix}...
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">
                      {key.last_used_at
                        ? t('detail.lastUsed', { date: new Date(key.last_used_at).toLocaleDateString() })
                        : t('detail.neverUsed')}
                    </span>
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      {t('detail.revoke')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{t('detail.projectSettings')}</h3>
          <p className="text-muted-foreground">{t('detail.settingsComingSoon')}</p>
        </div>
      )}
    </div>
  );
}
