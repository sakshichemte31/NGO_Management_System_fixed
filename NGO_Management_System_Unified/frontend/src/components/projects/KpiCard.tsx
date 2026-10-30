import type { ReactNode } from 'react';

export default function KpiCard({ label, value, sub, color = '#1AACB8', icon }: { label: string; value: ReactNode; sub?: ReactNode; color?: string; icon?: ReactNode }) {
  return (
    <div className="stat-card" style={{ padding: '16px 18px' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-2xl font-extrabold truncate" style={{ color, fontFamily: 'Nunito, sans-serif' }}>{value}</div>
          <div className="text-xs text-slate-500 mt-1">{label}</div>
          {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
        </div>
        {icon && <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}1A`, color }}>{icon}</div>}
      </div>
    </div>
  );
}
