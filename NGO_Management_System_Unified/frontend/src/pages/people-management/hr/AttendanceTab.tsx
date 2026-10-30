import { useState } from 'react';
import { CalendarCheck, Check, Plus, X } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, DataTable, FilterBar, Modal, ProgressBar, SelectField, StatusBadge, TextAreaField, TextField, ACCENT, type Column } from '../../../components/people';
import { attendanceHistory, type AttendanceEntry, type Employee, type LeaveRecord } from './data';

interface Props { employees: Employee[]; leaves: LeaveRecord[]; attendanceEntries: AttendanceEntry[]; onLeave: (id: string, s: 'Approved' | 'Rejected') => void; onAddLeave: (leave: LeaveRecord) => void; onAddAttendance: (entry: AttendanceEntry) => void }

export default function AttendanceTab({ employees, leaves, attendanceEntries, onLeave, onAddLeave, onAddAttendance }: Props) {
  const [search, setSearch] = useState(''); const [empId, setEmpId] = useState(employees[0]?.id ?? '');
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [leaveForm, setLeaveForm] = useState({ employeeId: employees[0]?.id ?? '', type: 'Casual', from: '', to: '', reason: '' });
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({ employeeId: employees[0]?.id ?? '', date: new Date().toISOString().slice(0, 10), status: 'Present', note: '' });
  const emp = employees.find(e => e.id === empId) ?? employees[0];
  const rows = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const submitLeave = () => {
    const employee = employees.find(item => item.id === leaveForm.employeeId);
    const from = new Date(`${leaveForm.from}T00:00:00`);
    const to = new Date(`${leaveForm.to}T00:00:00`);
    if (!employee || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || !leaveForm.reason.trim()) return;
    if (to < from) { setLeaveError('The end date must be on or after the start date.'); return; }
    const isHalfDay = leaveForm.type === 'Half Day';
    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    onAddLeave({
      id: `LV-${Date.now()}`, employeeId: employee.id, name: employee.name, type: leaveForm.type,
      from: formatDate(from), to: formatDate(to), days: isHalfDay ? 0.5 : Math.floor((to.getTime() - from.getTime()) / 86400000) + 1,
      reason: leaveForm.reason.trim(), status: 'Pending',
    });
    setLeaveForm({ employeeId: employees[0]?.id ?? '', type: 'Casual', from: '', to: '', reason: '' });
    setLeaveError('');
    setLeaveOpen(false);
  };

  const submitAttendance = () => {
    const employee = employees.find(item => item.id === attendanceForm.employeeId);
    if (!employee || !attendanceForm.date) return;
    onAddAttendance({
      id: `ATT-${Date.now()}`, employeeId: employee.id, date: attendanceForm.date,
      status: attendanceForm.status as AttendanceEntry['status'], note: attendanceForm.note.trim(),
    });
    setAttendanceForm(current => ({ ...current, note: '' }));
    setAttendanceOpen(false);
  };

  const attCols: Column<Employee>[] = [
    { header: 'Employee', render: e => <div className="flex items-center gap-2"><Avatar name={e.name} color={ACCENT.hr} size={30} /><span className="font-semibold text-slate-800">{e.name}</span></div> },
    { header: 'Department', render: e => e.dept },
    { header: 'Attendance', className: 'min-w-[160px]', render: e => <div><ProgressBar value={e.attendance} color={e.attendance >= 95 ? '#10B981' : e.attendance >= 90 ? '#F59E0B' : '#EF4444'} /><span className="text-[10px] text-slate-400">{attendanceEntries.some(entry => entry.employeeId === e.id) ? 'From daily entries' : 'Demo baseline'}</span></div> },
    { header: 'Status', render: e => <StatusBadge status={e.status} /> },
  ];
  const leaveCols: Column<LeaveRecord>[] = [
    { header: 'Employee', render: l => <span className="font-semibold text-slate-800">{l.name}</span> },
    { header: 'Type', render: l => l.type },
    { header: 'Period', render: l => `${l.from} – ${l.to} (${l.days}d)` },
    { header: 'Reason', render: l => l.reason },
    { header: 'Status', render: l => <StatusBadge status={l.status} /> },
    { header: 'Actions', render: l => l.status === 'Pending' ? (
      <div className="flex gap-1">
        <button className="p-1.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100" aria-label={`Approve leave for ${l.name}`} onClick={() => onLeave(l.id, 'Approved')}><Check size={14} /></button>
        <button className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100" aria-label={`Reject leave for ${l.name}`} onClick={() => onLeave(l.id, 'Rejected')}><X size={14} /></button>
      </div>) : <span className="text-xs text-slate-400">—</span> },
  ];
  const entryCols: Column<AttendanceEntry>[] = [
    { header: 'Employee', render: entry => employees.find(employee => employee.id === entry.employeeId)?.name ?? entry.employeeId },
    { header: 'Date', render: entry => new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-GB') },
    { header: 'Status', render: entry => <StatusBadge status={entry.status} /> },
    { header: 'Note', render: entry => entry.note || '—' },
  ];
  const recentEntries = [...attendanceEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  return (
    <div className="flex flex-col gap-5">
      <div className="card overflow-hidden">
        <div className="card-header"><div><h2 className="card-title">Attendance Summary</h2><p className="mt-1 text-xs text-slate-500">Present 100% · Late 50% · Absent 0%</p></div><button className="btn-primary text-xs py-1.5" onClick={() => setAttendanceOpen(true)}><CalendarCheck size={14} /> Mark Attendance</button></div>
        <div className="p-4"><FilterBar search={search} onSearch={setSearch} placeholder="Search employee…" /></div>
        <DataTable columns={attCols} rows={rows} rowKey={e => e.id} />
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h2 className="card-title">Daily Attendance</h2><span className="text-xs text-slate-400">Showing latest 10 entries</span></div>
        <DataTable columns={entryCols} rows={recentEntries} rowKey={entry => entry.id} emptyTitle="No daily attendance recorded" />
      </div>
      <div className="card overflow-hidden">
        <div className="card-header"><h2 className="card-title">Leave Records</h2><div className="flex items-center gap-3"><span className="text-xs text-slate-400">{leaves.filter(l => l.status === 'Pending').length} pending</span><button className="btn-primary text-xs py-1.5" onClick={() => setLeaveOpen(true)}><Plus size={13} /> Record Leave</button></div></div>
        <DataTable columns={leaveCols} rows={leaves} rowKey={l => l.id} emptyTitle="No leave requests" />
      </div>
      {emp && <div className="card">
        <div className="card-header"><h2 className="card-title">Attendance History</h2><div className="w-52"><SelectField label="Choose employee" hideLabel value={emp.id} onChange={setEmpId} options={employees.map(e => e.id)} /></div></div>
        <div className="card-body">
          <p className="text-xs text-slate-500 mb-2">{emp.name} · {attendanceEntries.some(entry => entry.employeeId === emp.id) ? 'recorded history' : 'demo baseline'} · last 6 months</p>
          <div style={{ height: 220 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={attendanceHistory(emp, attendanceEntries)}><CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="percent" name="Attendance %" fill="#1AACB8" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>}
      <Modal open={leaveOpen} onClose={() => { setLeaveOpen(false); setLeaveError(''); }} title="Record Leave Request" submitLabel="Submit Request" onSubmit={submitLeave}>
        <SelectField label="Employee" value={leaveForm.employeeId} onChange={value => setLeaveForm(current => ({ ...current, employeeId: value }))} options={employees.map(employee => employee.id)} wide />
        <SelectField label="Leave type" value={leaveForm.type} onChange={value => setLeaveForm(current => ({ ...current, type: value }))} options={['Casual', 'Earned', 'Medical', 'Annual', 'Half Day']} />
        <TextField label="From" type="date" value={leaveForm.from} onChange={value => { setLeaveError(''); setLeaveForm(current => ({ ...current, from: value })); }} required />
        <TextField label="To" type="date" value={leaveForm.to} onChange={value => { setLeaveError(''); setLeaveForm(current => ({ ...current, to: value })); }} required />
        <TextAreaField label="Reason" value={leaveForm.reason} onChange={value => setLeaveForm(current => ({ ...current, reason: value }))} required />
        {leaveError && <p role="alert" className="sm:col-span-2 text-xs text-red-600">{leaveError}</p>}
      </Modal>
      <Modal open={attendanceOpen} onClose={() => setAttendanceOpen(false)} title="Mark Attendance" submitLabel="Save Attendance" onSubmit={submitAttendance}>
        <SelectField label="Employee" value={attendanceForm.employeeId} onChange={value => setAttendanceForm(current => ({ ...current, employeeId: value }))} options={employees.map(employee => employee.id)} wide />
        <TextField label="Date" type="date" value={attendanceForm.date} onChange={value => setAttendanceForm(current => ({ ...current, date: value }))} required />
        <SelectField label="Attendance status" value={attendanceForm.status} onChange={value => setAttendanceForm(current => ({ ...current, status: value }))} options={['Present', 'Late', 'Absent']} />
        <TextAreaField label="Note" value={attendanceForm.note} onChange={value => setAttendanceForm(current => ({ ...current, note: value }))} />
      </Modal>
    </div>
  );
}
