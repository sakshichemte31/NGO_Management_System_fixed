import { lazy, Suspense, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Archive, ArrowLeft, Calendar, CheckSquare, Edit2, IndianRupee, RotateCcw, User } from 'lucide-react';
import { useProject } from '../../../hooks/useProjects';
import { archiveProject, updateProject } from '../../../services/projectApi';
import { useRole } from '../../../context/RoleContext';
import { useToast } from '../../../components/projects/Toast';
import StatusBadge from '../../../components/projects/StatusBadge';
import ProgressBar from '../../../components/projects/ProgressBar';
import StageStepper from '../../../components/projects/StageStepper';
import ConfirmDialog from '../../../components/projects/ConfirmDialog';
import EditProjectModal from '../../../components/projects/EditProjectModal';
import EmptyState from '../../../components/projects/EmptyState';
import RoleSwitcher from '../../../components/projects/RoleSwitcher';
import { Skeleton, SkeletonBlock } from '../../../components/projects/Skeleton';
import { SECTOR_BADGE, STAGE_SHORT, progressColor } from '../../../lib/projectUi';
import { fmtDate, inrCompact } from '../../../lib/format';
import OverviewTab from './tabs/OverviewTab';
import type { TabProps } from './tabTypes';

const ObjectivesTab = lazy(() => import('./tabs/ObjectivesTab'));
const TimelineTab = lazy(() => import('./tabs/TimelineTab'));
const TeamTab = lazy(() => import('./tabs/TeamTab'));
const TasksTab = lazy(() => import('./tabs/TasksTab'));
const BudgetTab = lazy(() => import('./tabs/BudgetTab'));
const DepartmentsTab = lazy(() => import('./tabs/DepartmentsTab'));
const DocumentsTab = lazy(() => import('./tabs/DocumentsTab'));
const ImpactTab = lazy(() => import('./tabs/ImpactTab'));
const MonitoringTab = lazy(() => import('./tabs/MonitoringTab'));

const TABS: { key: string; label: string; C: React.ComponentType<TabProps> }[] = [
  { key: 'overview', label: 'Overview', C: OverviewTab },
  { key: 'objectives', label: 'Objectives & Outcomes', C: ObjectivesTab },
  { key: 'timeline', label: 'Timeline & Milestones', C: TimelineTab },
  { key: 'team', label: 'Team & Assignments', C: TeamTab },
  { key: 'tasks', label: 'Tasks & Progress', C: TasksTab },
  { key: 'budget', label: 'Budget & Expenses', C: BudgetTab },
  { key: 'departments', label: 'Departments', C: DepartmentsTab },
  { key: 'documents', label: 'Documents & Resources', C: DocumentsTab },
  { key: 'impact', label: 'Impact Tracking', C: ImpactTab },
  { key: 'monitoring', label: 'Monitoring', C: MonitoringTab },
];

export default function ProjectDetails() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { canEdit, isAdmin } = useRole();
  const toast = useToast();
  const state = useProject(id);
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [busy, setBusy] = useState(false);
  const p = state.data;
  const tabKey = TABS.some(t => t.key === params.get('tab')) ? params.get('tab')! : 'overview';
  const Active = TABS.find(t => t.key === tabKey)!.C;
  const quick = params.get('add');
  const go = (tab: string, add?: string) => setParams(add ? { tab, add } : { tab });
  const reload = () => state.reload(true);

  if (state.loading && !p) return <div className="flex flex-col gap-4"><Skeleton className="h-32 w-full" /><SkeletonBlock h="h-64" /></div>;
  if (!p) return (
    <div className="card"><EmptyState title="Project not found" message={state.error ?? 'This project does not exist or was removed.'} action={<Link to="/projects" className="btn-primary">Back to projects</Link>} /></div>
  );

  if (!isAdmin && p.status !== 'Active') return (
    <div className="card"><EmptyState title="Project not available" message="Project Managers can view active projects only." action={<Link to="/projects" className="btn-primary">Back to projects</Link>} /></div>
  );

  const archive = async () => {
    setBusy(true);
    try { await archiveProject(p.id); toast.success('Project archived'); setArchiving(false); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } finally { setBusy(false); }
  };
  const restore = async () => { try { await updateProject(p.id, { status: 'Completed' }); toast.success('Project restored'); await reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } };

  return (
    <div className="flex flex-col gap-5">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-teal-600 self-start"><ArrowLeft size={14} /> All projects</Link>

      <header className="card"><div className="card-body flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-bold text-slate-400">{p.code}</span>
              <span className={`badge ${SECTOR_BADGE[p.sector] ?? 'badge-gray'}`}>{p.sector}</span>
              <StatusBadge status={p.status} />
              <span className="badge badge-purple" title={STAGE_SHORT[p.currentStage]}>Stage {p.currentStage} · {STAGE_SHORT[p.currentStage]}</span>
            </div>
            <h1 className="page-title leading-tight">{p.name}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-1.5"><User size={14} /> {p.managerName}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> {fmtDate(p.startDate)} – {fmtDate(p.endDate)}</span>
              <span className="inline-flex items-center gap-1.5"><IndianRupee size={14} /> {inrCompact(p.spent)} of {inrCompact(p.totalBudget)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <RoleSwitcher />
            {canEdit && <>
              <button type="button" className="btn-secondary" onClick={() => go('tasks', 'task')}><CheckSquare size={15} /> Add task</button>
              <button type="button" className="btn-secondary" onClick={() => go('budget', 'expense')}><IndianRupee size={15} /> Log expense</button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(true)}><Edit2 size={15} /> Edit</button>
            </>}
            {isAdmin && (p.status === 'Archived'
              ? <button type="button" className="btn-secondary" onClick={restore}><RotateCcw size={15} /> Restore</button>
              : <button type="button" className="btn-secondary" onClick={() => setArchiving(true)}><Archive size={15} /> Archive</button>)}
          </div>
        </div>
        <div className="grid lg:grid-cols-[1fr_2fr] gap-4 items-center">
          <div><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Overall progress</div><ProgressBar value={p.progress} showLabel height={8} color={progressColor(p.progress)} label="Overall project progress" /></div>
          <StageStepper stages={p.plan.stages} current={p.currentStage} compact />
        </div>
      </div></header>

      <div className="tab-bar overflow-x-auto max-w-full" role="tablist" aria-label="Project sections">
        {TABS.map(t => (
          <button key={t.key} role="tab" aria-selected={tabKey === t.key} className={`tab-item whitespace-nowrap ${tabKey === t.key ? 'active' : ''}`} onClick={() => go(t.key)}>{t.label}</button>
        ))}
      </div>

      <div role="tabpanel">
        <Suspense fallback={<SkeletonBlock h="h-64" />}>
          <Active key={`${p.id}-${tabKey}`} project={p} reload={reload} quick={quick} onQuickHandled={() => setParams({ tab: tabKey }, { replace: true })} />
        </Suspense>
      </div>

      {editing && <EditProjectModal project={p} onClose={() => setEditing(false)} onSaved={reload} />}
      <ConfirmDialog open={archiving} title="Archive project?" danger busy={busy} confirmLabel="Archive" onCancel={() => setArchiving(false)} onConfirm={archive} message="The project will move to the Archive tab. You can restore it later." />
    </div>
  );
}
