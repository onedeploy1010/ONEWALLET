'use client';

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
  options?: { label: string; value: string }[];
}

const defaultOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

export function PeriodSelector({ value, onChange, options = defaultOptions }: PeriodSelectorProps) {
  return (
    <div className="inline-flex bg-secondary/50 rounded-xl p-1">
      {options.map((opt) => (
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
