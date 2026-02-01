'use client';

interface ConfidenceBarProps {
  value: number;
  showLabel?: boolean;
}

export function ConfidenceBar({ value, showLabel = true }: ConfidenceBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 75 ? 'bg-green-500' :
    clamped >= 50 ? 'bg-yellow-500' :
    clamped >= 25 ? 'bg-orange-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground w-8 text-right">{clamped}%</span>
      )}
    </div>
  );
}
