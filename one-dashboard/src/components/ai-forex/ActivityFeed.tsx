'use client';

import { useTranslations } from 'next-intl';

interface ActivityItem {
  id: string;
  type: 'ai_order' | 'ai_decision' | 'forex_trade' | 'forex_investment';
  title: string;
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  loading?: boolean;
}

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  ai_order: { icon: '🤖', color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10' },
  ai_decision: { icon: '🧠', color: 'text-[#2563EB]', bg: 'bg-[#2563EB]/10' },
  forex_trade: { icon: '💱', color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
  forex_investment: { icon: '📈', color: 'text-[#8B5CF6]', bg: 'bg-[#8B5CF6]/10' },
};

export function ActivityFeed({ items, loading = false }: ActivityFeedProps) {
  const tc = useTranslations('common');

  function formatTimestamp(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return tc('time.justNow');
    if (mins < 60) return tc('time.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return tc('time.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return tc('time.daysAgo', { count: days });
    return d.toLocaleDateString();
  }
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-secondary rounded" />
              <div className="h-3 w-2/3 bg-secondary rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <p className="text-muted-foreground">{tc('noActivityRecords')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const cfg = typeConfig[item.type] || typeConfig.ai_order;
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/20 transition-colors"
          >
            <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
              <span className="text-lg">{cfg.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatTimestamp(item.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
