import { useState } from 'react';
import { DataTable, SelectField, StatusBadge, TextField, ACCENT, PageTabs, type Column } from '../../../components/people';
import { EVENTS, PROJECTS, today, type AttendanceRec, type Volunteer } from './data';

interface Props { volunteers: Volunteer[]; records: AttendanceRec[]; onMark: (r: AttendanceRec) => void }
const VIEWS = [{ id: 'mark', label: 'Mark Attendance' }, { id: 'history', label: 'Attendance History' }, { id: 'Event', label: 'Event Attendance' }, { id: 'Project', label: 'Project Attendance' }];

export default function AttendanceTab({ volunteers, records, onMark }: Props) {
  const [view, setView] = useState('mark');
  const [f, setF] = useState({ volunteerId: volunteers[0]?.id ?? '', kind: 'Event', target: EVENTS[0], status: 'Present', hours: '4' });
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v, ...(k === 'kind' ? { target: v === 'Event' ? EVENTS[0] : PROJECTS[0] } : {}) }));
  const name = (id: string) => volunteers.find(v => v.id === id)?.name ?? id;
  const rows = view === 'history' || view === 'mark' ? records : records.filter(r => r.kind === view);
  const cols: Column<AttendanceRec>[] = [
    { header: 'Date', render: r => <span className="text-xs">{r.date}</span> }, { header: 'Volunteer', render: r => <span className="font-semibold text-slate-800">{name(r.volunteerId)}</span> },
    { header: 'Type', render: r => r.kind }, { header: 'Project / Event', render: r => r.target }, { header: 'Hours', render: r => r.hours }, { header: 'Status', render: r => <StatusBadge status={r.status} /> },
  ];
  return (
    <div className="flex flex-col gap-4">
      <PageTabs tabs={VIEWS} active={view} onChange={setView} accent={ACCENT.volunteer} />
      {view === 'mark' && <form className="card card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end" onSubmit={e => { e.preventDefault();
        onMark({ id: `AT-${String(records.length + 1).padStart(3, '0')}`, volunteerId: f.volunteerId, date: today(), kind: f.kind as AttendanceRec['kind'], target: f.target, status: f.status as AttendanceRec['status'], hours: f.status === 'Absent' ? 0 : Number(f.hours) || 0 }); }}>
        <SelectField label="Volunteer" value={f.volunteerId} onChange={set('volunteerId')} options={volunteers.map(v => v.id)} />
        <SelectField label="Type" value={f.kind} onChange={set('kind')} options={['Event', 'Project']} />
        <SelectField label={f.kind} value={f.target} onChange={set('target')} options={f.kind === 'Event' ? EVENTS : PROJECTS} />
        <SelectField label="Status" value={f.status} onChange={set('status')} options={['Present', 'Late', 'Absent']} />
        <TextField label="Hours" type="number" value={f.hours} onChange={set('hours')} />
        <button className="btn-primary justify-center" type="submit">Mark</button></form>}
      <div className="card overflow-hidden"><div className="card-header"><h2 className="card-title">{VIEWS.find(v => v.id === view)?.label === 'Mark Attendance' ? 'Recent Entries' : VIEWS.find(v => v.id === view)?.label}</h2></div>
        <DataTable columns={cols} rows={rows} rowKey={r => r.id} emptyTitle="No attendance records" /></div>
    </div>
  );
}
