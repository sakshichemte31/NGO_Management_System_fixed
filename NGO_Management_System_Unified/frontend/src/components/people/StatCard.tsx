import type { ReactNode } from 'react';

interface Props { label: string; value: string | number; icon: ReactNode; color: string }

/** Compact metric panel shared across the management dashboards. */
export default function StatCard({ label, value, icon, color }: Props) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div className="p-2.5 rounded-xl shrink-0" style={{ background: `${color}1A`, color }}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xl font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{value}</div>
        <div className="text-xs text-slate-500 truncate">{label}</div>
      </div>
    </div>
  );
}
