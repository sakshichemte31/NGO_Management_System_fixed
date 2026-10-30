import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', hint, action }: { title?: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="p-3 rounded-full bg-slate-100 text-slate-400 mb-3"><Inbox size={20} /></div>
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {hint && <div className="text-xs text-slate-500 mt-1 max-w-xs">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
