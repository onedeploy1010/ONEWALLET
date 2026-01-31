'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  is_active: boolean;
  last_triggered?: string;
  success_count: number;
  failure_count: number;
  created_at: string;
}

interface WebhookLog {
  id: string;
  webhook_id: string;
  event: string;
  status_code: number;
  response_time_ms: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

const EVENT_TYPES = [
  { id: 'transaction.submitted', label: 'Transaction Submitted', description: 'When a transaction is submitted to the network' },
  { id: 'transaction.mined', label: 'Transaction Mined', description: 'When a transaction is confirmed on-chain' },
  { id: 'transaction.failed', label: 'Transaction Failed', description: 'When a transaction fails or reverts' },
  { id: 'wallet.created', label: 'Wallet Created', description: 'When a new backend wallet is created' },
  { id: 'wallet.balance.low', label: 'Low Balance Alert', description: 'When wallet balance drops below threshold' },
  { id: 'contract.deployed', label: 'Contract Deployed', description: 'When a contract deployment completes' },
];

export default function WebhooksPage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const projectId = params.projectId as string;

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/engine/webhooks?project_id=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchWebhookLogs = async (webhookId: string) => {
    try {
      const res = await fetch(`/api/engine/webhooks/${webhookId}/logs?project_id=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setWebhookLogs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  useEffect(() => {
    if (selectedWebhook) {
      fetchWebhookLogs(selectedWebhook.id);
    }
  }, [selectedWebhook]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setFormError('Webhook name is required');
      return;
    }
    if (!formData.url.trim()) {
      setFormError('Webhook URL is required');
      return;
    }
    if (formData.events.length === 0) {
      setFormError('Select at least one event');
      return;
    }

    setActionLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/engine/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          name: formData.name,
          url: formData.url,
          events: formData.events,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowCreate(false);
        setFormData({ name: '', url: '', events: [] });
        fetchWebhooks();
        if (data.data?.secret) {
          setShowSecret(data.data.secret);
        }
      } else {
        setFormError(data.error?.message || 'Failed to create webhook');
      }
    } catch (error) {
      setFormError('Failed to create webhook');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (webhook: Webhook) => {
    try {
      const res = await fetch(`/api/engine/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          is_active: !webhook.is_active,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const res = await fetch(`/api/engine/webhooks/${webhookId}?project_id=${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchWebhooks();
        if (selectedWebhook?.id === webhookId) {
          setSelectedWebhook(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleTest = async (webhook: Webhook) => {
    try {
      const res = await fetch(`/api/engine/webhooks/${webhook.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Test webhook sent successfully!');
        if (selectedWebhook?.id === webhook.id) {
          fetchWebhookLogs(webhook.id);
        }
      } else {
        alert(`Test failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to send test webhook');
    }
  };

  const toggleEvent = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

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
            <span>Webhooks</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
          <p className="text-muted-foreground">
            Configure webhook endpoints for transaction notifications
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Webhook
        </button>
      </div>

      {/* Secret Display Modal */}
      {showSecret && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full m-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Webhook Created!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save your webhook secret - it won't be shown again.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-xs text-muted-foreground mb-2">Webhook Secret</label>
              <div className="p-3 bg-secondary rounded-lg font-mono text-sm text-foreground break-all">
                {showSecret}
              </div>
            </div>
            <button
              onClick={() => setShowSecret(null)}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90"
            >
              I've saved the secret
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Webhooks List */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Your Webhooks</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-[#188775] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔔</span>
                </div>
                <p className="text-sm text-muted-foreground">No webhooks configured</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    onClick={() => setSelectedWebhook(webhook)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedWebhook?.id === webhook.id ? 'bg-[#188775]/5' : 'hover:bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${webhook.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="font-medium text-foreground text-sm">{webhook.name}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(webhook);
                        }}
                        className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                          webhook.is_active
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-500/10 text-gray-500'
                        }`}
                      >
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">{webhook.url}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="text-green-500">{webhook.success_count} success</span>
                      <span className="text-red-500">{webhook.failure_count} failed</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Webhook Details / Create Form */}
        <div className="lg:col-span-2">
          {showCreate ? (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Create Webhook</h3>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-secondary rounded-lg">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Webhook Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Webhook"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Endpoint URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://your-server.com/webhook"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Events <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {EVENT_TYPES.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => toggleEvent(event.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formData.events.includes(event.id)
                            ? 'border-[#188775] bg-[#188775]/5 ring-2 ring-[#188775]/20'
                            : 'border-border hover:border-[#188775]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            formData.events.includes(event.id) ? 'border-[#188775] bg-[#188775]' : 'border-border'
                          }`}>
                            {formData.events.includes(event.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="font-medium text-foreground text-sm">{event.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">{event.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {formError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-5 py-2.5 border border-border rounded-xl text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Create Webhook
                  </button>
                </div>
              </div>
            </div>
          ) : selectedWebhook ? (
            <div className="space-y-6">
              {/* Webhook Info */}
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedWebhook.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{selectedWebhook.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(selectedWebhook)}
                      className="px-3 py-1.5 border border-border rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      Send Test
                    </button>
                    <button
                      onClick={() => handleDelete(selectedWebhook.id)}
                      className="px-3 py-1.5 border border-red-500/30 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-secondary/30 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <p className={`font-medium ${selectedWebhook.is_active ? 'text-green-500' : 'text-gray-500'}`}>
                      {selectedWebhook.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Events</p>
                    <p className="font-medium text-foreground">{selectedWebhook.events.length}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Success</p>
                    <p className="font-medium text-green-500">{selectedWebhook.success_count}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Failed</p>
                    <p className="font-medium text-red-500">{selectedWebhook.failure_count}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Subscribed Events</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedWebhook.events.map((event) => (
                      <span
                        key={event}
                        className="px-3 py-1.5 bg-[#188775]/10 text-[#188775] rounded-lg text-xs font-medium"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Logs */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Recent Deliveries</h3>
                </div>
                {webhookLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">No deliveries yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            log.success ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}>
                            {log.success ? (
                              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{log.event}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            log.status_code < 300 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {log.status_code}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{log.response_time_ms}ms</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔔</span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">Select a Webhook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a webhook from the list or create a new one
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90"
              >
                Create Webhook
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
