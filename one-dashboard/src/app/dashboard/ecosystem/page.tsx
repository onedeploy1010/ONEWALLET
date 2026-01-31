'use client';

import { useEffect, useState } from 'react';

interface EcosystemApp {
  id: string;
  name: string;
  slug: string;
  type: 'wallet' | 'engine' | 'dashboard' | 'external';
  status: 'active' | 'inactive' | 'maintenance';
  api_endpoint: string | null;
  users_count: number;
  last_sync_at: string | null;
  created_at: string;
}

interface SyncStatus {
  app_id: string;
  last_sync: string | null;
  synced_users: number;
  pending_users: number;
  status: 'synced' | 'syncing' | 'pending' | 'error';
}

export default function EcosystemPage() {
  const [apps, setApps] = useState<EcosystemApp[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, SyncStatus>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApp, setNewApp] = useState({
    name: '',
    type: 'external' as const,
    api_endpoint: '',
  });

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/ecosystem/apps');
      const data = await res.json();
      if (data.success) {
        setApps(data.data || []);
        // Build sync status map
        const status: Record<string, SyncStatus> = {};
        for (const app of data.data || []) {
          status[app.id] = {
            app_id: app.id,
            last_sync: app.last_sync_at,
            synced_users: app.users_count,
            pending_users: 0,
            status: app.last_sync_at ? 'synced' : 'pending',
          };
        }
        setSyncStatus(status);
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncApp = async (appId: string) => {
    setSyncStatus((prev) => ({
      ...prev,
      [appId]: { ...prev[appId], status: 'syncing' },
    }));

    try {
      const res = await fetch(`/api/ecosystem/apps/${appId}/sync`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        fetchApps();
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus((prev) => ({
        ...prev,
        [appId]: { ...prev[appId], status: 'error' },
      }));
    }
  };

  const addApp = async () => {
    try {
      const res = await fetch('/api/ecosystem/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewApp({ name: '', type: 'external', api_endpoint: '' });
        fetchApps();
      }
    } catch (error) {
      console.error('Failed to add app:', error);
    }
  };

  const typeColors = {
    wallet: 'bg-green-500/10 text-green-500',
    engine: 'bg-blue-500/10 text-blue-500',
    dashboard: 'bg-purple-500/10 text-purple-500',
    external: 'bg-orange-500/10 text-orange-500',
  };

  const statusColors = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    maintenance: 'bg-yellow-500',
  };

  const syncStatusColors = {
    synced: 'text-green-500',
    syncing: 'text-blue-500',
    pending: 'text-gray-500',
    error: 'text-red-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ecosystem</h1>
          <p className="text-muted-foreground">
            Manage connected applications and data synchronization
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Add Application
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Apps</p>
          <p className="text-2xl font-bold">{apps.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold">{apps.filter((a) => a.status === 'active').length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold">
            {apps.reduce((sum, a) => sum + a.users_count, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending Syncs</p>
          <p className="text-2xl font-bold">
            {Object.values(syncStatus).filter((s) => s.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Apps Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
              <div className="h-5 bg-secondary rounded w-1/2 mb-4" />
              <div className="h-4 bg-secondary rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-card border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">No applications connected yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Add First Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map((app) => (
            <div key={app.id} className="bg-card border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{app.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${typeColors[app.type]}`}>
                      {app.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{app.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${statusColors[app.status]}`} />
                  <span className="text-sm capitalize">{app.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Users</p>
                  <p className="font-medium">{app.users_count.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-medium">
                    {app.last_sync_at
                      ? new Date(app.last_sync_at).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {app.api_endpoint && (
                <p className="text-xs text-muted-foreground font-mono mb-4 truncate">
                  {app.api_endpoint}
                </p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <span className={`text-sm ${syncStatusColors[syncStatus[app.id]?.status || 'pending']}`}>
                  {syncStatus[app.id]?.status === 'syncing' && (
                    <span className="inline-block animate-spin mr-1">⟳</span>
                  )}
                  {syncStatus[app.id]?.status || 'Pending'}
                </span>
                <button
                  onClick={() => syncApp(app.id)}
                  disabled={syncStatus[app.id]?.status === 'syncing'}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Sync Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add App Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Application</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="My Application"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={newApp.type}
                  onChange={(e) => setNewApp({ ...newApp, type: e.target.value as typeof newApp.type })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="wallet">Wallet</option>
                  <option value="engine">Engine</option>
                  <option value="dashboard">Dashboard</option>
                  <option value="external">External</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">API Endpoint (optional)</label>
                <input
                  type="url"
                  value={newApp.api_endpoint}
                  onChange={(e) => setNewApp({ ...newApp, api_endpoint: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="https://api.example.com"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={addApp}
                disabled={!newApp.name}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                Add Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
