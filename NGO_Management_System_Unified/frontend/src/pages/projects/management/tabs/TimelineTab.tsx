import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Section from '../../../../components/projects/Section';
import StageStepper from '../../../../components/projects/StageStepper';
import StatusBadge from '../../../../components/projects/StatusBadge';
import ProgressBar from '../../../../components/projects/ProgressBar';
import DataTable from '../../../../components/projects/DataTable';
import Modal from '../../../../components/projects/Modal';
import FormField, { SelectInput, TextInput } from '../../../../components/projects/FormField';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { addMilestone, updateMilestone, updateStageProgress } from '../../../../services/projectApi';
import { fmtDate } from '../../../../lib/format';
import type { Milestone, StageNo } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const MS_STATUS: Milestone['status'][] = ['Pending', 'In Progress', 'Done', 'Delayed'];
const STAGE_COLOR = { Completed: '#10B981', 'In Progress': '#1AACB8', Upcoming: '#CBD5E1' } as const;
const MS_COLOR: Record<Milestone['status'], string> = { Done: '#10B981', 'In Progress': '#1AACB8', Pending: '#94A3B8', Delayed: '#EF4444' };

export default function TimelineTab({ project: p, reload }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const [sel, setSel] = useState<StageNo>(p.currentStage);
  const [adding, setAdding] = useState(false);
  const stage = p.plan.stages.find(s => s.stage === sel)!;
  const [prog, setProg] = useState(stage.progress);
  useEffect(() => setProg(stage.progress), [stage.progress, sel]);

  const t0 = new Date(p.startDate).getTime(), t1 = new Date(p.endDate).getTime(), span = Math.max(1, t1 - t0);
  const pos = (d: string) => Math.max(0, Math.min(100, ((new Date(d).getTime() - t0) / span) * 100));
  const today = pos(new Date().toISOString().slice(0, 10));
  const nowInRange = Date.now() >= t0 && Date.now() <= t1;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); await reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); }
  };

  return (
    <div className="flex flex-col gap-5">
      <Section title="Stage 0–5 Journey">
        <StageStepper stages={p.plan.stages} current={p.currentStage} onSelect={setSel} />
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1"><span className="font-bold text-slate-800">Stage {stage.stage}: {stage.title}</span><StatusBadge status={stage.status === 'Completed' ? 'Done' : stage.status} /></div>
            <p className="text-sm text-slate-500">{stage.description}</p>
            <p className="text-xs text-slate-400 mt-1">{fmtDate(stage.startDate)} – {fmtDate(stage.endDate)}</p>
          </div>
          <div className="md:w-72">
            <ProgressBar value={prog} showLabel height={8} label={`Stage ${stage.stage} progress`} />
            {canEdit && stage.status === 'In Progress' && (
              <div className="flex items-center gap-2 mt-2">
                <input type="range" min={0} max={100} step={5} value={prog} onChange={e => setProg(Number(e.target.value))} className="flex-1 accent-teal-500" aria-label="Set stage progress" />
                <button type="button" className="btn-secondary !py-1 !px-3" onClick={() => run(() => updateStageProgress(p.id, stage.stage, prog), 'Stage progress saved')}>Save</button>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="Timeline (Gantt view)">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex justify-between text-[11px] text-slate-400 mb-2 pl-40"><span>{fmtDate(p.startDate)}</span><span>{fmtDate(p.endDate)}</span></div>
            <div className="relative flex flex-col gap-2">
              {p.plan.stages.map(s => (
                <div key={s.stage} className="flex items-center gap-3">
                  <div className="w-37 w-[148px] text-[12px] text-slate-600 truncate flex-shrink-0" title={s.title}>Stage {s.stage} · {s.title.split(' ').slice(0, 2).join(' ')}</div>
                  <div className="relative flex-1 h-6 bg-slate-100 rounded">
                    <div className="absolute top-0 h-6 rounded flex items-center overflow-hidden" title={`${fmtDate(s.startDate)} – ${fmtDate(s.endDate)} · ${s.progress}%`}
                      style={{ left: `${pos(s.startDate)}%`, width: `${Math.max(2, pos(s.endDate) - pos(s.startDate))}%`, background: `${STAGE_COLOR[s.status]}55` }}>
                      <div className="h-full" style={{ width: `${s.progress}%`, background: STAGE_COLOR[s.status] }} />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <div className="w-[148px] text-[12px] font-semibold text-slate-600 flex-shrink-0">Milestones</div>
                <div className="relative flex-1 h-6">
                  {p.plan.milestones.map(m => (
                    <span key={m.id} className="absolute top-1 w-3.5 h-3.5 rotate-45 rounded-sm border-2 border-white shadow" title={`${m.title} · ${fmtDate(m.dueDate)} · ${m.status}`} style={{ left: `calc(${pos(m.dueDate)}% - 7px)`, background: MS_COLOR[m.status] }} />
                  ))}
                </div>
              </div>
              {nowInRange && <div className="absolute top-0 bottom-0 w-px bg-red-400 pointer-events-none" style={{ left: `calc(148px + 0.75rem + (100% - 148px - 0.75rem) * ${today / 100})` }} title="Today"><span className="absolute -top-4 -translate-x-1/2 text-[10px] text-red-500 font-semibold">Today</span></div>}
            </div>
            <div className="flex gap-4 mt-4 pl-40 text-[11px] text-slate-500 flex-wrap">
              {Object.entries(STAGE_COLOR).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: c }} />{k}</span>)}
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rotate-45" style={{ background: MS_COLOR.Done }} />Milestone</span>
            </div>
          </div>
        </div>
      </Section>

      <Section title={`Milestones (${p.plan.milestones.length})`} flush action={canEdit && <button type="button" className="btn-primary" onClick={() => setAdding(true)}><Plus size={15} /> Add milestone</button>}>
        <DataTable caption="Milestones" rows={[...p.plan.milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate))} rowKey={m => m.id} emptyTitle="No milestones yet"
          columns={[
            { key: 'title', header: 'Milestone', render: m => <span className="font-semibold text-slate-800">{m.title}</span> },
            { key: 'stage', header: 'Stage', render: m => `Stage ${m.stage}` },
            { key: 'due', header: 'Due', render: m => <span className="whitespace-nowrap">{fmtDate(m.dueDate)}</span> },
            { key: 'owner', header: 'Owner', render: m => m.owner },
            { key: 'status', header: 'Status', render: m => canEdit
              ? <select className="form-input !py-1 !w-auto !text-xs" aria-label={`Status of ${m.title}`} value={m.status} onChange={e => run(() => updateMilestone(p.id, m.id, { status: e.target.value as Milestone['status'] }), 'Milestone updated')}>{MS_STATUS.map(s => <option key={s}>{s}</option>)}</select>
              : <StatusBadge status={m.status} /> },
          ]} />
      </Section>
      {adding && <AddMilestone projectId={p.id} start={p.startDate} end={p.endDate} owner={p.managerName} onClose={() => setAdding(false)} onSaved={reload} />}
    </div>
  );
}

