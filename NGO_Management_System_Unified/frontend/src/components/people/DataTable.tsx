import type { ReactNode } from 'react';
import EmptyState from './EmptyState';

export interface Column<T> { header: string; render: (row: T) => ReactNode; className?: string }

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyHint?: string;
}

export default function DataTable<T>({ columns, rows, rowKey, onRowClick, emptyTitle, emptyHint }: Props<T>) {
  if (rows.length === 0) return <EmptyState title={emptyTitle ?? 'No records found'} hint={emptyHint ?? 'Try changing your search or filters.'} />;
  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full text-left">
        <thead>
          <tr>{columns.map(c => <th key={c.header} className={c.className}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr
              key={rowKey(r)}
              className={onRowClick ? 'cursor-pointer focus:outline-none focus-visible:bg-slate-50' : ''}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              onKeyDown={onRowClick ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick(r);
                }
              } : undefined}
            >
              {columns.map(c => <td key={c.header} className={c.className} data-label={c.header}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
