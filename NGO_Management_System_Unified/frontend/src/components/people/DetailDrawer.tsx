import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; accent?: string }

/** Right slide-over used for every profile / detail view. */
export default function DetailDrawer({ open, onClose, title, subtitle, children, accent = '#1AACB8' }: Props) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) { setShown(false); return; }
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className={`absolute inset-0 bg-slate-900/40 transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} aria-hidden />
      <aside
        role="dialog" aria-modal="true" aria-label={title}
        className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-200 ${shown ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100" style={{ borderTop: `3px solid ${accent}` }}>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-800 truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={onClose} aria-label="Close panel"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}
