'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('migration');
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
        alert(data.error?.message || t('failedToStart'));
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowNewJobModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 w-full sm:w-auto"
        >
          {t('newMigration')}
        </button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t('oneWalletDb')}</h3>
            <button
              onClick={() => testConnection('one_wallet')}
              className="text-sm text-primary hover:underline"
            >
              {t('testConnection')}
            </button>
          </div>
          {connectionStatus?.one_wallet ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.one_wallet.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">
                  {connectionStatus.one_wallet.connected ? t('connected') : t('disconnected')}
                </span>
              </div>
              {connectionStatus.one_wallet.latency && (
                <p className="text-sm text-muted-foreground">
                  {t('latency', { ms: connectionStatus.one_wallet.latency })}
                </p>
              )}
              {connectionStatus.one_wallet.version && (
                <p className="text-sm text-muted-foreground">
                  {t('postgresql', { version: connectionStatus.one_wallet.version })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('notConfigured')}</p>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{t('oneEngineDb')}</h3>
            <button
              onClick={() => testConnection('one_engine')}
              className="text-sm text-primary hover:underline"
            >
              {t('testConnection')}
            </button>
          </div>
          {connectionStatus?.one_engine ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus.one_engine.connected ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-sm">
                  {connectionStatus.one_engine.connected ? t('connected') : t('disconnected')}
                </span>
              </div>
              {connectionStatus.one_engine.latency && (
                <p className="text-sm text-muted-foreground">
                  {t('latency', { ms: connectionStatus.one_engine.latency })}
                </p>
              )}
              {connectionStatus.one_engine.version && (
                <p className="text-sm text-muted-foreground">
                  {t('postgresql', { version: connectionStatus.one_engine.version })}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('notConfigured')}</p>
          )}
        </div>
      </div>

      {/* Migration Jobs */}
      <div className="bg-card border rounded-lg">
        <div className="p-4 border-b">
          <h3 className="font-semibold">{t('history')}</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {t('noJobs')}
          </div>
        ) : (
          <div className="divide-y">
            {jobs.map((job) => (
              <div key={job.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {job.source === 'one_wallet' ? t('oneWallet') : t('oneEngine')}
                    </span>
                    <span className="text-muted-foreground">{'\u2192'}</span>
                    <span className="font-medium">
                      {job.target === 'one_wallet' ? t('oneWallet') : t('oneEngine')}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
                  <span>{t('total', { count: job.total_records.toLocaleString() })}</span>
                  <span>{t('migrated', { count: job.migrated_records.toLocaleString() })}</span>
                  {job.failed_records > 0 && (
                    <span className="text-red-500">{t('failed', { count: job.failed_records })}</span>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{t('startNew')}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('direction')}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewJob({ ...newJob, source: 'one_wallet', target: 'one_engine' })}
                    className={`flex-1 p-3 rounded-md border text-sm ${
                      newJob.source === 'one_wallet'
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    {t('walletToEngine')}
                  </button>
                  <button
                    onClick={() => setNewJob({ ...newJob, source: 'one_engine', target: 'one_wallet' })}
                    className={`flex-1 p-3 rounded-md border text-sm ${
                      newJob.source === 'one_engine'
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    {t('engineToWallet')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{t('dataType')}</label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value as typeof newJob.type })}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="users">{t('usersOnly')}</option>
                  <option value="transactions">{t('transactionsOnly')}</option>
                  <option value="all">{t('allData')}</option>
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
                  {t('dryRun')}
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewJobModal(false)}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-secondary"
              >
                {t('cancel')}
              </button>
              <button
                onClick={startMigration}
                disabled={migrating}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {migrating ? t('starting') : t('startMigration')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
