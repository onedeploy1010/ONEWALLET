'use client';

import { useEffect, useState } from 'react';

interface UserSettings {
  id: string;
  display_name: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  two_factor_enabled: boolean;
  session_timeout: number;
  ip_whitelist: string[];
  rate_limit: number;
  webhook_url: string;
  log_requests: boolean;
  notifications: {
    new_users: { email: boolean; webhook: boolean };
    transactions: { email: boolean; webhook: boolean };
    api_errors: { email: boolean; webhook: boolean };
    migrations: { email: boolean; webhook: boolean };
    security: { email: boolean; webhook: boolean };
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  id: '',
  display_name: 'ONE Dashboard',
  timezone: 'UTC',
  theme: 'dark',
  language: 'en',
  two_factor_enabled: false,
  session_timeout: 30,
  ip_whitelist: [],
  rate_limit: 100,
  webhook_url: '',
  log_requests: true,
  notifications: {
    new_users: { email: true, webhook: false },
    transactions: { email: true, webhook: false },
    api_errors: { email: true, webhook: true },
    migrations: { email: true, webhook: false },
    security: { email: true, webhook: true },
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'api' | 'notifications'>('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showIPModal, setShowIPModal] = useState(false);
  const [newIP, setNewIP] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAQR, setTwoFAQR] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/user/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data });
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      const res = await fetch('/api/user/2fa/setup', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setTwoFASecret(data.data.secret);
        setTwoFAQR(data.data.qr_code);
        setShow2FAModal(true);
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to setup 2FA' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to setup 2FA' });
    }
  };

  const handleVerify2FA = async () => {
    try {
      const res = await fetch('/api/user/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFACode }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings({ ...settings, two_factor_enabled: true });
        setShow2FAModal(false);
        setTwoFACode('');
        setMessage({ type: 'success', text: '2FA enabled successfully' });
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Invalid code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to verify 2FA' });
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return;

    try {
      const res = await fetch('/api/user/2fa/disable', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSettings({ ...settings, two_factor_enabled: false });
        setMessage({ type: 'success', text: '2FA disabled' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disable 2FA' });
    }
  };

  const handleAddIP = () => {
    if (!newIP.trim()) return;
    // Basic IP validation
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$|^(?:[a-fA-F0-9:]+)$/;
    if (!ipRegex.test(newIP.trim())) {
      setMessage({ type: 'error', text: 'Invalid IP address format' });
      return;
    }
    if (!settings.ip_whitelist.includes(newIP.trim())) {
      setSettings({
        ...settings,
        ip_whitelist: [...settings.ip_whitelist, newIP.trim()],
      });
    }
    setNewIP('');
  };

  const handleRemoveIP = (ip: string) => {
    setSettings({
      ...settings,
      ip_whitelist: settings.ip_whitelist.filter((i) => i !== ip),
    });
  };

  const updateNotification = (key: keyof UserSettings['notifications'], channel: 'email' | 'webhook', value: boolean) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: {
          ...settings.notifications[key],
          [channel]: value,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-3 border-[#188775] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your dashboard preferences and configuration
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

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 space-y-1">
          {[
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'api', label: 'API Settings', icon: '🔗' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#188775] to-[#14a085] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-card border border-border rounded-2xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">General Settings</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={settings.display_name}
                      onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                      className="w-full max-w-md px-4 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full max-w-md px-4 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Paris">Europe/Paris (CET)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Theme
                    </label>
                    <div className="flex gap-3">
                      {(['light', 'dark', 'system'] as const).map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setSettings({ ...settings, theme })}
                          className={`px-4 py-2 rounded-xl border capitalize transition-all ${
                            settings.theme === theme
                              ? 'border-[#188775] bg-[#188775]/10 text-[#188775]'
                              : 'border-border text-muted-foreground hover:border-[#188775]/50'
                          }`}
                        >
                          {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'} {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full max-w-md px-4 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                    >
                      <option value="en">English</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                      <option value="ko">한국어</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        {settings.two_factor_enabled
                          ? 'Your account is protected with 2FA'
                          : 'Add an extra layer of security to your account'}
                      </p>
                    </div>
                    {settings.two_factor_enabled ? (
                      <button
                        onClick={handleDisable2FA}
                        className="px-4 py-2 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500/10"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        onClick={handleEnable2FA}
                        className="px-4 py-2 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl hover:opacity-90"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">Session Timeout</p>
                      <p className="text-sm text-muted-foreground">
                        Automatically log out after inactivity
                      </p>
                    </div>
                    <select
                      value={settings.session_timeout}
                      onChange={(e) => setSettings({ ...settings, session_timeout: Number(e.target.value) })}
                      className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={240}>4 hours</option>
                      <option value={0}>Never</option>
                    </select>
                  </div>
                  <div className="p-4 border border-border rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-foreground">IP Whitelist</p>
                        <p className="text-sm text-muted-foreground">
                          Restrict access to specific IP addresses
                        </p>
                      </div>
                      <button
                        onClick={() => setShowIPModal(true)}
                        className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary"
                      >
                        Add IP
                      </button>
                    </div>
                    {settings.ip_whitelist.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {settings.ip_whitelist.map((ip) => (
                          <span
                            key={ip}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg text-sm font-mono"
                          >
                            {ip}
                            <button
                              onClick={() => handleRemoveIP(ip)}
                              className="text-muted-foreground hover:text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">API Configuration</h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Rate Limit (requests per minute)
                    </label>
                    <input
                      type="number"
                      value={settings.rate_limit}
                      onChange={(e) => setSettings({ ...settings, rate_limit: Number(e.target.value) })}
                      min={10}
                      max={1000}
                      className="w-full max-w-md px-4 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Global Webhook URL
                    </label>
                    <input
                      type="url"
                      value={settings.webhook_url}
                      onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                      placeholder="https://your-webhook.com/endpoint"
                      className="w-full max-w-md px-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20 focus:border-[#188775]"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Receive real-time notifications for important events
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSettings({ ...settings, log_requests: !settings.log_requests })}
                      className={`w-11 h-6 rounded-full transition-colors ${
                        settings.log_requests ? 'bg-[#188775]' : 'bg-secondary'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                        settings.log_requests ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <label className="text-sm text-foreground">
                      Log all API requests
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  {[
                    { id: 'new_users', label: 'New user registrations', icon: '👤' },
                    { id: 'transactions', label: 'Large transactions', icon: '💰' },
                    { id: 'api_errors', label: 'API errors', icon: '⚠️' },
                    { id: 'migrations', label: 'Migration completions', icon: '📦' },
                    { id: 'security', label: 'Security alerts', icon: '🔐' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-border rounded-xl"
                    >
                      <span className="text-sm text-foreground flex items-center gap-2">
                        <span>{item.icon}</span>
                        {item.label}
                      </span>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[item.id as keyof UserSettings['notifications']].email}
                            onChange={(e) => updateNotification(item.id as keyof UserSettings['notifications'], 'email', e.target.checked)}
                            className="w-4 h-4 rounded border-border text-[#188775] focus:ring-[#188775]/20"
                          />
                          <span className="text-muted-foreground">Email</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications[item.id as keyof UserSettings['notifications']].webhook}
                            onChange={(e) => updateNotification(item.id as keyof UserSettings['notifications'], 'webhook', e.target.checked)}
                            className="w-4 h-4 rounded border-border text-[#188775] focus:ring-[#188775]/20"
                          />
                          <span className="text-muted-foreground">Webhook</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* IP Whitelist Modal */}
      {showIPModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowIPModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Add IP Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">IP Address or CIDR</label>
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="192.168.1.1 or 10.0.0.0/24"
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#188775]/20"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowIPModal(false)}
                  className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleAddIP();
                    setShowIPModal(false);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl hover:opacity-90"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShow2FAModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full m-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-foreground mb-4">Set Up Two-Factor Authentication</h3>
            <div className="space-y-4">
              <div className="text-center">
                {twoFAQR && (
                  <img src={twoFAQR} alt="2FA QR Code" className="w-48 h-48 mx-auto bg-white p-2 rounded-xl" />
                )}
                <p className="text-sm text-muted-foreground mt-3">
                  Scan this QR code with your authenticator app
                </p>
              </div>
              {twoFASecret && (
                <div className="p-3 bg-secondary rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1">Manual entry code:</p>
                  <p className="font-mono text-sm text-foreground break-all">{twoFASecret}</p>
                </div>
              )}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Enter verification code</label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#188775]/20"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShow2FAModal(false);
                    setTwoFACode('');
                  }}
                  className="px-4 py-2 border border-border rounded-xl text-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify2FA}
                  disabled={twoFACode.length !== 6}
                  className="px-4 py-2 bg-gradient-to-r from-[#188775] to-[#14a085] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  Verify & Enable
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
