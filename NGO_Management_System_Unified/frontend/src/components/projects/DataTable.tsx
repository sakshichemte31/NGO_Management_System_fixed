import type { ReactNode } from 'react';
import EmptyState from './EmptyState';

export interface Column<T> { key: string; header: string; render?: (row: T) => ReactNode; className?: string; align?: 'left' | 'right' }
interface Props<T> {
  columns: Column<T>[]; rows: T[]; rowKey: (r: T) => string; onRowClick?: (r: T) => void;
  emptyTitle?: string; emptyMessage?: string; footer?: ReactNode; caption?: string;
}

/** Thin wrapper over the global .data-table style: horizontal scroll on mobile + empty state. */
export default function DataTable<T>({ columns, rows, rowKey, onRowClick, emptyTitle = 'Nothing here yet', emptyMessage, footer, caption }: Props<T>) {
  if (rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />;
  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead><tr>{columns.map(c => <th key={c.key} scope="col" className={c.align === 'right' ? 'text-right' : ''}>{c.header}</th>)}</tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={onRowClick ? 'cursor-pointer' : ''}>
              {columns.map(c => <td key={c.key} className={`${c.className ?? ''} ${c.align === 'right' ? 'text-right' : ''}`}>{c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '—')}</td>)}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}
