import { useEffect, useState } from 'react';
import { Edit2, LayoutGrid, List, Plus, Trash2 } from 'lucide-react';
import Section from '../../../../components/projects/Section';
import Async from '../../../../components/projects/Async';
import StatusBadge from '../../../../components/projects/StatusBadge';
import ProgressBar from '../../../../components/projects/ProgressBar';
import KpiCard from '../../../../components/projects/KpiCard';
import DataTable from '../../../../components/projects/DataTable';
import Modal from '../../../../components/projects/Modal';
import ConfirmDialog from '../../../../components/projects/ConfirmDialog';
import EmptyState from '../../../../components/projects/EmptyState';
import FormField, { SelectInput, TextArea, TextInput } from '../../../../components/projects/FormField';
import { SkeletonTable } from '../../../../components/projects/Skeleton';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { useTasks } from '../../../../hooks/useProjectData';
import { createTask, deleteTask, updateTask } from '../../../../services/projectApi';
import { DEPARTMENTS, deptName } from '../../../../data/departmentTemplates';
import { fmtDate, pct, todayISO } from '../../../../lib/format';
import { progressColor } from '../../../../lib/projectUi';
import type { NewTask, Priority, StageNo, Task, TaskStatus } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const COLS: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const COL_COLOR: Record<TaskStatus, string> = { 'To Do': '#94A3B8', 'In Progress': '#1AACB8', Review: '#8B5CF6', Done: '#10B981' };

