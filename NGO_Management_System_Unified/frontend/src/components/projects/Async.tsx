import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { AsyncState } from '../../hooks/useAsync';
import { SkeletonBlock } from './Skeleton';

/** Renders loading skeleton / error with retry / children(data). Empty handling is done by the child. */
export default function Async<T>({ state, skeleton, children }: { state: AsyncState<T>; skeleton?: ReactNode; children: (data: T) => ReactNode }) {
  if (state.loading && !state.data) return <>{skeleton ?? <SkeletonBlock />}</>;
  if (state.error && !state.data) return (
    <div className="card"><div className="card-body flex flex-col items-center text-center py-8 gap-2" role="alert">
      <AlertTriangle className="text-red-500" size={24} />
      <div className="text-sm font-semibold text-slate-700">Couldn’t load this section</div>
      <p className="text-[13px] text-slate-500">{state.error}</p>
      <button type="button" className="btn-secondary mt-1" onClick={() => void state.reload()}>Try again</button>
    </div></div>
  );
  return state.data ? <>{children(state.data)}</> : null;
}
