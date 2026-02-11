import { supabaseEngine } from '@/lib/supabase';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { GradientCard } from '@/components/ui/GradientCard';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

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

async function getDemoProject() {
  try {
    const { data } = await supabaseEngine
      .from('projects')
      .select('id, name, slug')
      .eq('id', '00000000-0000-0000-0000-000000000099')
      .single();
    return data;
  } catch {
    return null;
  }
}

// Playground demo modules — links to demo project pages
// Note: translated strings are injected at render time via t() calls

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
  const t = await getTranslations('dashboard');
  const [stats, demoProject] = await Promise.all([
    getTeamStats(teamSlug),
    getDemoProject(),
  ]);
  const demoBaseUrl = demoProject
    ? `/dashboard/team/${teamSlug}/${demoProject.id}`
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('teamOverview')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('teamSubtitle')}
        </p>
      </div>

      {/* Welcome Card */}
      <GradientCard showDecorations>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">{t('welcome.title')}</h2>
            <p className="text-white/80 text-sm max-w-md">
              {t('welcome.description')}
            </p>
          </div>
          <Link href={`/dashboard/team/${teamSlug}/projects/new`}>
            <Button variant="secondary" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <PlusIcon />
              <span className="ml-2">{t('welcome.newProject')}</span>
            </Button>
          </Link>
        </div>
      </GradientCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={t('stats.totalProjects')}
          value={stats.totalProjects}
          icon={<FolderIcon />}
          change={t('stats.totalProjectsChange')}
          trend="up"
        />
        <StatsCard
          title={t('stats.totalUsers')}
          value={stats.totalUsers}
          icon={<UsersIcon />}
          change={t('stats.totalUsersChange')}
          trend="up"
        />
        <StatsCard
          title={t('stats.transactions')}
          value={stats.totalTransactions}
          icon={<TransactionIcon />}
          change={t('stats.transactionsChange')}
          trend="up"
        />
      </div>

      {/* Demo Project */}
      {demoBaseUrl && (() => {
        const playgroundModules = [
          {
            id: 'overview',
            name: t('modules.projectOverview'),
            description: t('modules.projectOverviewDesc'),
            icon: '🏠',
            gradient: 'from-blue-500 to-blue-700',
            suffix: '',
            tags: [t('modules.projectTag'), t('modules.apiKeysTag'), t('modules.configTag')],
          },
          {
            id: 'ai',
            name: t('modules.aiTrading'),
            description: t('modules.aiTradingDesc'),
            icon: '🤖',
            gradient: 'from-[#2563EB] to-[#7C3AED]',
            suffix: '/ai',
            tags: [t('modules.cryptoTag'), t('modules.strategiesTag'), t('modules.aiTag')],
          },
          {
            id: 'forex',
            name: t('modules.forexTrading'),
            description: t('modules.forexTradingDesc'),
            icon: '📈',
            gradient: 'from-[#059669] to-[#0891B2]',
            suffix: '/forex',
            tags: [t('modules.forexTag'), t('modules.investmentsTag'), t('modules.poolsTag')],
          },
        ];
        return (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('demoProject.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('demoProject.subtitle', { name: demoProject?.name || t('demoProject.fallbackName') })}</p>
            </div>
            <Link
              href={demoBaseUrl}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white hover:opacity-90 transition-opacity"
            >
              {t('demoProject.openProject')}
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {playgroundModules.map((mod) => (
              <Link
                key={mod.id}
                href={`${demoBaseUrl}${mod.suffix}`}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {mod.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {mod.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mod.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-md bg-secondary text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
        );
      })()}

      {/* Quick Links */}
      <Card padding="none">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{t('quickStart.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('quickStart.subtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          <Link
            href={`/dashboard/team/${teamSlug}/projects/new`}
            className="p-6 hover:bg-secondary/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform">
              <PlusIcon />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('quickStart.createProject')}</h3>
            <p className="text-sm text-muted-foreground">{t('quickStart.createProjectDesc')}</p>
          </Link>
          <Link
            href={`/dashboard/team/${teamSlug}/projects`}
            className="p-6 hover:bg-secondary/30 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
              <FolderIcon />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('quickStart.viewProjects')}</h3>
            <p className="text-sm text-muted-foreground">{t('quickStart.viewProjectsDesc')}</p>
          </Link>
          <div className="p-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('quickStart.documentation')}</h3>
            <p className="text-sm text-muted-foreground">{t('quickStart.documentationDesc')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
