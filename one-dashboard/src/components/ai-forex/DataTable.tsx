'use client';

import { ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Column<T = any> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DataTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
  pageSize?: number;
  keyField?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any> = Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon = '📋',
  pageSize = 10,
  keyField = 'id',
}: DataTableProps<T>) {
  const tc = useTranslations('common');
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice(page * pageSize, (page + 1) * pageSize);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              {columns.map((col) => (
                <div key={col.key} className="flex-1">
                  <div className="h-4 bg-secondary rounded animate-pulse" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">{emptyIcon}</span>
        </div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paged.map((row, idx) => (
              <tr key={(row[keyField] as string) || idx} className="hover:bg-secondary/20 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                    {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-secondary/20">
          <p className="text-sm text-muted-foreground">
            {tc('table.showing', { from: page * pageSize + 1, to: Math.min((page + 1) * pageSize, data.length), total: data.length })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-sm rounded-lg bg-secondary/50 text-foreground disabled:opacity-50 hover:bg-secondary transition-colors"
            >
              {tc('actions.previous')}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-sm rounded-lg bg-secondary/50 text-foreground disabled:opacity-50 hover:bg-secondary transition-colors"
            >
              {tc('actions.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
