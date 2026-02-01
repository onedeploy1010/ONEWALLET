'use client';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'dot';
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  stopped: { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' },
  pending: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
  redeemed: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' },
  cancelled: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' },
  matured: { bg: 'bg-teal-500/10', text: 'text-teal-500', border: 'border-teal-500/20' },
  withdrawn: { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  open: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
  closed: { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' },
};

const fallback = { bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20' };

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const c = statusColors[status] || fallback;

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.bg.replace('/10', '')}`} />
        {status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {status}
    </span>
  );
}
