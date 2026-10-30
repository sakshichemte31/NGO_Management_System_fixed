import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable, DetailDrawer, InfoGrid, Modal, SelectField, StatusBadge, TextAreaField, TextField, ACCENT, PageTabs, type Column } from '../../../components/people';
import { EVENTS, PROJECTS, type Assignment, type Volunteer } from './data';

interface Props { volunteers: Volunteer[]; assignments: Assignment[]; onAdd: (a: Assignment) => void; onStatus: (id: string, s: Assignment['status']) => void }
const VIEWS = [{ id: 'Project', label: 'Project Assignments' }, { id: 'Event', label: 'Event Assignments' }, { id: 'History', label: 'Assignment History' }];

export default function AssignmentsTab({ volunteers, assignments, onAdd, onStatus }: Props) {
  const [view, setView] = useState('Project'); const [open, setOpen] = useState(false); const [selId, setSelId] = useState<string | null>(null);
  const [f, setF] = useState({ volunteerId: volunteers[0]?.id ?? '', kind: 'Project', target: PROJECTS[0], role: '', date: '', responsibilities: '' });
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v, ...(k === 'kind' ? { target: v === 'Project' ? PROJECTS[0] : EVENTS[0] } : {}) }));
  const vname = (id: string) => volunteers.find(v => v.id === id)?.name ?? id;
  const sel = assignments.find(a => a.id === selId) ?? null;
  const rows = view === 'History' ? assignments.filter(a => a.status === 'Completed') : assignments.filter(a => a.kind === view && a.status !== 'Completed');

  const submit = () => {
    if (!f.role.trim()) return;
    onAdd({ id: `AS-${String(assignments.length + 1).padStart(3, '0')}`, volunteerId: f.volunteerId, kind: f.kind as Assignment['kind'], target: f.target, role: f.role.trim(), date: f.date || 'TBD', status: 'Upcoming', responsibilities: f.responsibilities });
    setOpen(false); setF(p => ({ ...p, role: '', date: '', responsibilities: '' }));
  };
  const cols: Column<Assignment>[] = [
    { header: 'Volunteer', render: a => <span className="font-semibold text-slate-800">{vname(a.volunteerId)}</span> },
    { header: 'Project / Event', render: a => a.target }, { header: 'Role', render: a => a.role },
    { header: 'Date', render: a => <span className="text-xs">{a.date}</span> }, { header: 'Status', render: a => <StatusBadge status={a.status} /> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTabs tabs={VIEWS} active={view} onChange={setView} accent={ACCENT.volunteer} />
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> Assign Volunteer</button>
      </div>
      <div className="card overflow-hidden"><DataTable columns={cols} rows={rows} rowKey={a => a.id} onRowClick={a => setSelId(a.id)} emptyTitle="No assignments here" /></div>
      <Modal open={open} onClose={() => setOpen(false)} title="Assign Volunteer" submitLabel="Assign" onSubmit={submit}>
        <SelectField label="Volunteer" value={f.volunteerId} onChange={set('volunteerId')} options={volunteers.filter(v => v.status === 'Active').map(v => v.id)} wide />
        <SelectField label="Type" value={f.kind} onChange={set('kind')} options={['Project', 'Event']} />
        <SelectField label={f.kind} value={f.target} onChange={set('target')} options={f.kind === 'Project' ? PROJECTS : EVENTS} />
        <TextField label="Role" value={f.role} onChange={set('role')} required />
        <TextField label="Date" value={f.date} onChange={set('date')} placeholder="e.g. 30 Oct 2025" />
        <TextAreaField label="Responsibilities" value={f.responsibilities} onChange={set('responsibilities')} />
      </Modal>
      <DetailDrawer open={!!sel} onClose={() => setSelId(null)} title={sel?.target ?? ''} subtitle={sel ? `${sel.id} · ${sel.kind} assignment` : ''} accent={ACCENT.volunteer}>
        {sel && <div className="flex flex-col gap-5">
          <InfoGrid items={[['Volunteer', vname(sel.volunteerId)], ['Project / Event', sel.target], ['Role', sel.role], ['Date', sel.date], ['Status', <StatusBadge key="s" status={sel.status} />], ['Responsibilities', sel.responsibilities]]} />
          <SelectField label="Update status" value={sel.status} onChange={v => onStatus(sel.id, v as Assignment['status'])} options={['Upcoming', 'Ongoing', 'Completed']} />
        </div>}
      </DetailDrawer>
    </div>
  );
}
