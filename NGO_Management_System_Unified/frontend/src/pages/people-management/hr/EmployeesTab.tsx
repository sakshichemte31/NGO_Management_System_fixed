import { useState } from 'react';
import { Plus, Eye } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';
import { Avatar, DataTable, DetailDrawer, FilterBar, InfoGrid, Modal, SectionTitle, SelectField, StatusBadge, SubTabs, TextField, ACCENT, ProgressBar, type Column } from '../../../components/people';
import { DEPT_NAMES, ROLES, departments, attendanceHistory, feedbackFor, ratingHistory, type AttendanceEntry, type Employee, type EmpStatus, type LeaveRecord } from './data';

interface Props { employees: Employee[]; leaves: LeaveRecord[]; attendanceEntries: AttendanceEntry[]; onAdd: (e: Employee) => void; onUpdate: (e: Employee) => void; onStatus: (id: string, status: EmpStatus) => void; addOpen: boolean; setAddOpen: (b: boolean) => void }
const SUB = ['Personal Details', 'Contact Details', 'Department & Role', 'Qualifications', 'Employment Info', 'Attendance & Leave', 'Performance History'];
const blank = { name: '', email: '', phone: '', dept: DEPT_NAMES[0], role: ROLES[0], status: 'Active' as EmpStatus, joinDate: '', gender: 'Female', degree: '', institution: '' };

