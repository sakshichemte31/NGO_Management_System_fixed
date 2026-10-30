import { Users, Building2, ClipboardList, BarChart3 } from 'lucide-react';
import { ReportGrid, ACCENT } from '../../../components/people';
import { departments, type Employee, type Requirement } from './data';

export default function ReportsTab({ employees, requirements }: { employees: Employee[]; requirements: Requirement[] }) {
  return <ReportGrid accent={ACCENT.hr} reports={[
    { title: 'Employee Report', description: 'Full employee directory with role, status and join date.', icon: <Users size={18} />, rows: employees.map(e => ({ ID: e.id, Name: e.name, Department: e.dept, Role: e.role, Status: e.status, Joined: e.joinDate })) },
    { title: 'Department Report', description: 'Headcount and head per department.', icon: <Building2 size={18} />, rows: departments.map(d => ({ Department: d.name, Head: d.head, Employees: employees.filter(e => e.dept === d.name).length })) },
    { title: 'Requirement Report', description: 'Open and filled hiring requirements.', icon: <ClipboardList size={18} />, rows: requirements.map(r => ({ ID: r.id, Role: r.role, Department: r.dept, Positions: r.positions, Urgency: r.urgency, Status: r.status })) },
    { title: 'Attendance & Performance Report', description: 'Attendance percentage and latest rating per employee.', icon: <BarChart3 size={18} />, rows: employees.map(e => ({ Name: e.name, 'Attendance %': e.attendance, Rating: e.rating })) },
  ]} />;
}
