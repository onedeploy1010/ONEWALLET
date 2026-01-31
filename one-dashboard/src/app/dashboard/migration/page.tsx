'use client';

import { useEffect, useState } from 'react';

interface MigrationJob {
  id: string;
  source: 'one_wallet' | 'one_engine';
  target: 'one_wallet' | 'one_engine';
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_records: number;
  migrated_records: number;
  failed_records: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

interface ConnectionStatus {
  one_wallet: {
    connected: boolean;
    latency: number | null;
    version: string | null;
  };
  one_engine: {
    connected: boolean;
    latency: number | null;
    version: string | null;
  };
}

export default function MigrationPage() {
  const [jobs, setJobs] = useState<MigrationJob[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJob, setNewJob] = useState<{
    source: 'one_wallet' | 'one_engine';
    target: 'one_wallet' | 'one_engine';
    type: 'users' | 'transactions' | 'all';
    dryRun: boolean;
  }>({
    source: 'one_wallet',
    target: 'one_engine',
    type: 'users',
    dryRun: true,
  });
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, statusRes] = await Promise.all([
        fetch('/api/migration/jobs'),
        fetch('/api/migration/status'),
      ]);

      const [jobsData, statusData] = await Promise.all([
        jobsRes.json(),
        statusRes.json(),
      ]);

      if (jobsData.success) setJobs(jobsData.data || []);
      if (statusData.success) setConnectionStatus(statusData.data);
    } catch (error) {
      console.error('Failed to fetch migration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMigration = async () => {
    setMigrating(true);
    try {
      const res = await fetch('/api/migration/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      const data = await res.json();
      if (data.success) {
        setShowNewJobModal(false);
        fetchData();
      } else {
        alert(data.error?.message || 'Failed to start migration');
      }
    } catch (error) {
      console.error('Failed to start migration:', error);
    } finally {
      setMigrating(false);
    }
  };

  const testConnection = async (target: 'one_wallet' | 'one_engine') => {
    try {
      const res = await fetch(`/api/migration/test-connection?target=${target}`);
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const getStatusColor = (status: MigrationJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'running':
        return 'bg-blue-500/10 text-blue-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Migration</h1>
          <p className="text-muted-foreground">
            Migrate data between One Wallet and One Engine using IPv4 direct connection
          </p>
        </div>
        <button
          onClick={() => setShowNewJobModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          New Migration
        </button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">One Wallet Database</h3>
            <button
              onClick={() => testConnection('one_wallet')}
              className="text-sm text-primary hover:underline"
            >
              Test Connection
            </button>
          </div>
          {connectionStatus?.one_wallet ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.one_wallet.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">
                  {connectionStatus.one_wallet.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {connectionStatus.one_wallet.latency && (
                <p className="text-sm text-muted-foreground">
                  Latency: {connectionStatus.one_wallet.latency}ms
                </p>
              )}
              {connectionStatus.one_wallet.version && (
                <p className="text-sm text-muted-foreground">
                  PostgreSQL: {connectionStatus.one_wallet.version}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Not configured</p>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">One Engine Database</h3>
            <button
              onClick={() => testConnection('one_engine')}
              className="text-sm text-primary hover:underline"
            >
              Test Connection
            </button>
          </div>
          {connectionStatus?.one_engine ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.one_engine.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">
                  {connectionStatus.one_engine.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              {connectionStatus.one_engine.latency && (
                <p className="text-sm text-muted-foreground">
                  Latency: {connectionStatus.one_engine.latency}ms
                </p>
              )}
              {connectionStatus.one_engine.version && (
                <p className="text-sm text-muted-foreground">
                  PostgreSQL: {connectionStatus.one_engine.version}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Not configured</p>
          )}
        </div>
      </div>

      {/* Migration Jobs */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Migration History</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No migration jobs yet
          </div>
        ) : (
          <div className="divide-y">
            {jobs.map((job) => (
              <div key={job.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {job.source === 'one_wallet' ? 'One Wallet' : 'One Engine'}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">
                      {job.target === 'one_wallet' ? 'One Wallet' : 'One Engine'}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>Total: {job.total_records.toLocaleString()}</span>
                  <span>Migrated: {job.migrated_records.toLocaleString()}</span>
                  {job.failed_records > 0 && (
                    <span className="text-red-500">Failed: {job.failed_records}</span>
                  )}
                </div>
                {job.status === 'running' && (
                  <div className="mt-2">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${(job.migrated_records / job.total_records) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {job.error_message && (
                  <p className="mt-2 text-sm text-red-500">{job.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Migration Modal */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Start New Migration</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Direction</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewJob({ ...newJob, source: 'one_wallet', target: 'one_engine' })}
                    className={`flex-1 p-3 rounded-md border text-sm ${
                      newJob.source === 'one_wallet'
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    Wallet → Engine
                  </button>
                  <button
                    onClick={() => setNewJob({ ...newJob, source: 'one_engine', target: 'one_wallet' })}
                    className={`flex-1 p-3 rounded-md border text-sm ${
                      newJob.source === 'one_engine'
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    Engine → Wallet
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Type</label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value as typeof newJob.type })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="users">Users Only</option>
                  <option value="transactions">Transactions Only</option>
                  <option value="all">All Data</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dryRun"
                  checked={newJob.dryRun}
                  onChange={(e) => setNewJob({ ...newJob, dryRun: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="dryRun" className="text-sm">
                  Dry run (preview only, no changes)
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewJobModal(false)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={startMigration}
                disabled={migrating}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {migrating ? 'Starting...' : 'Start Migration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
