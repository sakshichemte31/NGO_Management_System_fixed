import { GraduationCap, UserCheck, Inbox, Search, Award } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatCard, ACCENT } from '../../../components/people';
import { STAGES, type Applicant, type Intern } from './data';

const COLORS = ['#94A3B8', '#3B82F6', '#8B5CF6', '#1AACB8', '#EF4444'];
const TOOLTIP_STYLE = { borderRadius: 8, border: '1px solid #DCE7E4', boxShadow: '0 8px 24px rgb(35 61 57 / 10%)', fontSize: 12 };

export default function DashboardTab({ applicants, interns }: { applicants: Applicant[]; interns: Intern[] }) {
  const stageCounts = STAGES.map((stage, i) => {
    const count = applicants.filter(a => a.stage === stage).length;
    return { stage, count, share: applicants.length ? Math.round(count / applicants.length * 100) : 0, fill: COLORS[i] };
  });
  const progress = interns.map(intern => ({ name: intern.name, project: intern.project, progress: intern.progress, status: intern.status }));
  const done = interns.filter(i => i.status === 'Completed').length;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Interns" value={interns.length} icon={<GraduationCap size={18} />} color={ACCENT.intern} />
        <StatCard label="Active Interns" value={interns.filter(i => i.status === 'Active').length} icon={<UserCheck size={18} />} color="#1AACB8" />
        <StatCard label="Pending Applications" value={applicants.filter(a => a.stage === 'New').length} icon={<Inbox size={18} />} color="#F59E0B" />
        <StatCard label="Applications Under Review" value={applicants.filter(a => a.stage === 'Under Review').length} icon={<Search size={18} />} color="#3B82F6" />
        <StatCard label="Completion Status" value={`${done}/${interns.length}`} icon={<Award size={18} />} color={ACCENT.intern} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card min-w-0">
          <div className="card-header items-start">
            <div><h2 className="card-title">Applications by Stage</h2><p className="mt-1 text-xs text-slate-500">Applicants by current review stage</p></div>
            <span className="badge badge-teal">{applicants.length} total</span>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageCounts} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 4 }} barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 5" stroke="#E8EEF4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis type="category" dataKey="stage" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, _name, item) => [`${value} (${item.payload.share}%)`, 'Applicants']} cursor={{ fill: '#F2F7F5' }} />
                <Bar dataKey="count" name="Applicants" radius={[0, 5, 5, 0]} maxBarSize={28}>
                  {stageCounts.map(stage => <Cell key={stage.stage} fill={stage.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card min-w-0">
          <div className="card-header items-start">
            <div><h2 className="card-title">Intern Progress</h2><p className="mt-1 text-xs text-slate-500">Project completion by intern</p></div>
            <span className="badge badge-gray">{interns.length} interns</span>
          </div>
          <div className="card-body" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progress} layout="vertical" margin={{ top: 8, right: 28, bottom: 8, left: 4 }} barCategoryGap={14}>
                <CartesianGrid strokeDasharray="3 5" stroke="#E8EEF4" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={value => `${value}%`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis type="category" dataKey="name" width={116} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={value => [`${value}%`, 'Progress']} labelFormatter={(_, payload) => payload[0]?.payload.project ?? ''} cursor={{ fill: '#F2F7F5' }} />
                <Bar dataKey="progress" name="Progress" fill={ACCENT.intern} radius={[0, 5, 5, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
