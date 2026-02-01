'use client';

interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high';
}

const config = {
  low: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', label: 'Low' },
  medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', label: 'Medium' },
  high: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', label: 'High' },
};

export function RiskBadge({ level }: RiskBadgeProps) {
  const c = config[level] || config.medium;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}
