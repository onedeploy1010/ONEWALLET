'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface UsageData {
  date: string;
  requests: number;
  successful: number;
  failed: number;
  avgLatency: number;
  costUnits: number;
  successRate: number;
}

interface UsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  totalCostUnits: number;
  successRate: number;
  topEndpoints: { endpoint: string; count: number }[];
  topProviders: { provider: string; count: number }[];
}

interface QuotaInfo {
  apiRequests: {
    used: number;
    limit: number;
    percentage: number;
  };
  costUnits: {
    used: number;
    limit: number;
    percentage: number;
  };
  periodStart: string;
  periodEnd: string;
}

export default function UsagePage() {
  const params = useParams();
  const t = useTranslations('settings');
  const projectId = params.projectId as string;
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  useEffect(() => {
    fetchUsage();
  }, [projectId, period]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usage?project_id=${projectId}&period=${period}`);
      const data = await res.json();
      if (data.success) {
        setUsageData(data.data.usage || []);
        setSummary(data.data.summary || null);
        setQuota(data.data.quota || null);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getQuotaBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-[#2563EB]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('usage.title')}</h1>
          <p className="text-muted-foreground">
            {t('usage.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-xl">
          {(['daily', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                period === p
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {t(`usage.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Quota Overview */}
      {quota && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Requests Quota */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2563EB]/10 to-[#3B82F6]/5 border border-[#2563EB]/20 rounded-2xl p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#2563EB]/20 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{t('usage.apiRequests')}</h3>
                <p className="text-sm text-muted-foreground">{t('usage.monthlyLimit')}</p>
              </div>
              <span className={`text-2xl font-bold ${getQuotaColor(quota.apiRequests.percentage)}`}>
                {quota.apiRequests.percentage}%
              </span>
            </div>
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-2">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${getQuotaBarColor(quota.apiRequests.percentage)}`}
                style={{ width: `${Math.min(quota.apiRequests.percentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('usage.requests', { count: `${formatNumber(quota.apiRequests.used)} / ${formatNumber(quota.apiRequests.limit)}` })}
            </p>
          </div>

          {/* Cost Units Quota */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">{t('usage.costUnits')}</h3>
                <p className="text-sm text-muted-foreground">{t('usage.monthlyLimit')}</p>
              </div>
              <span className={`text-2xl font-bold ${getQuotaColor(quota.costUnits.percentage)}`}>
                {quota.costUnits.percentage}%
              </span>
            </div>
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-2">
              <div
                className={`absolute top-0 left-0 h-full rounded-full transition-all ${getQuotaBarColor(quota.costUnits.percentage)}`}
                style={{ width: `${Math.min(quota.costUnits.percentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('usage.units', { count: `${formatNumber(quota.costUnits.used)} / ${formatNumber(quota.costUnits.limit)}` })}
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{t('usage.totalRequests')}</p>
            <p className="text-2xl font-bold text-foreground">{formatNumber(summary.totalRequests)}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{t('usage.successRate')}</p>
            <p className={`text-2xl font-bold ${summary.successRate >= 95 ? 'text-green-500' : summary.successRate >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
              {summary.successRate}%
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{t('usage.avgLatency')}</p>
            <p className="text-2xl font-bold text-foreground">{summary.avgLatency}ms</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{t('usage.costUnits')}</p>
            <p className="text-2xl font-bold text-purple-500">{formatNumber(summary.totalCostUnits)}</p>
          </div>
        </div>
      )}

      {/* Usage Chart */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold text-foreground mb-4">{t('usage.requestVolume')}</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : usageData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {t('usage.noUsageData')}
          </div>
        ) : (
          <div className="h-64 flex items-end gap-1">
            {usageData.slice(-30).map((day, i) => {
              const maxRequests = Math.max(...usageData.map(d => d.requests));
              const height = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-[#2563EB] to-[#3B82F6] rounded-t-sm hover:opacity-80 transition-opacity cursor-pointer group relative"
                  style={{ height: `${Math.max(height, 2)}%` }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover border border-border rounded-lg p-2 shadow-lg whitespace-nowrap">
                      <p className="text-xs font-medium text-foreground">{day.date}</p>
                      <p className="text-xs text-muted-foreground">{t('usage.requestsTooltip', { count: day.requests })}</p>
                      <p className="text-xs text-muted-foreground">{t('usage.successTooltip', { percent: day.successRate })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{usageData[0]?.date || ''}</span>
          <span>{usageData[usageData.length - 1]?.date || ''}</span>
        </div>
      </div>

      {/* Top Endpoints & Providers */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Endpoints */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('usage.topEndpoints')}</h3>
            {summary.topEndpoints.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('usage.noEndpointData')}</p>
            ) : (
              <div className="space-y-3">
                {summary.topEndpoints.map((ep, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <code className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">
                      {ep.endpoint}
                    </code>
                    <span className="text-sm font-medium text-foreground ml-2">
                      {formatNumber(ep.count)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Provider Usage */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-4">{t('usage.providerUsage')}</h3>
            {summary.topProviders.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('usage.noProviderData')}</p>
            ) : (
              <div className="space-y-3">
                {summary.topProviders.map((p, i) => {
                  const percentage = Math.round((p.count / summary.totalRequests) * 100);
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {p.provider}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatNumber(p.count)} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing Period Info */}
      {quota && (
        <div className="bg-gradient-to-r from-blue-500/10 via-blue-600/5 to-transparent border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="font-semibold text-foreground">{t('usage.billingPeriod')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('usage.currentPeriod', { period: `${new Date(quota.periodStart).toLocaleDateString()} - ${new Date(quota.periodEnd).toLocaleDateString()}` })}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('usage.quotaInfo')}
          </p>
        </div>
      )}
    </div>
  );
}
