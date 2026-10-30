import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, Edit2, Eye, FolderKanban, LayoutGrid, List, RotateCcw, Search, X } from 'lucide-react';
import { useProjects, useManagers } from '../../../hooks/useProjects';
import { archiveProject, updateProject } from '../../../services/projectApi';
import { useRole } from '../../../context/RoleContext';
import { useToast } from '../../../components/projects/Toast';
import StatusBadge from '../../../components/projects/StatusBadge';
import ProgressBar from '../../../components/projects/ProgressBar';
import KpiCard from '../../../components/projects/KpiCard';
import DataTable, { type Column } from '../../../components/projects/DataTable';
import ConfirmDialog from '../../../components/projects/ConfirmDialog';
import EmptyState from '../../../components/projects/EmptyState';
import EditProjectModal from '../../../components/projects/EditProjectModal';
import RoleSwitcher from '../../../components/projects/RoleSwitcher';
import { SkeletonCards, SkeletonTable } from '../../../components/projects/Skeleton';
import { SECTORS } from '../../../data/mockProjects';
import { SECTOR_BADGE, SDG_NAMES, STAGE_SHORT, progressColor } from '../../../lib/projectUi';
import { fmtDate, inrCompact, inr } from '../../../lib/format';
import type { Project, ProjectFilters, ProjectStatus, StageNo } from '../../../types/project';

type Tab = NonNullable<ProjectFilters['tab']>;
const TABS: { key: Tab; label: string }[] = [{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'completed', label: 'Completed' }, { key: 'archive', label: 'Archive' }];

