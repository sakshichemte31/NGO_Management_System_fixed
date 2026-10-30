export default function ProgressBar({ value, color = '#1AACB8', height = 6, showLabel = false, label }: { value: number; color?: string; height?: number; showLabel?: boolean; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#E8EEF4', height }} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? 'Progress'}>
        <div className="h-full rounded-full transition-all" style={{ width: `${v}%`, background: color }} />
      </div>
      {showLabel && <span className="text-xs font-semibold text-slate-600 w-9 text-right">{v}%</span>}
    </div>
  );
}
