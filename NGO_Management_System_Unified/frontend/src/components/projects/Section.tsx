import type { ReactNode } from 'react';

export default function Section({ title, action, children, flush = false, className = '' }: { title: string; action?: ReactNode; children: ReactNode; flush?: boolean; className?: string }) {
  return (
    <section className={`card ${className}`}>
      <div className="card-header flex-wrap gap-2"><h3 className="card-title">{title}</h3>{action}</div>
      <div className={flush ? '' : 'card-body'}>{children}</div>
    </section>
  );
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</div><div className="text-sm text-slate-700">{children || '—'}</div></div>
);
