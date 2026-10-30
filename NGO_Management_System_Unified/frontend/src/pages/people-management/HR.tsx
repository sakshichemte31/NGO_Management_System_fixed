import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, PageTabs, ACCENT } from '../../components/people';
import usePersistentState from '../../hooks/usePersistentState';
import DashboardTab from './hr/DashboardTab';
import DepartmentsTab from './hr/DepartmentsTab';
import EmployeesTab from './hr/EmployeesTab';
import RequirementsTab from './hr/RequirementsTab';
import AttendanceTab from './hr/AttendanceTab';
import PerformanceTab from './hr/PerformanceTab';
import ReportsTab from './hr/ReportsTab';
import { attendancePercentage, initialEmployees, initialLeaves, initialRequirements, type AttendanceEntry, type Employee, type EmpStatus, type LeaveRecord, type Requirement } from './hr/data';
import type { RatingReview } from '../../lib/peopleRating';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' }, { id: 'departments', label: 'Departments' }, { id: 'employees', label: 'Employees' },
  { id: 'requirements', label: 'Requirements' }, { id: 'attendance', label: 'Attendance & Leave' }, { id: 'performance', label: 'Performance' }, { id: 'reports', label: 'Reports' },
];

export default function HRPage() {
  const [tab, setTab] = useState('dashboard');
  const [employees, setEmployees] = usePersistentState<Employee[]>('people.hr.employees', initialEmployees);
  const [requirements, setRequirements] = usePersistentState<Requirement[]>('people.hr.requirements', initialRequirements);
  const [leaves, setLeaves] = usePersistentState<LeaveRecord[]>('people.hr.leaves', initialLeaves);
  const [attendanceEntries, setAttendanceEntries] = usePersistentState<AttendanceEntry[]>('people.hr.attendance.entries', []);
  const [addOpen, setAddOpen] = useState(false);

  const markAttendance = (entry: AttendanceEntry) => {
    const updated = [entry, ...attendanceEntries.filter(existing => existing.employeeId !== entry.employeeId || existing.date !== entry.date)];
    setAttendanceEntries(updated);
    const attendance = attendancePercentage(updated.filter(item => item.employeeId === entry.employeeId));
    if (attendance !== null) setEmployees(current => current.map(employee => employee.id === entry.employeeId ? { ...employee, attendance } : employee));
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="HR Management" subtitle="Manage employees, departments, requirements, attendance, and performance"
        action={<button className="btn-primary" onClick={() => { setTab('employees'); setAddOpen(true); }}><Plus size={16} /> Add Employee</button>} />
      <PageTabs tabs={TABS} active={tab} onChange={setTab} accent={ACCENT.hr} />
      {tab === 'dashboard' && <DashboardTab employees={employees} requirements={requirements} />}
      {tab === 'departments' && <DepartmentsTab employees={employees} requirements={requirements} />}
      {tab === 'employees' && <EmployeesTab employees={employees} leaves={leaves} attendanceEntries={attendanceEntries} onAdd={e => setEmployees(p => [e, ...p])} onUpdate={updated => setEmployees(current => current.map(employee => employee.id === updated.id ? updated : employee))} onStatus={(id, status: EmpStatus) => setEmployees(p => p.map(e => e.id === id ? { ...e, status } : e))} addOpen={addOpen} setAddOpen={setAddOpen} />}
      {tab === 'requirements' && <RequirementsTab requirements={requirements} onAdd={r => setRequirements(p => [r, ...p])} onStatus={(id, s) => setRequirements(p => p.map(r => r.id === id ? { ...r, status: s } : r))} />}
      {tab === 'attendance' && <AttendanceTab employees={employees} leaves={leaves} attendanceEntries={attendanceEntries} onLeave={(id, s) => setLeaves(p => p.map(l => l.id === id ? { ...l, status: s } : l))} onAddLeave={leave => setLeaves(current => [leave, ...current])} onAddAttendance={markAttendance} />}
      {tab === 'performance' && <PerformanceTab employees={employees} onRate={(id, review: RatingReview) => setEmployees(current => current.map(employee => employee.id === id ? { ...employee, rating: review.rating, ratingReviews: [...(employee.ratingReviews ?? []), review] } : employee))} />}
      {tab === 'reports' && <ReportsTab employees={employees} requirements={requirements} />}
    </div>
  );
}
