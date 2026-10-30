export const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} aria-hidden="true" />;

export const SkeletonCards = ({ n = 4 }: { n?: number }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="status" aria-label="Loading">
    {Array.from({ length: n }, (_, i) => <div key={i} className="stat-card"><Skeleton className="h-7 w-16" /><Skeleton className="h-3 w-24 mt-3" /></div>)}
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="card" role="status" aria-label="Loading">
    <div className="card-body flex flex-col gap-3">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
  </div>
);

export const SkeletonBlock = ({ h = 'h-40' }: { h?: string }) => <div className="card" role="status" aria-label="Loading"><div className="card-body"><Skeleton className={`${h} w-full`} /></div></div>;
