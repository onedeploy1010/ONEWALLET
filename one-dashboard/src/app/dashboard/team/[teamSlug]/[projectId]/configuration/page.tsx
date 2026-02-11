'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  type: 'publishable' | 'secret';
  domains: string[];
  last_used_at: string | null;
  created_at: string;
  requests_count?: number;
}

interface ProjectSettings {
  rate_limit: number;
  webhook_url: string;
  log_requests: boolean;
}

const DEFAULT_SETTINGS: ProjectSettings = {
  rate_limit: 100,
  webhook_url: '',
  log_requests: true,
};

export default function ConfigurationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations('settings');
  const tc = useTranslations('common');
  const projectId = params.projectId as string;
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'api-keys';

  const [activeTab, setActiveTab] = useState<'api-keys' | 'settings'>(initialTab);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Key modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyType, setNewKeyType] = useState<'publishable' | 'secret'>('publishable');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
    fetchSettings();
  }, [projectId]);

  const fetchKeys = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/keys`);
      const data = await res.json();
      if (data.success) {
        setKeys(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const createKey = async () => {
    if (!newKeyName) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName, type: newKeyType }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedKey(data.data.apiKey);
        fetchKeys();
      }
    } catch (error) {
      console.error('Failed to create key:', error);
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm(t('apiKeys.revokeConfirm'))) return;
    try {
      await fetch(`/api/projects/${projectId}/keys/${keyId}`, { method: 'DELETE' });
      fetchKeys();
    } catch (error) {
      console.error('Failed to revoke key:', error);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setCreatedKey(null);
    setNewKeyName('');
    setNewKeyType('publishable');
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: t('projectSettings.savedSuccess') });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error?.message || t('projectSettings.savedError') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('projectSettings.savedError') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('configuration.title')}</h1>
        <p className="text-muted-foreground">
          {t('configuration.subtitle')}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-500'
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'api-keys'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {t('configuration.apiKeysTab')}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('configuration.settingsTab')}
          </span>
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          {/* Key Types Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-12 -mt-12" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t('apiKeys.clientId')}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('apiKeys.clientIdDesc')}
                  </p>
                  <code className="inline-block px-3 py-1.5 bg-blue-500/10 rounded-lg text-sm font-mono text-blue-500">
                    one_pk_...
                  </code>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-12 -mt-12" />
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t('apiKeys.secretKey')}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('apiKeys.secretKeyDesc')}
                  </p>
                  <code className="inline-block px-3 py-1.5 bg-purple-500/10 rounded-lg text-sm font-mono text-purple-500">
                    one_sk_...
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Create Key Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {t('apiKeys.createKey')}
            </button>
          </div>

          {/* Keys List */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{t('apiKeys.yourKeys')}</h3>
            </div>
            {loading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : keys.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{t('apiKeys.noKeys')}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t('apiKeys.noKeysHint')}</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-lg text-sm font-medium hover:opacity-90"
                >
                  {t('apiKeys.createApiKey')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {keys.map((key) => (
                  <div key={key.id} className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        key.type === 'publishable' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                      }`}>
                        {key.type === 'publishable' ? (
                          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{key.name}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            key.type === 'publishable'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-purple-500/10 text-purple-500'
                          }`}>
                            {key.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm text-muted-foreground font-mono">{key.prefix}...</code>
                          <button
                            onClick={() => copyKey(key.prefix)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedKey === key.prefix ? (
                              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">
                          {key.last_used_at
                            ? t('apiKeys.lastUsed', { time: new Date(key.last_used_at).toLocaleDateString() })
                            : t('apiKeys.neverUsed')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('apiKeys.created', { time: new Date(key.created_at).toLocaleDateString() })}
                        </p>
                      </div>
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        {tc('actions.revoke')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">{t('projectSettings.title')}</h3>
          <div className="space-y-6 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('projectSettings.rateLimitLabel')}
              </label>
              <input
                type="number"
                value={settings.rate_limit}
                onChange={(e) => setSettings({ ...settings, rate_limit: Number(e.target.value) })}
                min={10}
                max={1000}
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {t('projectSettings.rateLimitHint')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('projectSettings.webhookLabel')}
              </label>
              <input
                type="url"
                value={settings.webhook_url}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                placeholder={t('projectSettings.webhookPlaceholder')}
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                {t('projectSettings.webhookHint')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSettings({ ...settings, log_requests: !settings.log_requests })}
                className={`w-11 h-6 rounded-full transition-colors ${
                  settings.log_requests ? 'bg-[#2563EB]' : 'bg-secondary'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                  settings.log_requests ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
              <label className="text-sm text-foreground">
                {t('projectSettings.logRequests')}
              </label>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? tc('status.saving') : t('projectSettings.saveSettings')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {createdKey ? (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{t('apiKeys.keyCreated')}</h3>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-yellow-600">{t('apiKeys.copyNow')}</p>
                      <p className="text-xs text-yellow-600/80">{t('apiKeys.copyNowDesc')}</p>
                    </div>
                  </div>
                </div>
                <div className="relative mb-6">
                  <input
                    type="text"
                    value={createdKey}
                    readOnly
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl font-mono text-sm text-foreground pr-24"
                  />
                  <button
                    onClick={() => copyKey(createdKey)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      copiedKey === createdKey
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white'
                    }`}
                  >
                    {copiedKey === createdKey ? tc('actions.copied') : tc('actions.copy')}
                  </button>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {tc('actions.done')}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">{t('apiKeys.createApiKey')}</h3>
                  <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('apiKeys.keyName')}</label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                      placeholder={t('apiKeys.keyNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('apiKeys.keyType')}</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewKeyType('publishable')}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          newKeyType === 'publishable'
                            ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20'
                            : 'border-border hover:border-blue-500/50'
                        }`}
                      >
                        <svg className="w-6 h-6 text-blue-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <p className="font-medium text-foreground text-sm">{t('apiKeys.publishable')}</p>
                        <p className="text-xs text-muted-foreground">{t('apiKeys.publishableDesc')}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewKeyType('secret')}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          newKeyType === 'secret'
                            ? 'border-purple-500 bg-purple-500/5 ring-2 ring-purple-500/20'
                            : 'border-border hover:border-purple-500/50'
                        }`}
                      >
                        <svg className="w-6 h-6 text-purple-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="font-medium text-foreground text-sm">{t('apiKeys.secret')}</p>
                        <p className="text-xs text-muted-foreground">{t('apiKeys.secretDesc')}</p>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 border border-border rounded-xl text-foreground hover:bg-secondary transition-colors"
                  >
                    {tc('actions.cancel')}
                  </button>
                  <button
                    onClick={createKey}
                    disabled={!newKeyName || creating}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {tc('status.creating')}
                      </span>
                    ) : (
                      t('apiKeys.createKey')
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
