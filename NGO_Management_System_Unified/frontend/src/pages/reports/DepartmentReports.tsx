import { Building2, Download } from 'lucide-react';

const departments = [
  { name: 'Project Management', head: 'Priya Sharma', projects: 12, tasksCompleted: '94%', openIssues: 2, budget: '₹1.2Cr', status: 'On Track' },
  { name: 'Administration', head: 'Ravi Kumar', projects: 5, tasksCompleted: '98%', openIssues: 0, budget: '₹28L', status: 'On Track' },
  { name: 'Data & Technology', head: 'Rahul Mehta', projects: 8, tasksCompleted: '89%', openIssues: 3, budget: '₹45L', status: 'Needs Attention' },
  { name: 'Finance', head: 'Anita Gupta', projects: 4, tasksCompleted: '96%', openIssues: 1, budget: '₹18L', status: 'On Track' },
  { name: 'HR', head: 'Sunita Roy', projects: 6, tasksCompleted: '92%', openIssues: 2, budget: '₹22L', status: 'On Track' },
  { name: 'Risk Management', head: 'Asha Iyer', projects: 3, tasksCompleted: '88%', openIssues: 4, budget: '₹12L', status: 'Review Required' },
  { name: 'Operations', head: 'Vikram Singh', projects: 14, tasksCompleted: '91%', openIssues: 1, budget: '₹65L', status: 'On Track' },
  { name: 'Marketing & Networking', head: 'Deepika Rao', projects: 5, tasksCompleted: '85%', openIssues: 2, budget: '₹20L', status: 'Needs Attention' },
  { name: 'Research & Innovation', head: 'Dr. Arjun Nair', projects: 3, tasksCompleted: '90%', openIssues: 1, budget: '₹30L', status: 'On Track' },
];

const statusStyle: Record<string, string> = {
  'On Track': 'badge badge-green',
  'Needs Attention': 'badge badge-yellow',
  'Review Required': 'badge badge-red',
};

export default function DepartmentReports() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Department Reports</h1>
          <p className="page-subtitle">Performance overview across all 9 organizational departments</p>
        </div>
        <button className="btn-secondary"><Download size={15} /> Export All</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Departments', value: '9', color: '#1AACB8' },
          { label: 'Avg Task Completion', value: '91.4%', color: '#10B981' },
          { label: 'Depts On Track', value: '6/9', color: '#6366F1' },
          { label: 'Open Issues', value: '16', color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-2xl font-extrabold" style={{ color: s.color, fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((dept, i) => (
          <div key={i} className="card hover:shadow-md transition-shadow">
            <div className="card-body flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ background: '#E6F7F9' }}>
                    <Building2 size={16} style={{ color: '#1AACB8' }} />
                  </div>
                  <span className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{dept.name}</span>
                </div>
                <span className={statusStyle[dept.status]}>{dept.status}</span>
              </div>
              <div className="text-xs text-slate-500">Head: {dept.head}</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400">Active Projects</div>
                  <div className="font-bold text-slate-800">{dept.projects}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400">Task Completion</div>
                  <div className="font-bold text-teal-600">{dept.tasksCompleted}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400">Open Issues</div>
                  <div className={`font-bold ${dept.openIssues > 2 ? 'text-red-500' : 'text-slate-800'}`}>{dept.openIssues}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-slate-400">Budget</div>
                  <div className="font-bold text-slate-800">{dept.budget}</div>
                </div>
              </div>
              <button className="btn-secondary text-xs py-1.5">View Department Report</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