export default function TasksTab({ project: p, reload, quick, onQuickHandled }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const state = useTasks(p.id);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [form, setForm] = useState<{ task: Task | null } | null>(null);
  const [del, setDel] = useState<Task | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => { if (quick === 'task' && canEdit) { setForm({ task: null }); onQuickHandled?.(); } }, [quick]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); await state.reload(true); await reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };
  const move = (t: Task, status: TaskStatus) => { if (t.status !== status) void run(() => updateTask(p.id, t.id, { status }), `Moved to ${status}`); };

  return (
    <Async state={state} skeleton={<SkeletonTable />}>{tasks => {
      const done = tasks.filter(t => t.status === 'Done').length, today = todayISO();
      const overdue = tasks.filter(t => t.status !== 'Done' && t.dueDate < today).length;
      const rollup = pct(done, tasks.length);
      const card = (t: Task) => (
        <div key={t.id} draggable={canEdit} onDragStart={() => setDragId(t.id)} onDragEnd={() => setDragId(null)}
          className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${canEdit ? 'cursor-grab' : ''} ${dragId === t.id ? 'opacity-50' : ''}`}>
          <div className="flex items-start justify-between gap-2"><div className="text-[13px] font-semibold text-slate-800 leading-snug">{t.title}</div><StatusBadge status={t.priority} /></div>
          <div className="text-xs text-slate-400 mt-1.5">{t.owner} · {deptName(t.department)}</div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className={t.status !== 'Done' && t.dueDate < today ? 'text-red-600 font-semibold' : 'text-slate-500'}>Due {fmtDate(t.dueDate)}</span><span className="badge badge-gray">Stage {t.stage}</span>
          </div>
          {canEdit && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-100">
              <select className="form-input !py-1 !text-xs flex-1" aria-label={`Move ${t.title}`} value={t.status} onChange={e => move(t, e.target.value as TaskStatus)}>{COLS.map(c => <option key={c}>{c}</option>)}</select>
              <button type="button" className="p-1.5 text-slate-400 hover:text-blue-600" aria-label={`Edit ${t.title}`} onClick={() => setForm({ task: t })}><Edit2 size={14} /></button>
              <button type="button" className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`Delete ${t.title}`} onClick={() => setDel(t)}><Trash2 size={14} /></button>
            </div>
          )}
        </div>
      );
      const byDept = DEPARTMENTS.map(d => { const l = tasks.filter(t => t.department === d.key); return { d, total: l.length, done: l.filter(t => t.status === 'Done').length }; }).filter(x => x.total);
      return (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total tasks" value={tasks.length} color="#1AACB8" />
            <KpiCard label="Completed" value={done} color="#10B981" />
            <KpiCard label="Overdue" value={overdue} color={overdue ? '#EF4444' : '#94A3B8'} />
            <KpiCard label="Task roll-up" value={`${rollup}%`} color={progressColor(rollup)} sub="Done ÷ total tasks" />
          </div>
          <Section title="Tasks" flush action={
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-1" role="group" aria-label="View mode">
                <button type="button" aria-pressed={view === 'kanban'} className={`btn-secondary !px-3 ${view === 'kanban' ? '!bg-teal-50 !border-teal-300 !text-teal-700' : ''}`} onClick={() => setView('kanban')}><LayoutGrid size={14} /> Kanban</button>
                <button type="button" aria-pressed={view === 'list'} className={`btn-secondary !px-3 ${view === 'list' ? '!bg-teal-50 !border-teal-300 !text-teal-700' : ''}`} onClick={() => setView('list')}><List size={14} /> List</button>
              </div>
              {canEdit && <button type="button" className="btn-primary" onClick={() => setForm({ task: null })}><Plus size={15} /> Add task</button>}
            </div>}>
            {tasks.length === 0 ? <EmptyState title="No tasks yet" message="Create the first task for this project." action={canEdit ? <button type="button" className="btn-primary" onClick={() => setForm({ task: null })}>Add task</button> : undefined} />
              : view === 'kanban' ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 p-4">
                  {COLS.map(c => {
                    const list = tasks.filter(t => t.status === c);
                    return (
                      <div key={c} className="rounded-xl bg-slate-50 p-3 min-h-[160px]" onDragOver={e => canEdit && e.preventDefault()}
                        onDrop={() => { const t = tasks.find(x => x.id === dragId); if (t && canEdit) move(t, c); setDragId(null); }}>
                        <div className="flex items-center gap-2 mb-3"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COL_COLOR[c] }} /><span className="text-[13px] font-bold text-slate-700">{c}</span><span className="badge badge-gray ml-auto">{list.length}</span></div>
                        <div className="flex flex-col gap-2.5">{list.map(card)}{list.length === 0 && <div className="text-xs text-slate-400 text-center py-6">Drop tasks here</div>}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <DataTable caption="Tasks" rows={tasks} rowKey={t => t.id}
                  columns={[
                    { key: 'title', header: 'Task', render: t => <span className="font-semibold text-slate-800">{t.title}</span> },
                    { key: 'owner', header: 'Owner', render: t => t.owner }, { key: 'dept', header: 'Department', render: t => deptName(t.department) },
                    { key: 'stage', header: 'Stage', render: t => `Stage ${t.stage}` }, { key: 'pr', header: 'Priority', render: t => <StatusBadge status={t.priority} /> },
                    { key: 'due', header: 'Due', render: t => <span className="whitespace-nowrap">{fmtDate(t.dueDate)}</span> }, { key: 'st', header: 'Status', render: t => <StatusBadge status={t.status} /> },
                    ...(canEdit ? [{ key: 'a', header: '', render: (t: Task) => <span className="flex gap-1"><button type="button" className="p-1.5 text-slate-400 hover:text-blue-600" aria-label={`Edit ${t.title}`} onClick={() => setForm({ task: t })}><Edit2 size={14} /></button><button type="button" className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`Delete ${t.title}`} onClick={() => setDel(t)}><Trash2 size={14} /></button></span> }] : []),
                  ]} />
              )}
          </Section>
          {byDept.length > 0 && (
            <Section title="Progress roll-up by department">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                {byDept.map(x => <div key={x.d.key}><div className="flex justify-between text-[13px] mb-1"><span className="font-semibold text-slate-700">{x.d.name}</span><span className="text-slate-400">{x.done}/{x.total} done</span></div><ProgressBar value={pct(x.done, x.total)} showLabel color={x.d.color} label={`${x.d.name} tasks`} /></div>)}
              </div>
            </Section>
          )}
          {form && <TaskModal task={form.task} defaultOwner={p.managerName} defaultStage={p.currentStage} onClose={() => setForm(null)}
            onSave={async v => { await run(() => (form.task ? updateTask(p.id, form.task.id, v) : createTask(p.id, v)), form.task ? 'Task updated' : 'Task created'); setForm(null); }} />}
          <ConfirmDialog open={!!del} title="Delete task?" danger confirmLabel="Delete" onCancel={() => setDel(null)} message={<>“{del?.title}” will be permanently removed.</>}
            onConfirm={async () => { if (del) await run(() => deleteTask(p.id, del.id), 'Task deleted'); setDel(null); }} />
        </div>
      );
    }}</Async>
  );
}

function TaskModal({ task, defaultOwner, defaultStage, onClose, onSave }: { task: Task | null; defaultOwner: string; defaultStage: StageNo; onClose: () => void; onSave: (t: NewTask) => Promise<void> }) {
  const [f, setF] = useState<NewTask>(() => task ? { ...task } : { title: '', description: '', owner: defaultOwner, department: 'operations', stage: defaultStage, priority: 'Medium', dueDate: '', status: 'To Do' });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Title is required';
    if (!f.owner.trim()) e.owner = 'Owner is required';
    if (!f.dueDate) e.dueDate = 'Due date is required';
    setErr(e);
    if (!Object.keys(e).length) { const { id: _i, projectId: _p, ...rest } = f as NewTask & { id?: string; projectId?: string }; void onSave({ ...rest, title: f.title.trim() }); }
  };
  return (
    <Modal open title={task ? 'Edit task' : 'Add task'} onClose={onClose} size="lg" footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={submit}>{task ? 'Save changes' : 'Create task'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Title" required error={err.title} className="sm:col-span-2"><TextInput value={f.title} onChange={e => setF({ ...f, title: e.target.value })} invalid={!!err.title} /></FormField>
        <FormField label="Description" className="sm:col-span-2"><TextArea rows={2} value={f.description ?? ''} onChange={e => setF({ ...f, description: e.target.value })} /></FormField>
        <FormField label="Owner" required error={err.owner}><TextInput value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} invalid={!!err.owner} /></FormField>
        <FormField label="Department"><SelectInput value={f.department} onChange={e => setF({ ...f, department: e.target.value as NewTask['department'] })}>{DEPARTMENTS.map(d => <option key={d.key} value={d.key}>{d.name}</option>)}</SelectInput></FormField>
        <FormField label="Stage"><SelectInput value={f.stage} onChange={e => setF({ ...f, stage: Number(e.target.value) as StageNo })}>{[0, 1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Stage {s}</option>)}</SelectInput></FormField>
        <FormField label="Priority"><SelectInput value={f.priority} onChange={e => setF({ ...f, priority: e.target.value as Priority })}>{PRIORITIES.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
        <FormField label="Due date" required error={err.dueDate}><TextInput type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} invalid={!!err.dueDate} /></FormField>
        <FormField label="Status"><SelectInput value={f.status} onChange={e => setF({ ...f, status: e.target.value as TaskStatus })}>{COLS.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
      </div>
    </Modal>
  );
}
