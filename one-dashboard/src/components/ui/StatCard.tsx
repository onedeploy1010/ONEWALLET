'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'purple';
}

export function StatCard({
  title,
  value,
  change,
  icon,
  variant = 'default',
}: StatCardProps) {
  const variantClasses = {
    default: 'stat-card',
    primary: 'gradient-primary text-white',
    success: 'gradient-success text-white',
    warning: 'gradient-warning text-gray-900',
    purple: 'gradient-purple text-white',
  };

  const iconBgClasses = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-white/20 text-white',
    success: 'bg-white/20 text-white',
    warning: 'bg-black/10 text-gray-900',
    purple: 'bg-white/20 text-white',
  };

  return (
    <div className={`rounded-2xl p-6 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${variant === 'default' ? 'text-muted-foreground' : 'opacity-80'}`}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-sm font-medium ${
                  change.type === 'increase'
                    ? variant === 'default' ? 'text-green-500' : 'text-green-200'
                    : variant === 'default' ? 'text-red-500' : 'text-red-200'
                }`}
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              <span className={`text-xs ${variant === 'default' ? 'text-muted-foreground' : 'opacity-60'}`}>
                vs last period
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${iconBgClasses[variant]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
