import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable, DetailDrawer, FilterBar, InfoGrid, Modal, SelectField, StatusBadge, TextAreaField, TextField, ACCENT, type Column } from '../../../components/people';
import { DEPT_NAMES, type Requirement } from './data';

interface Props { requirements: Requirement[]; onAdd: (r: Requirement) => void; onStatus: (id: string, s: Requirement['status']) => void }
const STATUSES: Requirement['status'][] = ['Open', 'Shortlisting', 'On Hold', 'Filled'];
const blank = { role: '', dept: DEPT_NAMES[0], urgency: 'Medium', positions: '1', skills: '', description: '' };

export default function RequirementsTab({ requirements, onAdd, onStatus }: Props) {
  const [search, setSearch] = useState(''); const [status, setStatus] = useState('All');
  const [addOpen, setAddOpen] = useState(false); const [f, setF] = useState(blank); const [selId, setSelId] = useState<string | null>(null);
  const set = (k: keyof typeof blank) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const sel = requirements.find(r => r.id === selId) ?? null;
  const rows = requirements.filter(r => (r.role + r.dept).toLowerCase().includes(search.toLowerCase()) && (status === 'All' || r.status === status));

  const submit = () => {
    if (!f.role.trim()) return;
    onAdd({ id: `REQ-${String(requirements.length + 1).padStart(3, '0')}`, role: f.role.trim(), dept: f.dept, urgency: f.urgency as Requirement['urgency'], positions: Math.max(1, Number(f.positions) || 1), skills: f.skills, description: f.description, status: 'Open', openedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) });
    setF(blank); setAddOpen(false);
  };
  const cols: Column<Requirement>[] = [
    { header: 'ID', render: r => <span className="text-xs text-slate-400">{r.id}</span> },
    { header: 'Role', render: r => <span className="font-semibold text-slate-800">{r.role}</span> },
    { header: 'Department', render: r => r.dept },
    { header: 'Positions', render: r => r.positions },
    { header: 'Urgency', render: r => <StatusBadge status={r.urgency} /> },
    { header: 'Opened', render: r => <span className="text-xs">{r.openedDate}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <FilterBar search={search} onSearch={setSearch} placeholder="Search requirements…" filters={[{ label: 'Statuses', value: status, options: STATUSES, onChange: setStatus }]} />
      <div className="card overflow-hidden">
        <div className="card-header"><h2 className="card-title">Requirements List</h2><button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Requirement</button></div>
        <DataTable columns={cols} rows={rows} rowKey={r => r.id} onRowClick={r => setSelId(r.id)} emptyTitle="No requirements" />
      </div>
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Requirement" submitLabel="Add Requirement" onSubmit={submit}>
        <TextField label="Role title" value={f.role} onChange={set('role')} required wide />
        <SelectField label="Department" value={f.dept} onChange={set('dept')} options={DEPT_NAMES} />
        <SelectField label="Urgency" value={f.urgency} onChange={set('urgency')} options={['High', 'Medium', 'Low']} />
        <TextField label="Positions" type="number" value={f.positions} onChange={set('positions')} />
        <TextField label="Key skills" value={f.skills} onChange={set('skills')} />
        <TextAreaField label="Description" value={f.description} onChange={set('description')} />
      </Modal>
      <DetailDrawer open={!!sel} onClose={() => setSelId(null)} title={sel?.role ?? ''} subtitle={sel ? `${sel.id} · ${sel.dept}` : ''} accent={ACCENT.hr}>
        {sel && <div className="flex flex-col gap-5">
          <InfoGrid items={[['Status', <StatusBadge key="s" status={sel.status} />], ['Urgency', <StatusBadge key="u" status={sel.urgency} />], ['Positions', sel.positions], ['Opened', sel.openedDate], ['Key skills', sel.skills], ['Description', sel.description]]} />
          <SelectField label="Update status" value={sel.status} onChange={v => onStatus(sel.id, v as Requirement['status'])} options={STATUSES} />
        </div>}
      </DetailDrawer>
    </div>
  );
}
