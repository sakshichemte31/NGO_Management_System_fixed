import { FileText, GraduationCap, TrendingUp, Award } from 'lucide-react';
import { ReportGrid, ACCENT } from '../../../components/people';
import type { Applicant, Intern } from './data';

export default function ReportsTab({ applicants, interns }: { applicants: Applicant[]; interns: Intern[] }) {
  return <ReportGrid accent={ACCENT.intern} reports={[
    { title: 'Application Report', description: 'All applications with stage and college.', icon: <FileText size={18} />, rows: applicants.map(a => ({ ID: a.id, Name: a.name, Position: a.position, College: a.college, Stage: a.stage })) },
    { title: 'Intern Report', description: 'Intern roster with mentor and duration.', icon: <GraduationCap size={18} />, rows: interns.map(i => ({ ID: i.id, Name: i.name, Department: i.dept, Mentor: i.mentor, Start: i.start, End: i.end, Status: i.status })) },
    { title: 'Progress Report', description: 'Progress, attendance and rating per intern.', icon: <TrendingUp size={18} />, rows: interns.map(i => ({ Name: i.name, 'Progress %': i.progress, 'Attendance %': i.attendance, Rating: i.rating })) },
    { title: 'Completion Report', description: 'Completion status and certificate state.', icon: <Award size={18} />, rows: interns.map(i => ({ Name: i.name, Status: i.status, Certificate: i.certificate })) },
  ]} />;
}
