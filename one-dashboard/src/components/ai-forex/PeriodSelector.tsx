'use client';

import { useTranslations } from 'next-intl';

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
  options?: { label: string; value: string }[];
}

export function PeriodSelector({ value, onChange, options }: PeriodSelectorProps) {
  const tc = useTranslations('common');

  const defaultOptions = [
    { label: tc('period.daily'), value: 'daily' },
    { label: tc('period.weekly'), value: 'weekly' },
    { label: tc('period.monthly'), value: 'monthly' },
  ];

  const resolvedOptions = options || defaultOptions;
  return (
    <div className="inline-flex bg-secondary/50 rounded-xl p-1">
      {resolvedOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
