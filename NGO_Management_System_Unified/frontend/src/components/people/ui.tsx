import type { ReactNode } from 'react';
import { Download } from 'lucide-react';

export const ACCENT = { hr: '#6366F1', intern: '#10B981', volunteer: '#F43F5E' } as const;

export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

export function Avatar({ name, color = '#1AACB8', size = 36 }: { name: string; color?: string; size?: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full font-bold shrink-0" style={{ width: size, height: size, background: `${color}1F`, color, fontSize: size * 0.36 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function ProgressBar({ value, color = '#1AACB8' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-9 text-right">{value}%</span>
    </div>
  );
}

export function InfoGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
          <dd className="text-sm text-slate-800 mt-0.5">{v || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-slate-800 mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>{children}</h3>;
}

/** Inner tab pills for drawers (sub-tabs). */
export function SubTabs({ tabs, active, onChange, accent }: { tabs: string[]; active: string; onChange: (t: string) => void; accent: string }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-100 mb-5" role="tablist">
      {tabs.map(t => (
        <button key={t} role="tab" aria-selected={active === t} onClick={() => onChange(t)}
          className={`px-3 py-2 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${active === t ? 'text-slate-800' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
          style={active === t ? { borderColor: accent } : undefined}>{t}</button>
      ))}
    </div>
  );
}

/** Page-level tab bar using the shared tab-bar classes + a subtle module-accent underline. */
export function PageTabs({ tabs, active, onChange, accent }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void; accent: string }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="tab-bar w-fit" role="tablist">
        {tabs.map(t => (
          <button key={t.id} role="tab" aria-selected={active === t.id} className={`tab-item whitespace-nowrap ${active === t.id ? 'active' : ''}`}
            style={active === t.id ? { boxShadow: `inset 0 -2px 0 ${accent}` } : undefined} onClick={() => onChange(t.id)}>{t.label}</button>
        ))}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/** Real CSV download from in-memory rows. */
export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const head = rows.length ? Object.keys(rows[0]) : ['No data'];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [head.join(','), ...rows.map(r => head.map(h => esc(r[h] ?? '')).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export interface ReportDef { title: string; description: string; icon: ReactNode; rows: Record<string, string | number>[] }

export function ReportGrid({ reports, accent }: { reports: ReportDef[]; accent: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {reports.map(r => (
        <div key={r.title} className="card card-body flex flex-col gap-3">
          <div className="p-2.5 rounded-xl w-fit" style={{ background: `${accent}1A`, color: accent }}>{r.icon}</div>
          <div className="flex-1">
            <div className="font-bold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{r.title}</div>
            <p className="text-xs text-slate-500 mt-1">{r.description}</p>
            <p className="text-[11px] text-slate-400 mt-2">{r.rows.length} records · CSV</p>
          </div>
          <button className="btn-secondary w-fit" onClick={() => downloadCsv(r.title.replace(/\W+/g, '_').toLowerCase(), r.rows)} aria-label={`Download ${r.title}`}><Download size={14} /> Download</button>
        </div>
      ))}
    </div>
  );
}
