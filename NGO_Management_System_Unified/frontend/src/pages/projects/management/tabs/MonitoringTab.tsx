import { useState } from 'react';
import { Plus } from 'lucide-react';
import Section from '../../../../components/projects/Section';
import Async from '../../../../components/projects/Async';
import StatusBadge from '../../../../components/projects/StatusBadge';
import DataTable from '../../../../components/projects/DataTable';
import EmptyState from '../../../../components/projects/EmptyState';
import Modal from '../../../../components/projects/Modal';
import FormField, { SelectInput, TextArea, TextInput } from '../../../../components/projects/FormField';
import { SkeletonBlock } from '../../../../components/projects/Skeleton';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { useActivity, useRisks } from '../../../../hooks/useProjectData';
import { addRisk, updateRisk } from '../../../../services/projectApi';
import { fmtDate, fmtDateTime } from '../../../../lib/format';
import type { NewRisk, RiskIssue } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const CAT_COLOR: Record<string, string> = { Status: '#1AACB8', Task: '#6366F1', Budget: '#F59E0B', Document: '#64748B', Impact: '#10B981', Team: '#EC4899', Risk: '#EF4444', Department: '#8B5CF6' };
const SEV: RiskIssue['severity'][] = ['Low', 'Medium', 'High', 'Critical'];
const ST: RiskIssue['status'][] = ['Open', 'Mitigating', 'Resolved', 'Closed'];

export default function MonitoringTab({ project: p }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const act = useActivity(p.id), risks = useRisks(p.id);
  const [adding, setAdding] = useState(false);
  const [limit, setLimit] = useState(12);
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast.success(ok); await Promise.all([risks.reload(true), act.reload(true)]); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } };

  return (
    <div className="grid xl:grid-cols-5 gap-5">
      <Section className="xl:col-span-3 order-2 xl:order-1" title="Risks & Issues Register" flush action={canEdit && <button type="button" className="btn-primary" onClick={() => setAdding(true)}><Plus size={15} /> Add risk / issue</button>}>
        <Async state={risks} skeleton={<SkeletonBlock />}>{list => (
          <DataTable caption="Risks and issues" rows={list} rowKey={r => r.id} emptyTitle="No risks or issues logged"
            columns={[
              { key: 't', header: 'Title', render: r => <div className="min-w-[200px]"><div className="font-semibold text-slate-800">{r.title}</div><div className="text-xs text-slate-400 mt-0.5">{r.mitigation}</div></div> },
              { key: 'ty', header: 'Type', render: r => <span className="badge badge-gray">{r.type}</span> }, { key: 'sv', header: 'Severity', render: r => <StatusBadge status={r.severity} /> },
              { key: 'o', header: 'Owner', render: r => r.owner }, { key: 'd', header: 'Raised', render: r => <span className="whitespace-nowrap">{fmtDate(r.raisedOn)}</span> },
              { key: 's', header: 'Status', render: r => canEdit ? <select className="form-input !py-1 !text-xs !w-auto" aria-label={`Status of ${r.title}`} value={r.status} onChange={e => run(() => updateRisk(p.id, r.id, { status: e.target.value as RiskIssue['status'] }), 'Status updated')}>{ST.map(s => <option key={s}>{s}</option>)}</select> : <StatusBadge status={r.status} /> },
            ]} />
        )}</Async>
      </Section>

      <Section className="xl:col-span-2 order-1 xl:order-2" title="Activity Log">
        <Async state={act} skeleton={<SkeletonBlock />}>{list => list.length === 0 ? <EmptyState title="No activity yet" /> : (
          <>
            <ol className="relative border-l-2 border-slate-100 ml-2 flex flex-col gap-4">
              {list.slice(0, limit).map(a => (
                <li key={a.id} className="pl-5 relative">
                  <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: CAT_COLOR[a.category] }} />
                  <div className="text-[13px] text-slate-700">{a.message}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.actor} · {a.category} · {fmtDateTime(a.timestamp)}</div>
                </li>
              ))}
            </ol>
            {list.length > limit && <button type="button" className="btn-secondary mt-4 w-full justify-center" onClick={() => setLimit(l => l + 12)}>Show more ({list.length - limit})</button>}
          </>
        )}</Async>
      </Section>
      {adding && <RiskModal owner={p.managerName} onClose={() => setAdding(false)} onSave={async v => { await run(() => addRisk(p.id, v), 'Logged'); setAdding(false); }} />}
    </div>
  );
}

function RiskModal({ owner, onClose, onSave }: { owner: string; onClose: () => void; onSave: (r: NewRisk) => Promise<void> }) {
  const [f, setF] = useState<NewRisk>({ title: '', type: 'Risk', severity: 'Medium', owner, status: 'Open', mitigation: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Title is required';
    if (!f.owner.trim()) e.owner = 'Owner is required';
    setErr(e);
    if (!Object.keys(e).length) void onSave({ ...f, title: f.title.trim() });
  };
  return (
    <Modal open title="Add risk / issue" onClose={onClose} footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={submit}>Add</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Title" required error={err.title} className="sm:col-span-2"><TextInput value={f.title} onChange={e => setF({ ...f, title: e.target.value })} invalid={!!err.title} /></FormField>
        <FormField label="Type"><SelectInput value={f.type} onChange={e => setF({ ...f, type: e.target.value as NewRisk['type'] })}><option>Risk</option><option>Issue</option></SelectInput></FormField>
        <FormField label="Severity"><SelectInput value={f.severity} onChange={e => setF({ ...f, severity: e.target.value as NewRisk['severity'] })}>{SEV.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
        <FormField label="Owner" required error={err.owner}><TextInput value={f.owner} onChange={e => setF({ ...f, owner: e.target.value })} invalid={!!err.owner} /></FormField>
        <FormField label="Status"><SelectInput value={f.status} onChange={e => setF({ ...f, status: e.target.value as NewRisk['status'] })}>{ST.map(s => <option key={s}>{s}</option>)}</SelectInput></FormField>
        <FormField label="Mitigation / action" className="sm:col-span-2"><TextArea rows={2} value={f.mitigation} onChange={e => setF({ ...f, mitigation: e.target.value })} /></FormField>
      </div>
    </Modal>
  );
}
