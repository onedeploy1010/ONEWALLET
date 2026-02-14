'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ConnectStats {
  totalConnections: number;
  uniqueUsers: number;
  successRate: number;
  avgSessionDuration: number;
  connectionsByMethod: Record<string, number>;
  connectionsByDay: Array<{ date: string; count: number }>;
}

export default function ConnectAnalyticsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const t = useTranslations('connect');
  const [stats, setStats] = useState<ConnectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchStats();
  }, [projectId, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/connect/analytics?project_id=${projectId}&range=${timeRange}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        // Set demo data for display
        setStats({
          totalConnections: 0,
          uniqueUsers: 0,
          successRate: 0,
          avgSessionDuration: 0,
          connectionsByMethod: {},
          connectionsByDay: [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setStats({
        totalConnections: 0,
        uniqueUsers: 0,
        successRate: 0,
        avgSessionDuration: 0,
        connectionsByMethod: {},
        connectionsByDay: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const methodIcons: Record<string, { icon: string; color: string }> = {
    email: { icon: '📧', color: 'from-blue-500 to-blue-600' },
    phone: { icon: '📱', color: 'from-green-500 to-green-600' },
    social: { icon: '🌐', color: 'from-purple-500 to-purple-600' },
    passkey: { icon: '🔑', color: 'from-orange-500 to-orange-600' },
    external: { icon: '🔗', color: 'from-gray-500 to-gray-600' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('analytics.title')}</h1>
          <p className="text-muted-foreground">
            {t('analytics.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {range === '7d' ? t('analytics.7days') : range === '30d' ? t('analytics.30days') : t('analytics.90days')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/2 mb-4" />
                <div className="h-8 bg-secondary rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#2563EB]/10 to-[#3B82F6]/5 border border-[#2563EB]/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#2563EB]/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">{t('analytics.totalConnections')}</p>
              <p className="text-3xl font-bold text-foreground">{(stats?.totalConnections || 0).toLocaleString()}</p>
              <p className="text-xs text-[#2563EB] mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {t('analytics.allTimeConnections')}
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">{t('analytics.uniqueUsers')}</p>
              <p className="text-3xl font-bold text-foreground">{(stats?.uniqueUsers || 0).toLocaleString()}</p>
              <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {t('analytics.distinctWallets')}
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">{t('analytics.successRate')}</p>
              <p className="text-3xl font-bold text-foreground">{(stats?.successRate || 0).toFixed(1)}%</p>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('analytics.connectionSuccess')}
              </p>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-10 -mt-10" />
              <p className="text-sm text-muted-foreground mb-2">{t('analytics.avgSession')}</p>
              <p className="text-3xl font-bold text-foreground">{Math.round(stats?.avgSessionDuration || 0)}m</p>
              <p className="text-xs text-purple-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('analytics.durationPerUser')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connections by Method */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-6">{t('analytics.connectionsByMethod')}</h3>
              {Object.keys(stats?.connectionsByMethod || {}).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-muted-foreground">{t('analytics.noConnectionData')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('analytics.dataWillAppear')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats?.connectionsByMethod || {}).map(([method, count]) => {
                    const total = Object.values(stats?.connectionsByMethod || {}).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const methodInfo = methodIcons[method] || { icon: '🔗', color: 'from-gray-500 to-gray-600' };

                    return (
                      <div key={method} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{methodInfo.icon}</span>
                            <span className="text-sm font-medium capitalize text-foreground">{method}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{count.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">({percentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${methodInfo.color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Connections Over Time */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-6">{t('analytics.connectionsOverTime')}</h3>
              {(stats?.connectionsByDay || []).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📈</div>
                  <p className="text-muted-foreground">{t('analytics.noTimelineData')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('analytics.chartWillAppear')}</p>
                </div>
              ) : (
                <>
                  <div className="h-48 flex items-end gap-1">
                    {(stats?.connectionsByDay || []).map((day, i) => {
                      const max = Math.max(...(stats?.connectionsByDay || []).map((d) => d.count));
                      const height = max > 0 ? (day.count / max) * 100 : 0;

                      return (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-[#2563EB] to-[#3B82F6] rounded-t-sm hover:from-[#3B82F6] hover:to-[#2563EB] transition-all relative group cursor-pointer"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap shadow-lg transition-opacity z-10">
                            <div className="font-semibold">{day.count} {t('analytics.connections')}</div>
                            <div className="text-[10px] opacity-75">{day.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                    <span>{stats?.connectionsByDay?.[0]?.date}</span>
                    <span>{stats?.connectionsByDay?.[stats.connectionsByDay.length - 1]?.date}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-r from-[#2563EB]/10 via-[#3B82F6]/5 to-transparent border border-[#2563EB]/20 rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('analytics.tips.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('analytics.tips.tip1Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('analytics.tips.tip1Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('analytics.tips.tip2Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('analytics.tips.tip2Desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t('analytics.tips.tip3Title')}</p>
                  <p className="text-xs text-muted-foreground">{t('analytics.tips.tip3Desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
