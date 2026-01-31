'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: ReactNode;
  description?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'purple';
}

export function StatsCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  description,
  variant = 'default',
}: StatsCardProps) {
  const variantClasses = {
    default: 'stat-card',
    primary: 'gradient-primary text-white rounded-2xl p-6 shadow-primary',
    success: 'gradient-success text-white rounded-2xl p-6',
    warning: 'gradient-warning text-gray-900 rounded-2xl p-6',
    purple: 'gradient-purple text-white rounded-2xl p-6',
  };

  const iconBgClasses = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-white/20 text-white',
    success: 'bg-white/20 text-white',
    warning: 'bg-black/10 text-gray-900',
    purple: 'bg-white/20 text-white',
  };

  const trendColors = {
    up: variant === 'default' ? 'text-green-500' : 'text-green-200',
    down: variant === 'default' ? 'text-red-500' : 'text-red-200',
    neutral: variant === 'default' ? 'text-muted-foreground' : 'opacity-60',
  };

  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`${variantClasses[variant]} card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{formatValue(value)}</p>
          {change && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm font-medium flex items-center gap-1 ${trendColors[trend]}`}>
                {trend === 'up' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span>{change}</span>
              </span>
            </div>
          )}
          {description && (
            <p className={`text-xs mt-2 ${variant === 'default' ? 'text-muted-foreground' : 'opacity-60'}`}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${iconBgClasses[variant]}`}>
            {typeof icon === 'string' ? <span className="text-2xl">{icon}</span> : icon}
          </div>
        )}
      </div>
    </div>
  );
}
