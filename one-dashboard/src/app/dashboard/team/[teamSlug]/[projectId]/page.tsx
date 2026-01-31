import { supabaseEngine } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';

async function getProjectStats(projectId: string) {
  const [
    { count: totalWallets },
    { count: totalTransactions },
    { count: activeContracts },
    { data: apiUsage },
  ] = await Promise.all([
    supabaseEngine
      .from('wallets')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabaseEngine
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabaseEngine
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabaseEngine
      .from('api_usage')
      .select('count')
      .eq('project_id', projectId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const apiCallsToday = (apiUsage || []).reduce((sum: number, row: { count: number }) => sum + (row.count || 0), 0);

  return {
    totalWallets: totalWallets || 0,
    totalTransactions: totalTransactions || 0,
    activeContracts: activeContracts || 0,
    apiCallsToday,
  };
}

async function getProjectDetails(projectId: string) {
  const { data: project } = await supabaseEngine
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  return project;
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ teamSlug: string; projectId: string }>;
}) {
  const { projectId } = await params;
  const [stats, project] = await Promise.all([
    getProjectStats(projectId),
    getProjectDetails(projectId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project?.name || 'Project'}</h1>
        <p className="text-muted-foreground">
          Project ID: {projectId}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Connected Wallets"
          value={stats.totalWallets}
          icon="👛"
          description="In-App + Ecosystem wallets"
        />
        <StatsCard
          title="Transactions"
          value={stats.totalTransactions}
          icon="💸"
          description="All-time transactions"
        />
        <StatsCard
          title="Active Contracts"
          value={stats.activeContracts}
          icon="📜"
          description="Deployed contracts"
        />
        <StatsCard
          title="API Calls Today"
          value={stats.apiCallsToday}
          icon="🔗"
          description="Last 24 hours"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Connect</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage wallets, authentication, and payments
          </p>
          <div className="space-y-2">
            <div className="text-sm">In-App Wallets: {stats.totalWallets}</div>
            <div className="text-sm">Ecosystem Wallets: 0</div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Contracts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Deploy and interact with smart contracts
          </p>
          <div className="space-y-2">
            <div className="text-sm">Deployed: {stats.activeContracts}</div>
            <div className="text-sm">Published: 0</div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-2">Engine</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Backend infrastructure and transactions
          </p>
          <div className="space-y-2">
            <div className="text-sm">Backend Wallets: 0</div>
            <div className="text-sm">Pending Txs: 0</div>
          </div>
        </div>
      </div>

      {/* API Key Info */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">API Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Client ID</p>
            <p className="font-mono text-sm bg-secondary/50 px-3 py-2 rounded">
              {project?.api_key_prefix || 'one_'}...
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Status</p>
            <span className={`inline-block px-3 py-1 text-sm rounded-full ${
              project?.status === 'active'
                ? 'bg-green-500/10 text-green-500'
                : 'bg-gray-500/10 text-gray-500'
            }`}>
              {project?.status || 'unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
