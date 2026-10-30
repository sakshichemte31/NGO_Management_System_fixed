import { useState } from 'react';
import { ExternalLink, Plus, UserMinus, Trash2 } from 'lucide-react';
import Section from '../../../../components/projects/Section';
import DataTable from '../../../../components/projects/DataTable';
import Modal from '../../../../components/projects/Modal';
import ConfirmDialog from '../../../../components/projects/ConfirmDialog';
import KpiCard from '../../../../components/projects/KpiCard';
import FormField, { SelectInput, TextInput } from '../../../../components/projects/FormField';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { addPartner, assignTeamMember, removePartner, unassignTeamMember } from '../../../../services/projectApi';
import { inr, num } from '../../../../lib/format';
import type { Partner, TeamMember } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const GROUPS: TeamMember['group'][] = ['Core', 'Advisory', 'Working'];
const PARTNER_TYPES: Partner['type'][] = ['Organisation', 'NGO', 'Research Body', 'Government Body'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TeamTab({ project: p, reload }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const t = p.plan.team;
  const [assign, setAssign] = useState<TeamMember['group'] | null>(null);
  const [remove, setRemove] = useState<TeamMember | null>(null);
  const [addP, setAddP] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast.success(ok); await reload(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } };
  const key = t.stakeholders.filter(s => s.type === 'Key'), other = t.stakeholders.filter(s => s.type === 'Other');

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total staff" value={num(t.totalStaff)} color="#1AACB8" />
        <KpiCard label="Total salaries per year (A)" value={inr(t.totalSalariesA)} color="#10B981" />
        <KpiCard label="Total volunteers" value={num(t.totalVolunteers)} color="#6366F1" />
        <KpiCard label="Team members assigned" value={t.members.length} color="#F59E0B" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {GROUPS.map(g => (
          <Section key={g} title={`${g} team`} action={canEdit && <button type="button" className="btn-secondary !py-1.5" onClick={() => setAssign(g)}><Plus size={14} /> Assign</button>}>
            <p className="text-xs text-slate-400 mb-3">{t.descriptions[g.toLowerCase() as 'core' | 'advisory' | 'working']}</p>
            <ul className="flex flex-col gap-2">
              {t.members.filter(m => m.group === g).map(m => (
                <li key={m.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <span className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{m.name.split(' ').map(x => x[0]).slice(0, 2).join('')}</span>
                  <div className="min-w-0 flex-1"><div className="text-sm font-semibold text-slate-700 truncate">{m.name}</div><div className="text-xs text-slate-400 truncate">{m.role}{m.organisation ? ` · ${m.organisation}` : ''}</div></div>
                  {canEdit && <button type="button" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" aria-label={`Unassign ${m.name}`} title="Unassign" onClick={() => setRemove(m)}><UserMinus size={15} /></button>}
                </li>
              ))}
              {t.members.every(m => m.group !== g) && <li className="text-sm text-slate-400 py-2">No one assigned yet.</li>}
            </ul>
          </Section>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Key Stakeholders">
          <ul className="flex flex-col gap-2 mb-4">{key.map(s => <li key={s.id} className="flex justify-between text-sm"><span className="font-semibold text-slate-700">{s.name}</span><span className="text-slate-400">{s.organisation}</span></li>)}{key.length === 0 && <li className="text-sm text-slate-400">None listed.</li>}</ul>
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Other stakeholders</div>
          <ul className="flex flex-col gap-1.5">{other.map(s => <li key={s.id} className="flex justify-between text-sm"><span className="text-slate-600">{s.name}</span><span className="text-slate-400">{s.organisation}</span></li>)}{other.length === 0 && <li className="text-sm text-slate-400">None listed.</li>}</ul>
        </Section>
        <Section title="Working Partners" flush action={canEdit && <button type="button" className="btn-secondary !py-1.5" onClick={() => setAddP(true)}><Plus size={14} /> Add partner</button>}>
          <DataTable caption="Working partners" rows={t.partners} rowKey={x => x.id} emptyTitle="No working partners"
            columns={[
              { key: 'name', header: 'Organisation', render: x => <span className="font-semibold">{x.name}</span> },
              { key: 'type', header: 'Type', render: x => <span className="badge badge-gray">{x.type}</span> },
              { key: 'role', header: 'Role' },
              ...(canEdit ? [{ key: 'a', header: '', render: (x: Partner) => <button type="button" className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`Remove ${x.name}`} onClick={() => run(() => removePartner(p.id, x.id), 'Partner removed')}><Trash2 size={15} /></button> }] : []),
            ]} />
        </Section>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="NGOs in Same Field" flush>
          <DataTable caption="NGOs in same field" rows={t.sameFieldNgos} rowKey={x => x.id} emptyTitle="None recorded"
            columns={[{ key: 'name', header: 'Name', render: x => <span className="font-semibold">{x.name}</span> },
              { key: 'web', header: 'Website', render: x => <a href={x.website} target="_blank" rel="noreferrer" className="text-teal-600 hover:underline inline-flex items-center gap-1">Visit <ExternalLink size={12} /></a> },
              { key: 'remark', header: 'Remark' }]} />
        </Section>
        <Section title="Volunteers" flush>
          <DataTable caption="Volunteers" rows={t.volunteers} rowKey={x => x.id} emptyTitle="No volunteers"
            columns={[{ key: 'c', header: 'Category', render: x => x.category }, { key: 'n', header: 'Number', align: 'right', render: x => num(x.number) }]}
            footer={<tr><td className="font-bold">Total volunteers</td><td className="text-right font-bold">{num(t.totalVolunteers)}</td></tr>} />
        </Section>
      </div>

      <Section title="Staff by Tier" flush>
        <div className="divide-y divide-slate-100">
          {t.staff.map(tier => (
            <div key={tier.tier}>
              <div className="px-5 pt-4 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{tier.tier} {tier.tier === 'Authority' ? 'position' : tier.tier === 'Office' ? 'position' : 'position'}</div>
              <DataTable caption={`${tier.tier} staff`} rows={tier.positions} rowKey={x => x.id} emptyTitle="No positions"
                columns={[{ key: 'pos', header: 'Position', render: x => x.position }, { key: 'q', header: 'Quantity', align: 'right', render: x => x.quantity },
                  { key: 'pk', header: 'Package / yr', align: 'right', render: x => inr(x.packagePerYear) }, { key: 't', header: 'Total salary', align: 'right', render: x => <b>{inr(x.totalSalary)}</b> }]} />
            </div>
          ))}
          <div className="px-5 py-4 flex flex-wrap gap-x-10 gap-y-1 bg-slate-50 text-sm rounded-b-[14px]">
            <span>Total Staff: <b>{num(t.totalStaff)}</b></span><span>Total Salaries Per Year (A): <b>{inr(t.totalSalariesA)}</b></span>
          </div>
        </div>
      </Section>

      {assign && <AssignModal group={assign} onClose={() => setAssign(null)} onSave={async f => { await run(() => assignTeamMember(p.id, f), `${f.name} assigned`); setAssign(null); }} />}
      {addP && <PartnerModal onClose={() => setAddP(false)} onSave={async f => { await run(() => addPartner(p.id, f), 'Partner added'); setAddP(false); }} />}
      <ConfirmDialog open={!!remove} title="Unassign team member?" danger confirmLabel="Unassign" onCancel={() => setRemove(null)}
        onConfirm={async () => { if (remove) await run(() => unassignTeamMember(p.id, remove.id), `${remove.name} unassigned`); setRemove(null); }}
        message={<>{remove?.name} will be removed from the {remove?.group.toLowerCase()} team of this project.</>} />
    </div>
  );
}

function AssignModal({ group, onClose, onSave }: { group: TeamMember['group']; onClose: () => void; onSave: (m: { name: string; role: string; group: TeamMember['group']; organisation?: string; email?: string }) => Promise<void> }) {
  const [f, setF] = useState({ name: '', role: '', group, organisation: '', email: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Name is required';
    if (!f.role.trim()) e.role = 'Role is required';
    if (f.email && !EMAIL.test(f.email)) e.email = 'Enter a valid email';
    setErr(e);
    if (!Object.keys(e).length) void onSave({ ...f, organisation: f.organisation || undefined, email: f.email || undefined });
  };
  return (
    <Modal open title="Assign team member" onClose={onClose} footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={submit}>Assign</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Full name" required error={err.name}><TextInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} invalid={!!err.name} /></FormField>
        <FormField label="Role / designation" required error={err.role}><TextInput value={f.role} onChange={e => setF({ ...f, role: e.target.value })} invalid={!!err.role} /></FormField>
        <FormField label="Team"><SelectInput value={f.group} onChange={e => setF({ ...f, group: e.target.value as TeamMember['group'] })}>{GROUPS.map(g => <option key={g}>{g}</option>)}</SelectInput></FormField>
        <FormField label="Organisation (optional)"><TextInput value={f.organisation} onChange={e => setF({ ...f, organisation: e.target.value })} /></FormField>
        <FormField label="Email (optional)" error={err.email} className="sm:col-span-2"><TextInput type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} invalid={!!err.email} /></FormField>
      </div>
    </Modal>
  );
}

function PartnerModal({ onClose, onSave }: { onClose: () => void; onSave: (p: Omit<Partner, 'id'>) => Promise<void> }) {
  const [f, setF] = useState<Omit<Partner, 'id'>>({ name: '', type: 'Organisation', role: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Name is required';
    if (!f.role.trim()) e.role = 'Describe their role';
    setErr(e);
    if (!Object.keys(e).length) void onSave(f);
  };
  return (
    <Modal open title="Add working partner" onClose={onClose} footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={submit}>Add partner</button></>}>
      <div className="grid gap-4">
        <FormField label="Organisation / NGO / Research body / Govt. body" required error={err.name}><TextInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} invalid={!!err.name} /></FormField>
        <FormField label="Type"><SelectInput value={f.type} onChange={e => setF({ ...f, type: e.target.value as Partner['type'] })}>{PARTNER_TYPES.map(x => <option key={x}>{x}</option>)}</SelectInput></FormField>
        <FormField label="Role in project" required error={err.role}><TextInput value={f.role} onChange={e => setF({ ...f, role: e.target.value })} invalid={!!err.role} /></FormField>
      </div>
    </Modal>
  );
}
