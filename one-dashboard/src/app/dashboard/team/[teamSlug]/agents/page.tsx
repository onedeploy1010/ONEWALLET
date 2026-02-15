'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface AgentStats {
  totalStrategies: number;
  activeStrategies: number;
  totalAUM: number;
  totalProfit: number;
}

interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  cryptoStrategies: number;
  forexStrategies: number;
  activeCount: number;
}

interface Strategy {
  id: string;
  name: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  status: string;
  tvl: number;
  winRate: number;
  sharpeRatio: number;
  totalPnl: number;
  type: 'crypto' | 'forex';
}

export default function AIAgentsPage() {
  const t = useTranslations('common');
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [stats, setStats] = useState<AgentStats>({ totalStrategies: 0, activeStrategies: 0, totalAUM: 0, totalProfit: 0 });
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      const [projectsRes, cryptoRes, forexRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/ai/strategies'),
        fetch('/api/forex/strategies'),
      ]);
      const projectsData = await projectsRes.json();
      const cryptoData = await cryptoRes.json();
      const forexData = await forexRes.json();

      if (projectsData.success) {
        setProjects(
          (projectsData.data || []).map((p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            cryptoStrategies: 0,
            forexStrategies: 0,
            activeCount: 0,
          }))
        );
      }

      const cryptoStrats = (cryptoData.success ? cryptoData.data : []).map((s: Record<string, unknown>) => ({ ...s, type: 'crypto' as const }));
      const forexStrats = (forexData.success ? forexData.data : []).map((s: Record<string, unknown>) => ({ ...s, type: 'forex' as const, tvl: s.aum || s.tvl }));
      const allStrats = [...cryptoStrats, ...forexStrats];

      setStrategies(allStrats);

      const active = allStrats.filter((s: Record<string, unknown>) => s.status !== 'paused');
      const totalAUM = allStrats.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.tvl ?? 0), 0);
      const totalProfit = allStrats.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.totalPnl ?? 0), 0);
      setStats({
        totalStrategies: allStrats.length,
        activeStrategies: active.length,
        totalAUM,
        totalProfit,
      });
    } catch (error) {
      console.error('Failed to fetch agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const agentCards = [
    {
      title: t('agents.quantAgent.title'),
      description: t('agents.quantAgent.description'),
      gradient: 'from-[#2563EB] to-[#7C3AED]',
      iconBg: 'bg-[#2563EB]/20',
      iconColor: 'text-[#2563EB]',
      features: [t('agents.quantAgent.feature1'), t('agents.quantAgent.feature2'), t('agents.quantAgent.feature3'), t('agents.quantAgent.feature4')],
      linkSuffix: '/ai',
      status: t('agents.operational'),
    },
    {
      title: t('agents.forexAgent.title'),
      description: t('agents.forexAgent.description'),
      gradient: 'from-[#059669] to-[#0891B2]',
      iconBg: 'bg-[#059669]/20',
      iconColor: 'text-[#059669]',
      features: [t('agents.forexAgent.feature1'), t('agents.forexAgent.feature2'), t('agents.forexAgent.feature3'), t('agents.forexAgent.feature4')],
      linkSuffix: '/forex',
      status: t('agents.operational'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('agents.title')}</h1>
        <p className="text-muted-foreground">
          {t('agents.subtitle')}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: t('agents.totalStrategies'),
            value: stats.totalStrategies,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'text-[#2563EB]',
            bg: 'bg-[#2563EB]/10',
          },
          {
            label: t('agents.activeStrategies'),
            value: stats.activeStrategies,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
            color: 'text-green-500',
            bg: 'bg-green-500/10',
          },
          {
            label: t('agents.totalAum'),
            value: stats.totalAUM >= 1_000_000 ? `$${(stats.totalAUM / 1_000_000).toFixed(1)}M` : `$${(stats.totalAUM / 1000).toFixed(1)}K`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
          },
          {
            label: t('agents.totalProfit'),
            value: stats.totalProfit >= 1_000_000 ? `$${(stats.totalProfit / 1_000_000).toFixed(1)}M` : `$${(stats.totalProfit / 1000).toFixed(1)}K`,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{typeof stat.value === 'number' ? stat.value : stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agentCards.map((agent) => (
          <div
            key={agent.title}
            className="relative overflow-hidden bg-card border border-border rounded-2xl"
          >
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${agent.gradient} p-6`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{agent.title}</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 rounded-full text-xs text-white font-medium backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {agent.status}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M16 3v1.5m0 15V21m-8-12h8m-8 4h8m-9.5-8h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 17.5v-11A1.5 1.5 0 016.5 5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>

              <div className="space-y-2 mb-6">
                {agent.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-foreground/80">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Project Quick Links */}
              {projects.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">{t('agents.quickAccess')}</p>
                  <div className="flex flex-wrap gap-2">
                    {projects.slice(0, 3).map((project) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/team/${teamSlug}/${project.id}${agent.linkSuffix}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-lg text-xs text-foreground transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {project.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Strategies List */}
      {strategies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('agents.allStrategies')}</h2>
            <p className="text-sm text-muted-foreground">{t('agents.clickToViewPerformance')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strategy) => {
              const projectId = projects[0]?.id;
              const strategyPath = strategy.type === 'crypto'
                ? `/dashboard/team/${teamSlug}/${projectId}/ai/strategies/${strategy.id}`
                : `/dashboard/team/${teamSlug}/${projectId}/forex/strategies/${strategy.id}`;
              const riskColors = {
                low: 'bg-green-500/10 text-green-500 border-green-500/20',
                medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                high: 'bg-red-500/10 text-red-500 border-red-500/20',
              };
              const typeColors = strategy.type === 'crypto'
                ? 'hover:border-[#2563EB]/30'
                : 'hover:border-[#8B5CF6]/30';
              const typeBadge = strategy.type === 'crypto'
                ? 'bg-[#2563EB]/10 text-[#2563EB]'
                : 'bg-[#8B5CF6]/10 text-[#8B5CF6]';

              return (
                <Link
                  key={`${strategy.type}-${strategy.id}`}
                  href={strategyPath}
                  className={`group bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-all ${typeColors}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {strategy.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{strategy.category}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeBadge}`}>
                        {strategy.type === 'crypto' ? t('agents.crypto') : t('agents.forex')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${riskColors[strategy.riskLevel]}`}>
                        {strategy.riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('agents.aum')}</p>
                      <p className="text-sm font-semibold text-foreground">
                        ${(Number(strategy.tvl) || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('agents.winRate')}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {(Number(strategy.winRate) || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('agents.sharpe')}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {(Number(strategy.sharpeRatio) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('agents.pnl')}</p>
                      <p className={`text-sm font-semibold ${Number(strategy.totalPnl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Number(strategy.totalPnl) >= 0 ? '+' : ''}${(Number(strategy.totalPnl) || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {!loading && projects.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#7C3AED]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M16 3v1.5m0 15V21m-8-12h8m-8 4h8m-9.5-8h11a1.5 1.5 0 011.5 1.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 17.5v-11A1.5 1.5 0 016.5 5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('agents.createToStart')}</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {t('agents.createToStartDesc')}
          </p>
          <Link
            href={`/dashboard/team/${teamSlug}/projects/new`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            {t('agents.createProject')}
          </Link>
        </div>
      )}
    </div>
  );
}
