'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface PerformanceChartProps {
  data: Array<{ date: string; value: number; [key: string]: unknown }>;
  dataKey?: string;
  color?: 'teal' | 'purple';
  height?: number;
  type?: 'line' | 'area';
  showGrid?: boolean;
}

const colors = {
  teal: '#188775',
  purple: '#8B5CF6',
};

export function PerformanceChart({
  data,
  dataKey = 'value',
  color = 'teal',
  height = 300,
  type = 'area',
  showGrid = true,
}: PerformanceChartProps) {
  const strokeColor = colors[color];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-secondary/20 rounded-xl" style={{ height }}>
        <p className="text-muted-foreground text-sm">No performance data available</p>
      </div>
    );
  }

  const Chart = type === 'area' ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />}
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#888' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#888' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#888' }}
        />
        {type === 'area' ? (
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            fill={`${strokeColor}20`}
            dot={false}
            activeDot={{ r: 4, fill: strokeColor }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: strokeColor }}
          />
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
