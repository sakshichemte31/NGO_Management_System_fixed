import { useState } from 'react';
import { Avatar, DataTable, DetailDrawer, FilterBar, InfoGrid, ProgressBar, SelectField, StatusBadge, ACCENT, type Column } from '../../../components/people';
import { INTERN_DEPTS, type Intern } from './data';

export default function InternListTab({ interns, onStatus }: { interns: Intern[]; onStatus: (id: string, status: Intern['status']) => void }) {
  const [search, setSearch] = useState(''); const [dept, setDept] = useState('All'); const [status, setStatus] = useState('All');
  const [selId, setSelId] = useState<string | null>(null);
  const sel = interns.find(i => i.id === selId) ?? null;
  const rows = interns.filter(i => (i.name + i.mentor).toLowerCase().includes(search.toLowerCase()) && (dept === 'All' || i.dept === dept) && (status === 'All' || i.status === status));
  const cols: Column<Intern>[] = [
    { header: 'Intern', render: i => <div className="flex items-center gap-3"><Avatar name={i.name} color={ACCENT.intern} /><div><div className="font-semibold text-slate-800">{i.name}</div><div className="text-[11px] text-slate-400">{i.id}</div></div></div> },
    { header: 'Department', render: i => i.dept },
    { header: 'Mentor', render: i => i.mentor },
    { header: 'Duration', render: i => <span className="text-xs">{i.start} → {i.end}</span> },
    { header: 'Status', render: i => <StatusBadge status={i.status} /> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <FilterBar search={search} onSearch={setSearch} placeholder="Search interns or mentors…" filters={[
        { label: 'Departments', value: dept, options: INTERN_DEPTS, onChange: setDept },
        { label: 'Statuses', value: status, options: ['Active', 'Completed', 'On Hold'], onChange: setStatus }]} />
      <div className="card overflow-hidden"><div className="card-header"><h2 className="card-title">Intern List ({rows.length})</h2></div>
        <DataTable columns={cols} rows={rows} rowKey={i => i.id} onRowClick={i => setSelId(i.id)} emptyTitle="No interns found" /></div>
      <DetailDrawer open={!!sel} onClose={() => setSelId(null)} title={sel?.name ?? ''} subtitle={sel ? `${sel.id} · ${sel.college}` : ''} accent={ACCENT.intern}>
        {sel && <div className="flex flex-col gap-6">
          <InfoGrid items={[['Internship', `${sel.project}`], ['Department', sel.dept], ['Mentor', sel.mentor], ['Status', <StatusBadge key="s" status={sel.status} />], ['Start date', sel.start], ['End date', sel.end], ['Email', sel.email], ['College', sel.college]]} />
          <SelectField label="Intern status" value={sel.status} onChange={value => onStatus(sel.id, value as Intern['status'])} options={['Active', 'Completed', 'On Hold']} />
          <div><div className="form-label">Overall progress</div><ProgressBar value={sel.progress} color={ACCENT.intern} /></div>
        </div>}
      </DetailDrawer>
    </div>
  );
}
