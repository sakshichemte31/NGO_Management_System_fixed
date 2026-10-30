import { Users, UserCheck, Building2, ClipboardList, UserPlus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, StatCard, ACCENT } from '../../../components/people';
import { DEPT_NAMES, type Employee, type Requirement } from './data';

interface Props { employees: Employee[]; requirements: Requirement[] }

export default function DashboardTab({ employees, requirements }: Props) {
  const pending = requirements.filter(r => r.status !== 'Filled').length;
  const currentYear = new Date().getFullYear();
  const recent = employees.filter(e => new Date(e.joinDate).getFullYear() === currentYear).length;
  const chart = DEPT_NAMES.map(d => ({ name: d.length > 12 ? d.split(' ')[0] : d, full: d, count: employees.filter(e => e.dept === d).length }));
  const joiners = [...employees].sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Employees" value={employees.length} icon={<Users size={18} />} color="#1AACB8" />
        <StatCard label="Active Employees" value={employees.filter(e => e.status === 'Active').length} icon={<UserCheck size={18} />} color="#10B981" />
        <StatCard label="Departments" value={DEPT_NAMES.length} icon={<Building2 size={18} />} color={ACCENT.hr} />
        <StatCard label="Pending Requirements" value={pending} icon={<ClipboardList size={18} />} color="#F59E0B" />
        <StatCard label="New Employees (YTD)" value={recent} icon={<UserPlus size={18} />} color="#1AACB8" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <div className="card-header"><h2 className="card-title">Headcount by Department</h2></div>
          <div className="card-body" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload.full ?? ''} />
                <Bar dataKey="count" name="Employees" fill="#1AACB8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h2 className="card-title">Recent Joiners</h2></div>
          <ul className="card-body flex flex-col gap-3">
            {joiners.map(e => (
              <li key={e.id} className="flex items-center gap-3">
                <Avatar name={e.name} color={ACCENT.hr} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-slate-800 truncate">{e.name}</div>
                  <div className="text-xs text-slate-500 truncate">{e.role} · {e.dept}</div>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{e.joinDate}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