export default function AllProjects() {
  const nav = useNavigate();
  const toast = useToast();
  const { isAdmin } = useRole();
  const canEdit = isAdmin; // Project Managers get a read-only view of active projects
  const [params, setParams] = useSearchParams();
  const tab: Tab = isAdmin ? ((params.get('tab') as Tab) || 'all') : 'active';
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [sector, setSector] = useState('');
  const [sdg, setSdg] = useState<number | ''>('');
  const [stage, setStage] = useState<StageNo | ''>('');
  const [lead, setLead] = useState('');
  const [editing, setEditing] = useState<Project | null>(null);
  const [archiving, setArchiving] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);

  const filters = useMemo<ProjectFilters>(() => ({ tab, search, status, sector, sdg, stage, lead }), [tab, search, status, sector, sdg, stage, lead]);
  const list = useProjects(filters);
  const managers = useManagers().data ?? [];
  const stats = list.data?.stats;
  const hasFilter = !!(search || status || sector || sdg || stage !== '' || lead);
  const clear = () => { setSearch(''); setStatus(''); setSector(''); setSdg(''); setStage(''); setLead(''); };
  const refresh = () => list.reload(true);

  const doArchive = async () => {
    if (!archiving) return;
    setBusy(true);
    try { await archiveProject(archiving.id); toast.success(`“${archiving.name}” archived`); setArchiving(null); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Archive failed'); } finally { setBusy(false); }
  };
  const restore = async (p: Project) => {
    try { await updateProject(p.id, { status: 'Completed' }); toast.success(`“${p.name}” restored`); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Restore failed'); }
  };

  const actions = (p: Project) => (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <Link to={`/projects/${p.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50" aria-label={`View ${p.name}`} title="View"><Eye size={15} /></Link>
      {canEdit && <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" aria-label={`Edit ${p.name}`} title="Edit" onClick={() => setEditing(p)}><Edit2 size={15} /></button>}
      {isAdmin && (p.status === 'Archived'
        ? <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" aria-label={`Restore ${p.name}`} title="Restore" onClick={() => restore(p)}><RotateCcw size={15} /></button>
        : <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label={`Archive ${p.name}`} title="Archive" onClick={() => setArchiving(p)}><Archive size={15} /></button>)}
    </div>
  );

  const columns: Column<Project>[] = [
    { key: 'name', header: 'Project', render: p => (<div className="min-w-[220px]"><div className="font-semibold text-slate-800">{p.name}</div><div className="text-xs text-slate-400">{p.code} · {p.geographics.stage1}</div></div>) },
    { key: 'sector', header: 'Sector', render: p => <span className={`badge ${SECTOR_BADGE[p.sector] ?? 'badge-gray'}`}>{p.sector}</span> },
    { key: 'status', header: 'Status', render: p => <StatusBadge status={p.status} /> },
    { key: 'stage', header: 'Stage', render: p => <span className="badge badge-gray whitespace-nowrap" title={STAGE_SHORT[p.currentStage]}>Stage {p.currentStage}</span> },
    { key: 'progress', header: 'Progress', render: p => <div className="w-32"><ProgressBar value={p.progress} showLabel color={progressColor(p.progress)} label={`${p.name} progress`} /></div> },
    { key: 'manager', header: 'Lead', render: p => <span className="whitespace-nowrap">{p.managerName}</span> },
    { key: 'budget', header: 'Budget', align: 'right', render: p => <div className="whitespace-nowrap"><div className="font-semibold" title={inr(p.totalBudget)}>{inrCompact(p.totalBudget)}</div><div className="text-xs text-slate-400">{inrCompact(p.spent)} spent</div></div> },
    { key: 'dates', header: 'Dates', render: p => <span className="text-xs text-slate-500 whitespace-nowrap">{fmtDate(p.startDate)} – {fmtDate(p.endDate)}</span> },
    { key: 'actions', header: 'Actions', render: actions },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header !mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="page-title">Projects</h1><p className="page-subtitle">{isAdmin ? 'All projects across every stage — activated by an Admin after approval and planning' : 'Active projects you can follow and monitor'}</p></div>
        <div className="flex items-center gap-2 flex-wrap"><RoleSwitcher />
</div>
      </div>

      {list.loading && !stats ? <SkeletonCards n={5} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard label="Total Projects" value={stats?.total ?? 0} color="#1AACB8" icon={<FolderKanban size={18} />} />
          <KpiCard label="Active" value={stats?.active ?? 0} color="#10B981" />
          <KpiCard label="Upcoming" value={stats?.upcoming ?? 0} color="#6366F1" />
          <KpiCard label="Completed" value={stats?.completed ?? 0} color="#F59E0B" />
          <KpiCard label="On Hold" value={stats?.onHold ?? 0} color="#EF4444" sub={`${stats?.archived ?? 0} archived`} />
        </div>
      )}

      <div className="tab-bar self-start max-w-full overflow-x-auto" role="tablist">
        {(isAdmin ? TABS : TABS.filter(t => t.key === 'active')).map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab-item whitespace-nowrap ${tab === t.key ? 'active' : ''}`}
            onClick={() => setParams(t.key === 'all' ? {} : { tab: t.key })}>{t.label}</button>
        ))}
      </div>

      <div className="card"><div className="card-body flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by name, ID, lead or sector…" aria-label="Search projects" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 self-start" role="group" aria-label="View mode">
            <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')} className={`btn-secondary !px-3 ${view === 'table' ? '!bg-teal-50 !border-teal-300 !text-teal-700' : ''}`}><List size={15} /> Table</button>
            <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')} className={`btn-secondary !px-3 ${view === 'grid' ? '!bg-teal-50 !border-teal-300 !text-teal-700' : ''}`}><LayoutGrid size={15} /> Grid</button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          <select className={`form-input ${isAdmin ? '' : 'hidden'}`} aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value as ProjectStatus | '')}><option value="">All statuses</option>{['Active', 'Upcoming', 'On Hold', 'Completed', 'Archived'].map(s => <option key={s}>{s}</option>)}</select>
          <select className="form-input" aria-label="Filter by sector" value={sector} onChange={e => setSector(e.target.value)}><option value="">All sectors</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</select>
          <select className="form-input" aria-label="Filter by SDG" value={sdg} onChange={e => setSdg(e.target.value ? Number(e.target.value) : '')}><option value="">All SDGs</option>{Object.entries(SDG_NAMES).map(([n, name]) => <option key={n} value={n}>SDG {n} – {name}</option>)}</select>
          <select className="form-input" aria-label="Filter by stage" value={stage} onChange={e => setStage(e.target.value === '' ? '' : (Number(e.target.value) as StageNo))}><option value="">All stages</option>{[0, 1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Stage {s} – {STAGE_SHORT[s as StageNo]}</option>)}</select>
          <select className="form-input" aria-label="Filter by lead" value={lead} onChange={e => setLead(e.target.value)}><option value="">All leads</option>{managers.map(m => <option key={m.id}>{m.name}</option>)}</select>
          <button type="button" className="btn-secondary justify-center" onClick={clear} disabled={!hasFilter}><X size={14} /> Clear filters</button>
        </div>
      </div></div>

      {list.loading && !list.data ? <SkeletonTable /> : list.error ? (
        <div className="card"><EmptyState title="Couldn’t load projects" message={list.error} action={<button type="button" className="btn-secondary" onClick={() => void list.reload()}>Try again</button>} /></div>
      ) : view === 'table' ? (
        <div className="card overflow-hidden">
          <DataTable caption="Projects" columns={columns} rows={list.data?.items ?? []} rowKey={p => p.id} onRowClick={p => nav(`/projects/${p.id}`)}
            emptyTitle="No projects found" emptyMessage={hasFilter ? 'Try clearing a filter or searching for something else.' : 'Projects appear here once an Admin activates an approved, fully planned proposal.'} />
          <div className="px-5 py-3 text-xs text-slate-400 border-t border-slate-100">Showing {list.data?.total ?? 0} project(s)</div>
        </div>
      ) : (list.data?.items.length ?? 0) === 0 ? <div className="card"><EmptyState title="No projects found" message="Try clearing a filter." /></div> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.data!.items.map(p => (
            <div key={p.id} className="card hover:border-teal-300 transition-colors cursor-pointer" onClick={() => nav(`/projects/${p.id}`)}>
              <div className="card-body flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2"><div><div className="font-bold text-slate-800 leading-snug">{p.name}</div><div className="text-xs text-slate-400 mt-0.5">{p.code} · {p.managerName}</div></div><StatusBadge status={p.status} /></div>
                <div className="flex gap-2 flex-wrap"><span className={`badge ${SECTOR_BADGE[p.sector] ?? 'badge-gray'}`}>{p.sector}</span><span className="badge badge-gray">Stage {p.currentStage}</span>{p.sdgGoals.map(g => <span key={g} className="badge badge-teal">SDG {g}</span>)}</div>
                <ProgressBar value={p.progress} showLabel color={progressColor(p.progress)} label={`${p.name} progress`} />
                <div className="flex justify-between text-xs text-slate-500"><span>{inrCompact(p.spent)} / {inrCompact(p.totalBudget)}</span><span>{fmtDate(p.endDate)}</span></div>
                <div className="border-t border-slate-100 pt-2 -mb-1">{actions(p)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EditProjectModal key={editing?.id} project={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      <ConfirmDialog open={!!archiving} title="Archive project?" danger busy={busy} confirmLabel="Archive" onCancel={() => setArchiving(null)} onConfirm={doArchive}
        message={<>“{archiving?.name}” will move to the Archive tab and become read-only for most users. You can restore it later.</>} />
    </div>
  );
}