export default function EmployeesTab({ employees, leaves: allLeaves, attendanceEntries, onAdd, onUpdate, onStatus, addOpen, setAddOpen }: Props) {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All'); const [role, setRole] = useState('All'); const [status, setStatus] = useState('All');
  const [sel, setSel] = useState<Employee | null>(null);
  const [sub, setSub] = useState(SUB[0]);
  const [f, setF] = useState(blank);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', dept: DEPT_NAMES[0], role: ROLES[0], status: 'Active' as EmpStatus, joinDate: '' });
  const set = (k: keyof typeof blank) => (v: string) => setF(p => ({ ...p, [k]: v }));

  const rows = employees.filter(e =>
    (e.name + e.email + e.id).toLowerCase().includes(search.toLowerCase()) &&
    (dept === 'All' || e.dept === dept) && (role === 'All' || e.role === role) && (status === 'All' || e.status === status));

  const submit = () => {
    if (!f.name.trim()) return;
    const n = employees.length + 1;
    onAdd({
      id: `EMP-${String(n).padStart(3, '0')}`, name: f.name.trim(), dept: f.dept, role: f.role, status: f.status,
      joinDate: f.joinDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      email: f.email || `${f.name.split(' ')[0].toLowerCase()}@hopefoundation.org`, phone: f.phone, gender: f.gender, dob: '', address: '', emergency: '',
      employmentType: 'Full-time', manager: '—', location: 'Pune HQ', attendance: 100, rating: 3.5,
      qualifications: f.degree ? [{ degree: f.degree, institution: f.institution, year: '' }] : [],
    });
    setF(blank); setAddOpen(false);
  };

  const cols: Column<Employee>[] = [
    { header: 'Employee', render: e => <div className="flex items-center gap-3"><Avatar name={e.name} color={ACCENT.hr} /><div><div className="font-semibold text-slate-800">{e.name}</div><div className="text-[11px] text-slate-400">{e.id} · {e.email}</div></div></div> },
    { header: 'Department', render: e => e.dept },
    { header: 'Role', render: e => e.role },
    { header: 'Status', render: e => <StatusBadge status={e.status} /> },
    { header: 'Joined', render: e => <span className="text-xs">{e.joinDate}</span> },
    { header: '', render: e => <button className="p-1.5 rounded hover:bg-teal-50 text-slate-400 hover:text-teal-600" aria-label={`View ${e.name}`} onClick={ev => { ev.stopPropagation(); open(e); }}><Eye size={14} /></button> },
  ];
  const open = (e: Employee) => { setSel(e); setSub(SUB[0]); };
  const updateStatus = (employee: Employee, nextStatus: EmpStatus) => {
    onStatus(employee.id, nextStatus);
    setSel(current => current?.id === employee.id ? { ...current, status: nextStatus } : current);
  };
  const editEmployee = () => {
    if (!sel) return;
    setEditForm({ name: sel.name, email: sel.email, phone: sel.phone, dept: sel.dept, role: sel.role, status: sel.status, joinDate: sel.joinDate });
    setEditOpen(true);
  };
  const saveEmployee = () => {
    if (!sel || !editForm.name.trim() || !editForm.email.trim()) return;
    const updated: Employee = {
      ...sel, ...editForm, name: editForm.name.trim(), email: editForm.email.trim(),
      manager: departments.find(department => department.name === editForm.dept)?.head ?? sel.manager,
    };
    onUpdate(updated);
    setSel(updated);
    setEditOpen(false);
  };
  const leaves = sel ? allLeaves.filter(l => l.employeeId === sel.id) : [];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar search={search} onSearch={setSearch} placeholder="Search employees…" filters={[
        { label: 'Departments', value: dept, options: DEPT_NAMES, onChange: setDept },
        { label: 'Roles', value: role, options: ROLES, onChange: setRole },
        { label: 'Statuses', value: status, options: ['Active', 'On Leave', 'Inactive'], onChange: setStatus },
      ]} />
      <div className="card overflow-hidden">
        <div className="card-header"><h2 className="card-title">Employee List ({rows.length})</h2><button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Add Employee</button></div>
        <DataTable columns={cols} rows={rows} rowKey={e => e.id} onRowClick={open} emptyTitle="No employees match" />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Employee" submitLabel="Add Employee" onSubmit={submit}>
        <TextField label="Full name" value={f.name} onChange={set('name')} required wide />
        <TextField label="Email" type="email" value={f.email} onChange={set('email')} />
        <TextField label="Phone" value={f.phone} onChange={set('phone')} />
        <SelectField label="Department" value={f.dept} onChange={set('dept')} options={DEPT_NAMES} />
        <SelectField label="Role" value={f.role} onChange={set('role')} options={ROLES} />
        <SelectField label="Status" value={f.status} onChange={set('status')} options={['Active', 'On Leave', 'Inactive']} />
        <SelectField label="Gender" value={f.gender} onChange={set('gender')} options={['Female', 'Male', 'Other']} />
        <TextField label="Join date" type="text" placeholder="e.g. 1 Nov 2025" value={f.joinDate} onChange={set('joinDate')} />
        <TextField label="Highest degree" value={f.degree} onChange={set('degree')} />
        <TextField label="Institution" value={f.institution} onChange={set('institution')} wide />
      </Modal>

      <DetailDrawer open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ''} subtitle={sel ? `${sel.id} · ${sel.role}` : ''} accent={ACCENT.hr}>
        {sel && (<>
          <div className="mb-3 flex justify-end"><button className="btn-secondary text-xs" onClick={editEmployee}>Edit Employee</button></div>
          <SubTabs tabs={SUB} active={sub} onChange={setSub} accent={ACCENT.hr} />
          {sub === 'Personal Details' && <InfoGrid items={[['Full name', sel.name], ['Gender', sel.gender], ['Date of birth', sel.dob], ['Employee ID', sel.id], ['Address', sel.address]]} />}
          {sub === 'Contact Details' && <InfoGrid items={[['Email', sel.email], ['Phone', sel.phone], ['Address', sel.address], ['Emergency contact', sel.emergency]]} />}
          {sub === 'Department & Role' && <InfoGrid items={[['Department', sel.dept], ['Role', sel.role], ['Reporting to', sel.manager], ['Location', sel.location]]} />}
          {sub === 'Qualifications' && (sel.qualifications.length ? <ul className="flex flex-col gap-3">{sel.qualifications.map((q, i) => <li key={i} className="p-3 rounded-lg bg-slate-50"><div className="text-sm font-semibold text-slate-800">{q.degree}</div><div className="text-xs text-slate-500">{q.institution} {q.year && `· ${q.year}`}</div></li>)}</ul> : <p className="text-sm text-slate-500">No qualifications recorded.</p>)}
          {sub === 'Employment Info' && <InfoGrid items={[['Status', <StatusBadge key="s" status={sel.status} />], ['Join date', sel.joinDate], ['Employment type', sel.employmentType], ['Location', sel.location]]} />}
          {sub === 'Attendance & Leave' && (<div className="flex flex-col gap-5">
            <p className="text-xs text-slate-500">{attendanceEntries.some(entry => entry.employeeId === sel.id) ? 'Based on recorded daily attendance.' : 'Demo baseline; no daily entries recorded.'}</p>
            <ProgressBar value={sel.attendance} color={ACCENT.hr} />
            <div style={{ height: 180 }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={attendanceHistory(sel, attendanceEntries)}><CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Area dataKey="percent" name="Attendance %" stroke="#1AACB8" fill="#E6F7F9" /></AreaChart></ResponsiveContainer></div>
            <SectionTitle>Leave history</SectionTitle>
            {leaves.length ? leaves.map(l => <div key={l.id} className="flex justify-between text-sm py-1.5 border-b border-slate-100"><span>{l.type} · {l.from}–{l.to} ({l.days}d)</span><StatusBadge status={l.status} /></div>) : <p className="text-sm text-slate-500">No leave records.</p>}
          </div>)}
          {sub === 'Performance History' && (<div className="flex flex-col gap-4">
            <div className="text-sm text-slate-600">Current rating <span className="font-extrabold text-slate-800 text-lg" style={{ fontFamily: 'Nunito, sans-serif' }}>{sel.rating.toFixed(1)}</span> / 5 — {feedbackFor(sel)}</div>
            <div style={{ height: 200 }}><ResponsiveContainer width="100%" height="100%"><LineChart data={ratingHistory(sel)}><CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" /><XAxis dataKey="period" tick={{ fontSize: 11 }} /><YAxis domain={[2, 5]} tick={{ fontSize: 11 }} /><Tooltip /><Line dataKey="rating" stroke={ACCENT.hr} strokeWidth={2} dot /></LineChart></ResponsiveContainer></div>
          </div>)}
        </>)}
      </DetailDrawer>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee" submitLabel="Save Changes" onSubmit={saveEmployee}>
        <TextField label="Full name" value={editForm.name} onChange={value => setEditForm(current => ({ ...current, name: value }))} required wide />
        <TextField label="Email" type="email" value={editForm.email} onChange={value => setEditForm(current => ({ ...current, email: value }))} required />
        <TextField label="Phone" value={editForm.phone} onChange={value => setEditForm(current => ({ ...current, phone: value }))} />
        <SelectField label="Department" value={editForm.dept} onChange={value => setEditForm(current => ({ ...current, dept: value }))} options={DEPT_NAMES} />
        <SelectField label="Role" value={editForm.role} onChange={value => setEditForm(current => ({ ...current, role: value }))} options={ROLES} />
        <SelectField label="Status" value={editForm.status} onChange={value => setEditForm(current => ({ ...current, status: value as EmpStatus }))} options={['Active', 'On Leave', 'Inactive']} />
        <TextField label="Join date" value={editForm.joinDate} onChange={value => setEditForm(current => ({ ...current, joinDate: value }))} />
      </Modal>
    </div>
  );
}
