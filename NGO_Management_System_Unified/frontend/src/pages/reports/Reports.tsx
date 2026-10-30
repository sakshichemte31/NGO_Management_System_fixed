import { useState } from 'react';
import { Download, BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react';
import usePersistentState from '../../hooks/usePersistentState';
import { Modal, SelectField, TextField } from '../../components/people';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const projectMetrics = [
  { month: 'Jan', completed: 2, active: 10, new: 3 },
  { month: 'Feb', completed: 1, active: 12, new: 2 },
  { month: 'Mar', completed: 3, active: 11, new: 4 },
  { month: 'Apr', completed: 2, active: 13, new: 2 },
  { month: 'May', completed: 4, active: 11, new: 3 },
  { month: 'Jun', completed: 1, active: 13, new: 5 },
  { month: 'Jul', completed: 3, active: 15, new: 2 },
  { month: 'Aug', completed: 2, active: 14, new: 3 },
  { month: 'Sep', completed: 4, active: 13, new: 1 },
  { month: 'Oct', completed: 2, active: 12, new: 3 },
];

const taskCompletion = [
  { dept: 'Project Mgmt', total: 145, completed: 128 },
  { dept: 'HR', total: 62, completed: 58 },
  { dept: 'Finance', total: 88, completed: 82 },
  { dept: 'Operations', total: 210, completed: 188 },
  { dept: 'Marketing', total: 74, completed: 65 },
];

const impactMetrics = [
  { quarter: 'Q1', beneficiaries: 5400, projects: 8, volunteers: 840 },
  { quarter: 'Q2', beneficiaries: 7200, projects: 11, volunteers: 980 },
  { quarter: 'Q3', beneficiaries: 9800, projects: 14, volunteers: 1150 },
  { quarter: 'Q4 (est)', beneficiaries: 12000, projects: 15, volunteers: 1284 },
];

interface ReportRecord { name: string; type: string; date: string; format: 'CSV' }

const initialReportList: ReportRecord[] = [
  { name: 'Project Status Report – Q3 2025', type: 'Project', date: '1 Oct 2025', format: 'CSV' },
  { name: 'Donor Analytics – September 2025', type: 'Donor', date: '5 Oct 2025', format: 'CSV' },
  { name: 'Financial Summary – H1 2025', type: 'Financial', date: '15 Jul 2025', format: 'CSV' },
  { name: 'Volunteer Engagement Report', type: 'People', date: '30 Sep 2025', format: 'CSV' },
  { name: 'Beneficiary Impact Report 2025', type: 'Impact', date: '20 Sep 2025', format: 'CSV' },
  { name: 'Monthly Trends – September', type: 'Analytics', date: '2 Oct 2025', format: 'CSV' },
];

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

const typeStyle: Record<string, string> = {
  Project: 'badge badge-teal',
  Donor: 'badge badge-blue',
  Financial: 'badge badge-green',
  People: 'badge badge-purple',
  Impact: 'badge badge-yellow',
  Analytics: 'badge badge-gray',
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [reports, setReports] = usePersistentState<ReportRecord[]>('reports.generated', initialReportList);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState('Project');

  const reportRows = (report: ReportRecord): string[][] => {
    if (report.type === 'Project') return [['Month', 'Completed Projects', 'Active Projects', 'New Projects'], ...projectMetrics.map(row => [row.month, String(row.completed), String(row.active), String(row.new)])];
    if (report.type === 'Impact') return [['Quarter', 'Beneficiaries', 'Projects', 'Volunteers'], ...impactMetrics.map(row => [row.quarter, String(row.beneficiaries), String(row.projects), String(row.volunteers)])];
    if (report.type === 'People') return [['Department', 'Total Tasks', 'Completed Tasks'], ...taskCompletion.map(row => [row.dept, String(row.total), String(row.completed)])];
    if (report.type === 'Analytics') return [['Quarter', 'Beneficiaries', 'Projects', 'Volunteers'], ...impactMetrics.map(row => [row.quarter, String(row.beneficiaries), String(row.projects), String(row.volunteers)])];
    return [['Metric', 'Value'], ...(report.type === 'Financial'
      ? [['Financial Efficiency', '78.4%'], ['Task Completion Rate', '91.2%']]
      : [['Engagement Analytics', '82%'], ['Beneficiary Growth', '+4,820']])];
  };

  const downloadReport = (report: ReportRecord) => {
    const filename = `${report.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    downloadCsv(filename, reportRows(report));
  };

  const generateReport = () => {
    if (!reportName.trim()) return;
    const report: ReportRecord = {
      name: reportName.trim(), type: reportType,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), format: 'CSV',
    };
    setReports(current => [report, ...current]);
    downloadReport(report);
    setReportName('');
    setGenerateOpen(false);
    setActiveTab('reports');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Comprehensive reporting across all Hope Foundation activities</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => downloadCsv('hope-foundation-reports.csv', [['Report Name', 'Type', 'Date', 'Format'], ...reports.map(report => [report.name, report.type, report.date, report.format])])}><Download size={15} /> Export All</button>
          <button className="btn-primary" onClick={() => setGenerateOpen(true)}>Generate Report</button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Task Completion Rate', value: '91.2%', trend: '+3%', icon: <BarChart3 size={18} />, color: '#1AACB8' },
          { label: 'Engagement Analytics', value: '82%', trend: '+5%', icon: <TrendingUp size={18} />, color: '#10B981' },
          { label: 'Beneficiary Growth', value: '+4,820', trend: 'YTD', icon: <Users size={18} />, color: '#6366F1' },
          { label: 'Financial Efficiency', value: '78.4%', trend: '+2%', icon: <DollarSign size={18} />, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: s.color + '15' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-[11px] text-green-500 font-semibold">{s.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tab-bar w-fit">
        {['analytics', 'impact', 'reports'].map(t => (
          <button key={t} className={`tab-item capitalize ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <div className="card-header"><span className="card-title">Project Lifecycle (2025)</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={projectMetrics}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="active" stroke="#1AACB8" fill="#E6F7F9" strokeWidth={2} name="Active" />
                    <Area type="monotone" dataKey="completed" stroke="#10B981" fill="#D1FAE5" strokeWidth={2} name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Task Completion by Department</span></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={taskCompletion} layout="vertical" barSize={14}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="dept" type="category" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="total" fill="#F1F5F9" radius={[0, 3, 3, 0]} name="Total" />
                    <Bar dataKey="completed" fill="#1AACB8" radius={[0, 3, 3, 0]} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Monthly / Quarterly Trends</span></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={impactMetrics}>
                  <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="beneficiaries" stroke="#1AACB8" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="volunteers" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'impact' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Beneficiaries Reached', value: '24,670', change: '+4,820 YTD', icon: '❤️' },
            { title: 'Projects Completed', value: '18', change: '+5 this year', icon: '✅' },
            { title: 'Volunteer Hours', value: '48,200', change: '+12,400 this year', icon: '⏰' },
            { title: 'Communities Served', value: '84', change: '+18 new', icon: '🏘️' },
            { title: 'States Covered', value: '12', change: 'Across India', icon: '🗺️' },
            { title: 'SDG Goals Addressed', value: '7', change: 'Out of 17', icon: '🌍' },
          ].map(m => (
            <div key={m.title} className="stat-card flex items-center gap-4">
              <span className="text-3xl">{m.icon}</span>
              <div>
                <div className="text-2xl font-extrabold text-slate-800" style={{ fontFamily: 'Nunito, sans-serif' }}>{m.value}</div>
                <div className="text-sm font-semibold text-slate-700">{m.title}</div>
                <div className="text-xs text-teal-600 font-semibold">{m.change}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <span className="card-title">Generated Reports</span>
            <span className="text-xs text-slate-400">{reports.length} reports</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>Report Name</th><th>Type</th><th>Date</th><th>Format</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={`${r.name}-${r.date}`}>
                    <td className="font-semibold text-slate-800">{r.name}</td>
                    <td><span className={typeStyle[r.type]}>{r.type}</span></td>
                    <td className="text-xs">{r.date}</td>
                    <td>
                      <span className="badge badge-green">{r.format}</span>
                    </td>
                    <td>
                      <button className="btn-secondary text-xs py-1 flex items-center gap-1" onClick={() => downloadReport(r)}>
                        <Download size={12} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Report" submitLabel="Generate & Download" onSubmit={generateReport}>
        <TextField label="Report name" value={reportName} onChange={setReportName} required wide />
        <SelectField label="Report type" value={reportType} onChange={setReportType} options={['Project', 'Donor', 'Financial', 'People', 'Impact', 'Analytics']} />
      </Modal>
    </div>
  );
}
