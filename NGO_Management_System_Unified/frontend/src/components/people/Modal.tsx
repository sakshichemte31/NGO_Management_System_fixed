import { useEffect, type FormEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; title: string; onSubmit: () => void; submitLabel?: string; children: ReactNode }

/** Form modal: Enter / submit button calls onSubmit; Escape or backdrop closes. */
export default function Modal({ open, onClose, title, onSubmit, submitLabel = 'Save', children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(); };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} aria-hidden />
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-label={title} className="relative bg-white rounded-[14px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</h2>
          <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
