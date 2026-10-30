import { useState } from 'react';
import { ArrowRight, Edit2 } from 'lucide-react';
import Section, { Field } from '../../../../components/projects/Section';
import Modal from '../../../../components/projects/Modal';
import FormField, { SelectInput, TextArea, TextInput } from '../../../../components/projects/FormField';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { updateProject } from '../../../../services/projectApi';
import { SDG_NAMES } from '../../../../lib/projectUi';
import { fmtDate } from '../../../../lib/format';
import type { CurrentStatus, Project } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const STATUSES: CurrentStatus[] = ['Ideation', 'Pilot', 'Seed', 'Scale'];

export default function OverviewTab({ project: p, reload }: TabProps) {
  const { canEdit } = useRole();
  const [edit, setEdit] = useState(false);
  const g = p.geographics;
  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <Section className="lg:col-span-2" title="Project Overview" action={canEdit && <button type="button" className="btn-secondary" onClick={() => setEdit(true)}><Edit2 size={14} /> Edit overview</button>}>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Sector">{p.sector}</Field>
          <Field label="Project Active Since">{fmtDate(p.activeSince)}</Field>
          <div className="sm:col-span-2"><Field label="Why">{p.why}</Field></div>
          <div className="sm:col-span-2"><Field label="Problem Statement">{p.problemStatement}</Field></div>
          <div className="sm:col-span-2"><Field label="Duration">{p.durationMonths} months ({fmtDate(p.startDate)} – {fmtDate(p.endDate)})</Field></div>
        </div>
      </Section>

      <div className="flex flex-col gap-5">
        <Section title="Current Status">
          <ol className="flex flex-col gap-2" aria-label="Current status">
            {STATUSES.map(s => (
              <li key={s} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold border ${p.currentStatus === s ? 'bg-teal-50 border-teal-300 text-teal-700' : 'bg-white border-slate-200 text-slate-400'}`} aria-current={p.currentStatus === s}>
                <span className={`w-2 h-2 rounded-full ${p.currentStatus === s ? 'bg-teal-500' : 'bg-slate-300'}`} />{s}
              </li>
            ))}
          </ol>
        </Section>
        <Section title="SDG Goal Alignment">
          <div className="flex flex-col gap-2">{p.sdgGoals.map(n => <div key={n} className="flex items-center gap-2 text-sm"><span className="badge badge-teal">SDG {n}</span><span className="text-slate-600">{SDG_NAMES[n]}</span></div>)}</div>
        </Section>
      </div>

      <Section className="lg:col-span-3" title="Geographics – rollout">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {[['Stage 1', g.stage1], ['Stage 2', g.stage2], ['Stage 3', g.stage3]].map(([k, v], i) => (
            <div key={k} className="flex items-center gap-3 flex-1">
              <div className="flex-1 rounded-xl border border-slate-200 p-3"><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{k}</div><div className="text-sm font-semibold text-slate-700 mt-0.5">{v}</div></div>
              {i < 2 && <ArrowRight size={16} className="text-slate-300 hidden md:block" />}
            </div>
          ))}
        </div>
      </Section>
      {edit && <EditOverview project={p} onClose={() => setEdit(false)} onSaved={reload} />}
    </div>
  );
}

function EditOverview({ project, onClose, onSaved }: { project: Project; onClose: () => void; onSaved: () => Promise<void> }) {
  const toast = useToast();
  const [f, setF] = useState({ why: project.why, problemStatement: project.problemStatement, currentStatus: project.currentStatus, sdg: project.sdgGoals.join(', '), ...project.geographics });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.why.trim()) e.why = 'Required';
    if (!f.problemStatement.trim()) e.problemStatement = 'Required';
    const sdgs = f.sdg.split(',').map(s => s.trim()).filter(Boolean).map(Number);
    if (!sdgs.length || sdgs.some(n => !Number.isInteger(n) || n < 1 || n > 17)) e.sdg = 'Enter goal numbers 1–17, comma separated';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await updateProject(project.id, { why: f.why, problemStatement: f.problemStatement, currentStatus: f.currentStatus, sdgGoals: Array.from(new Set(sdgs)), geographics: { stage1: f.stage1, stage2: f.stage2, stage3: f.stage3 } });
      toast.success('Overview updated'); await onSaved(); onClose();
    } catch (x) { toast.error(x instanceof Error ? x.message : 'Failed'); } finally { setBusy(false); }
  };
  return (
    <Modal open title="Edit overview" onClose={onClose} size="lg" footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Why" required error={err.why} className="sm:col-span-2"><TextArea value={f.why} onChange={e => setF({ ...f, why: e.target.value })} invalid={!!err.why} /></FormField>
        <FormField label="Problem statement" required error={err.problemStatement} className="sm:col-span-2"><TextArea value={f.problemStatement} onChange={e => setF({ ...f, problemStatement: e.target.value })} invalid={!!err.problemStatement} /></FormField>
        <FormField label="Current status"><SelectInput value={f.currentStatus} onChange={e => setF({ ...f, currentStatus: e.target.value as CurrentStatus })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
        <FormField label="SDG goals (numbers)" error={err.sdg} hint="e.g. 4, 10"><TextInput value={f.sdg} onChange={e => setF({ ...f, sdg: e.target.value })} invalid={!!err.sdg} /></FormField>
        <FormField label="Geographics – Stage 1"><TextInput value={f.stage1} onChange={e => setF({ ...f, stage1: e.target.value })} /></FormField>
        <FormField label="Geographics – Stage 2"><TextInput value={f.stage2} onChange={e => setF({ ...f, stage2: e.target.value })} /></FormField>
        <FormField label="Geographics – Stage 3"><TextInput value={f.stage3} onChange={e => setF({ ...f, stage3: e.target.value })} /></FormField>
      </div>
    </Modal>
  );
}
