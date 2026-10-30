import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Section, { Field } from '../../../../components/projects/Section';
import Async from '../../../../components/projects/Async';
import KpiCard from '../../../../components/projects/KpiCard';
import ProgressBar from '../../../../components/projects/ProgressBar';
import DataTable from '../../../../components/projects/DataTable';
import Modal from '../../../../components/projects/Modal';
import FormField, { SelectInput, TextArea, TextInput } from '../../../../components/projects/FormField';
import { SkeletonBlock } from '../../../../components/projects/Skeleton';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { useImpact } from '../../../../hooks/useProjectData';
import { addImpactEntry } from '../../../../services/projectApi';
import { fmtDate, num, pct, todayISO } from '../../../../lib/format';
import { progressColor } from '../../../../lib/projectUi';
import type { ImpactKPI, NewImpactEntry } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

export default function ImpactTab({ project: p, reload }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const state = useImpact(p.id);
  const [adding, setAdding] = useState(false);
  return (
    <Async state={state} skeleton={<SkeletonBlock h="h-96" />}>{d => {
      const b = d.beneficiaries;
      const chart = d.kpis.map(k => ({ name: k.name.length > 22 ? k.name.slice(0, 20) + '…' : k.name, Target: 100, Achieved: pct(k.actual, k.target) }));
      return (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {d.kpis.slice(0, 4).map(k => { const v = pct(k.actual, k.target); return <KpiCard key={k.id} label={k.name} value={`${num(k.actual)}`} sub={`Target ${num(k.target)} ${k.unit} · ${v}%`} color={progressColor(v)} />; })}
          </div>
          <div className="grid lg:grid-cols-3 gap-5">
            <Section className="lg:col-span-2" title="Target vs Achieved (% of KPI target)" action={canEdit && <button type="button" className="btn-primary" onClick={() => setAdding(true)}><Plus size={15} /> Add impact entry</button>}>
              <div className="h-72" role="img" aria-label="KPI achievement versus target"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ bottom: 30 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis unit="%" tick={{ fontSize: 11 }} /><Tooltip /><Legend verticalAlign="top" />
                  <Bar dataKey="Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} /><Bar dataKey="Achieved" fill="#1AACB8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            </Section>
            <Section title="Beneficiary counts">
              <div className="flex flex-col gap-5">
                <div><div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-700">Direct</span><span className="text-slate-500">{num(b.directReached)} / {num(b.directTarget)}</span></div><ProgressBar value={pct(b.directReached, b.directTarget)} showLabel height={8} label="Direct beneficiaries reached" /></div>
                <div><div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-700">Indirect</span><span className="text-slate-500">{num(b.indirectReached)} / {num(b.indirectTarget)}</span></div><ProgressBar value={pct(b.indirectReached, b.indirectTarget)} showLabel height={8} color="#6366F1" label="Indirect beneficiaries reached" /></div>
                <p className="text-[11px] text-slate-400">Indirect reach is estimated from direct-beneficiary KPIs (≈ 4 family members per beneficiary).</p>
              </div>
            </Section>
          </div>
          <Section title="Beneficiary selection & data">
            <div className="grid md:grid-cols-3 gap-5"><Field label="Selection process">{d.selectionProcess}</Field><Field label="Data source">{d.dataSource}</Field><Field label="Special remark">{d.specialRemark}</Field></div>
          </Section>
          <Section title="Impact entries" flush>
            <DataTable caption="Impact entries" rows={d.entries} rowKey={e => e.id} emptyTitle="No impact entries yet" emptyMessage="Add the first reading to start tracking impact."
              columns={[{ key: 'd', header: 'Date', render: e => <span className="whitespace-nowrap">{fmtDate(e.date)}</span> }, { key: 'k', header: 'KPI', render: e => <span className="font-semibold">{e.kpiName}</span> },
                { key: 'v', header: 'Value', align: 'right', render: e => num(e.value) }, { key: 's', header: 'Source', render: e => e.source }, { key: 'n', header: 'Note', render: e => e.note }, { key: 'b', header: 'By', render: e => e.addedBy }]} />
          </Section>
          {adding && <EntryModal kpis={d.kpis} onClose={() => setAdding(false)} onSave={async v => { try { await addImpactEntry(p.id, v); toast.success('Impact entry added'); setAdding(false); await state.reload(true); await reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } }} />}
        </div>
      );
    }}</Async>
  );
}

function EntryModal({ kpis, onClose, onSave }: { kpis: ImpactKPI[]; onClose: () => void; onSave: (e: NewImpactEntry) => Promise<void> }) {
  const [f, setF] = useState({ kpiId: kpis[0]?.id ?? '', date: todayISO(), value: '', source: '', note: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const k = kpis.find(x => x.id === f.kpiId);
  const latest = k && ['%', 'rate', 'metres', '₹'].includes(k.unit);
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.kpiId) e.kpiId = 'Select a KPI';
    if (f.value === '' || !(Number(f.value) >= 0)) e.value = 'Enter a value ≥ 0';
    if (!f.date) e.date = 'Date is required';
    if (!f.source.trim()) e.source = 'Data source is required';
    setErr(e);
    if (!Object.keys(e).length) void onSave({ kpiId: f.kpiId, date: f.date, value: Number(f.value), source: f.source.trim(), note: f.note.trim() });
  };
  return (
    <Modal open title="Add impact entry" onClose={onClose} footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={submit}>Add entry</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="KPI" required error={err.kpiId} className="sm:col-span-2"><SelectInput value={f.kpiId} onChange={e => setF({ ...f, kpiId: e.target.value })}>{kpis.map(x => <option key={x.id} value={x.id}>{x.category} – {x.name}</option>)}</SelectInput></FormField>
        <FormField label={`Value${k ? ` (${k.unit})` : ''}`} required error={err.value} hint={latest ? 'Latest reading – replaces the current value' : 'Adds to the running total'}><TextInput type="number" min={0} value={f.value} onChange={e => setF({ ...f, value: e.target.value })} invalid={!!err.value} /></FormField>
        <FormField label="Date" required error={err.date}><TextInput type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} invalid={!!err.date} /></FormField>
        <FormField label="Data source" required error={err.source} className="sm:col-span-2"><TextInput value={f.source} onChange={e => setF({ ...f, source: e.target.value })} invalid={!!err.source} placeholder="e.g. Field survey" /></FormField>
        <FormField label="Note" className="sm:col-span-2"><TextArea rows={2} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></FormField>
      </div>
    </Modal>
  );
}