function AddMilestone({ projectId, start, end, owner, onClose, onSaved }: { projectId: string; start: string; end: string; owner: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [f, setF] = useState({ title: '', stage: 3 as StageNo, dueDate: start, owner, status: 'Pending' as Milestone['status'] });
  const [err, setErr] = useState<Record<string, string>>({});
  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Title is required';
    if (!f.dueDate) e.dueDate = 'Due date is required';
    else if (f.dueDate < start || f.dueDate > end) e.dueDate = `Must be within ${fmtDate(start)} – ${fmtDate(end)}`;
    if (!f.owner.trim()) e.owner = 'Owner is required';
    setErr(e);
    if (Object.keys(e).length) return;
    try { await addMilestone(projectId, f); toast.success('Milestone added'); await onSaved(); onClose(); } catch (x) { toast.error(x instanceof Error ? x.message : 'Failed'); }
  };
  return (
    <Modal open title="Add milestone" onClose={onClose} footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save}>Add milestone</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Title" required error={err.title} className="sm:col-span-2"><TextInput value={f.title} onChange={e => setF({ ...f, title: e.target.value })} invalid={!!err.title} /></FormField>
        <FormField label="Stage"><SelectInput value={f.stage} onChange={e => setF({ ...f, stage: Number(e.target.value) as StageNo })}>{[0, 1, 2, 3, 4, 5].map(s => <option key={s} value={s}>Stage {s}</option>)}</SelectInput></FormField>
        <FormField label="Due date" required error={err.dueDate}><TextInput type="date" value={f.dueDate} onChange={e => setF({ ...f, dueDate: e.target.value })} invalid={!!err.dueDate} /></FormField>
        <FormField label="Owner" required error={err.owner}><TextInput value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} invalid={!!err.owner} /></FormField>
        <FormField label="Status"><SelectInput value={f.status} onChange={e => setF({ ...f, status: e.target.value as Milestone['status'] })}>{MS_STATUS.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
      </div>
    </Modal>
  );
}
