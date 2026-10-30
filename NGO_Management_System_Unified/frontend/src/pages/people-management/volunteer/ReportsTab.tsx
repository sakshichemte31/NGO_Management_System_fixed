import { Users, CalendarCheck, ClipboardList, TrendingUp, PieChart } from 'lucide-react';
import { ReportGrid, ACCENT } from '../../../components/people';
import type { Assignment, AttendanceRec, Volunteer } from './data';

export default function ReportsTab({ volunteers, assignments, records }: { volunteers: Volunteer[]; assignments: Assignment[]; records: AttendanceRec[] }) {
  const name = (id: string) => volunteers.find(v => v.id === id)?.name ?? id;
  return <ReportGrid accent={ACCENT.volunteer} reports={[
    { title: 'Volunteer Report', description: 'Roster with skills, hours and status.', icon: <Users size={18} />, rows: volunteers.map(v => ({ ID: v.id, Name: v.name, City: v.city, Skills: v.skills.join('; '), Hours: v.hours, Status: v.status })) },
    { title: 'Attendance Report', description: 'Event and project attendance records.', icon: <CalendarCheck size={18} />, rows: records.map(r => ({ Date: r.date, Volunteer: name(r.volunteerId), Type: r.kind, Target: r.target, Status: r.status, Hours: r.hours })) },
    { title: 'Assignment Report', description: 'Project and event assignments.', icon: <ClipboardList size={18} />, rows: assignments.map(a => ({ ID: a.id, Volunteer: name(a.volunteerId), Type: a.kind, Target: a.target, Role: a.role, Status: a.status })) },
    { title: 'Performance Report', description: 'Task completion, hours and rating.', icon: <TrendingUp size={18} />, rows: volunteers.map(v => ({ Name: v.name, 'Tasks done': v.tasksDone, 'Tasks total': v.tasksTotal, Hours: v.hours, Rating: v.rating })) },
    { title: 'Participation Summary', description: 'Assignments and attendance count per volunteer.', icon: <PieChart size={18} />, rows: volunteers.map(v => ({ Name: v.name, Assignments: assignments.filter(a => a.volunteerId === v.id).length, 'Attendance entries': records.filter(r => r.volunteerId === v.id).length })) },
  ]} />;
}
