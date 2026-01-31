import { supabaseEngine } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

async function getTeamStats(teamSlug: string) {
  const [
    { count: totalProjects },
    { count: totalUsers },
    { count: totalTransactions },
  ] = await Promise.all([
    supabaseEngine.from('projects').select('*', { count: 'exact', head: true }),
    supabaseEngine.from('users').select('*', { count: 'exact', head: true }),
    supabaseEngine.from('transactions').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalProjects: totalProjects || 0,
    totalUsers: totalUsers || 0,
    totalTransactions: totalTransactions || 0,
  };
}

async function getProjects() {
  const { data: projects } = await supabaseEngine
    .from('projects')
    .select('id, name, slug, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return projects || [];
}

// Icon Components
const FolderIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TransactionIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ArrowIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default async function TeamOverviewPage({
  params,
}: {
  params: Promise<{ teamSlug: string }>;
}) {
  const { teamSlug } = await params;
  const [stats, projects] = await Promise.all([
    getTeamStats(teamSlug),
    getProjects(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Overview</h1>
        <p className="text-muted-foreground mt-1">
          Manage your projects and view ecosystem analytics
        </p>
      </div>

      {/* Welcome Card */}
      <GradientCard showDecorations>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to ONE Dashboard</h2>
            <p className="text-white/80 text-sm max-w-md">
              Build, deploy, and manage your Web3 applications with our powerful ecosystem tools.
            </p>
          </div>
          <Link href={`/dashboard/team/${teamSlug}/projects/new`}>
            <Button variant="secondary" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <PlusIcon />
              <span className="ml-2">New Project</span>
            </Button>
          </Link>
        </div>
      </GradientCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<FolderIcon />}
          change="+2 this month"
          trend="up"
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<UsersIcon />}
          change="+12 this week"
          trend="up"
        />
        <StatsCard
          title="Transactions"
          value={stats.totalTransactions}
          icon={<TransactionIcon />}
          change="+156 today"
          trend="up"
        />
      </div>

      {/* Projects List */}
      <Card padding="none">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Projects</h2>
            <p className="text-sm text-muted-foreground">Quick access to your recent projects</p>
          </div>
          <Link href={`/dashboard/team/${teamSlug}/projects/new`}>
            <Button size="sm" icon={<PlusIcon />}>
              New Project
            </Button>
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <FolderIcon />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first project to start building on the ONE ecosystem
            </p>
            <Link href={`/dashboard/team/${teamSlug}/projects/new`}>
              <Button icon={<PlusIcon />}>
                Create Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/team/${teamSlug}/${project.id}`}
                className="flex items-center justify-between p-5 hover:bg-secondary/30 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shadow-primary">
                    {project.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{project.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      project.status === 'active'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                    }`}
                  >
                    {project.status}
                  </span>
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {projects.length > 0 && (
          <div className="p-4 border-t border-border bg-secondary/20">
            <Link
              href={`/dashboard/team/${teamSlug}/projects`}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center justify-center gap-2"
            >
              View all projects
              <ArrowIcon />
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
