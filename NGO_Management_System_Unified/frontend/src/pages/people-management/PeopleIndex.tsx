import { Link } from 'react-router-dom';
import { Briefcase, GraduationCap, UserCheck, ArrowRight, type LucideIcon } from 'lucide-react';
import { PageHeader, ACCENT } from '../../components/people';

const MODULES: { to: string; title: string; desc: string; color: string; Icon: LucideIcon; tabs: string[] }[] = [
  { to: '/people-management/hr', title: 'HR Management', desc: 'Employees, departments, requirements, attendance & performance.', color: ACCENT.hr, Icon: Briefcase, tabs: ['Dashboard', 'Departments', 'Employees', 'Requirements', 'Attendance & Leave', 'Performance', 'Reports'] },
  { to: '/people-management/interns', title: 'Intern Management', desc: 'Applications pipeline, internship work, feedback & certificates.', color: ACCENT.intern, Icon: GraduationCap, tabs: ['Dashboard', 'Applications', 'Intern List', 'Internship Work', 'Attendance & Feedback', 'Completion & Certificate', 'Reports'] },
  { to: '/people-management/volunteers', title: 'Volunteer Management', desc: 'Applications, assignments, availability, attendance & recognition.', color: ACCENT.volunteer, Icon: UserCheck, tabs: ['Dashboard', 'Applications', 'Volunteer List', 'Assignments', 'Skills & Availability', 'Attendance', 'Performance & Feedback', 'Certificates & Recognition', 'Reports'] },
];

export default function PeopleIndex() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="People Management" subtitle="Choose a module to manage employees, interns or volunteers" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {MODULES.map(({ to, title, desc, color, Icon, tabs }) => (
          <Link key={to} to={to} className="card group flex min-h-[228px] flex-col gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" style={{ borderTop: `3px solid ${color}` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg p-3" style={{ background: `${color}1A`, color }}><Icon size={23} /></div>
              <span className="badge badge-gray">{tabs.length} work areas</span>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{title}</h2>
              <p className="mt-1.5 text-sm leading-5 text-slate-500">{desc}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tabs.slice(0, 2).map(t => <span key={t} className="badge badge-gray">{t}</span>)}
              {tabs.length > 2 && <span className="badge badge-gray">+{tabs.length - 2} more</span>}
            </div>
            <span className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-semibold text-primary-dark">
              Explore module <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} />
            </span>
          </Link>))}
      </div>
    </div>
  );
}
