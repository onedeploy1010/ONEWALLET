'use client';

interface PnlBadgeProps {
  value: number;
  percent?: number;
  showPercent?: boolean;
}

export function PnlBadge({ value, percent, showPercent = true }: PnlBadgeProps) {
  const isPositive = value >= 0;
  const color = isPositive ? 'text-green-500' : 'text-red-500';
  const bg = isPositive ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-medium ${bg} ${color}`}>
      {isPositive ? '+' : ''}
      {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      {showPercent && percent !== undefined && (
        <span className="text-xs opacity-75">
          ({isPositive ? '+' : ''}{percent.toFixed(1)}%)
        </span>
      )}
    </span>
  );
}
