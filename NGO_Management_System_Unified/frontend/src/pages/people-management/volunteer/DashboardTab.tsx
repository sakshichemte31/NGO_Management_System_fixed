import { Users, UserCheck, Inbox, CalendarClock } from 'lucide-react';
import { StatCard, StatusBadge, ACCENT } from '../../../components/people';
import type { Assignment, VApplication, Volunteer } from './data';

interface Props { volunteers: Volunteer[]; applications: VApplication[]; assignments: Assignment[] }

export default function DashboardTab({ volunteers, applications, assignments }: Props) {
  const name = (id: string) => volunteers.find(v => v.id === id)?.name ?? id;
  const feed = [
    ...applications.filter(a => a.status === 'New').map(a => ({ k: a.id, text: `${a.name} applied to volunteer`, when: a.appliedOn, tag: 'New' })),
    ...assignments.map(a => ({ k: a.id, text: `${name(a.volunteerId)} — ${a.role} @ ${a.target}`, when: a.date, tag: a.status })),
  ].slice(0, 7);
  const upcoming = assignments.filter(a => a.status === 'Upcoming');
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Volunteers" value={volunteers.length} icon={<Users size={18} />} color={ACCENT.volunteer} />
        <StatCard label="Active Volunteers" value={volunteers.filter(v => v.status === 'Active').length} icon={<UserCheck size={18} />} color="#10B981" />
        <StatCard label="Pending Applications" value={applications.filter(a => a.status === 'New' || a.status === 'Under Review').length} icon={<Inbox size={18} />} color="#F59E0B" />
        <StatCard label="Upcoming Assignments" value={upcoming.length} icon={<CalendarClock size={18} />} color="#1AACB8" />
      </div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Recent Activity</h2></div>
        <ul className="card-body flex flex-col divide-y divide-slate-100 !py-2">
          {feed.map(f => (
            <li key={f.k} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0"><div className="text-sm text-slate-800 truncate">{f.text}</div><div className="text-xs text-slate-400">{f.when}</div></div>
              <StatusBadge status={f.tag} />
            </li>))}
        </ul>
      </div>
    </div>
  );
}
