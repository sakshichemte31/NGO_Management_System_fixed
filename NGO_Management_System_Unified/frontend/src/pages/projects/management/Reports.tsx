import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAsync } from '../../../hooks/useAsync';
import { useReport } from '../../../hooks/useProjectData';
import { useToast } from '../../../components/projects/Toast';
import Async from '../../../components/projects/Async';
import Section from '../../../components/projects/Section';
import KpiCard from '../../../components/projects/KpiCard';
import DataTable from '../../../components/projects/DataTable';
import RoleSwitcher from '../../../components/projects/RoleSwitcher';
import { SkeletonBlock } from '../../../components/projects/Skeleton';
import { fmtDateTime } from '../../../lib/format';
import type { ReportType } from '../../../types/project';
import { apiList, downloadApiFile } from '../../../services/apiClient';

const TYPES: { key: ReportType; label: string; desc: string }[] = [
  { key: 'progress', label: 'Progress', desc: 'Stage, progress and task completion' }, { key: 'budget', label: 'Budget', desc: 'Planned vs spent (A+B+C)' },
  { key: 'impact', label: 'Impact', desc: 'KPI target vs achieved' }, { key: 'department', label: 'Department', desc: 'Checklist readiness for 9 departments' },
  { key: 'stakeholder', label: 'Stakeholder', desc: 'Stakeholders, partners, volunteers' },
];
const COLORS = ['#1AACB8', '#6366F1', '#F59E0B', '#10B981'];

export default function Reports() {
  const toast = useToast();
  const [type, setType] = useState<ReportType>('progress');
  const [projectId, setProjectId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // Reports are generated from the database, so the filter must list database projects (UUID ids),
  // not the in-memory mock projects used by the All Projects page.
  const projectList = useAsync(() => apiList<{ id: string; name: string }>('projects', { limit: 200, sort: 'name' }), []);
  const projects = projectList.data?.items ?? [];
  const dateErr = from && to && to < from ? '“To” date must be after “From” date' : '';
  const state = useReport(type, { projectId: projectId || undefined, from: dateErr ? undefined : from || undefined, to: dateErr ? undefined : to || undefined });
  const noDates = type === 'department' || type === 'stakeholder';
  const exportQuery = new URLSearchParams();
  if (projectId && /^[0-9a-f-]{36}$/i.test(projectId)) exportQuery.set('projectId', projectId);
  if (!noDates && from && !dateErr) exportQuery.set('from', from);
  if (!noDates && to && !dateErr) exportQuery.set('to', to);
  const exportSuffix = exportQuery.toString() ? `?${exportQuery.toString()}` : '';

  const exportCsv = async () => {
    try {
      await downloadApiFile(`/reports/${type}/export${exportSuffix}`, `${type}-report.csv`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Report export failed.');
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header !mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="page-title">Project Reports</h1><p className="page-subtitle">Generate, preview and export project reports</p></div>
        <div className="flex gap-2 items-center flex-wrap"><RoleSwitcher /><Link to="/projects" className="btn-secondary">All projects</Link></div>
      </div>

      <div className="tab-bar self-start max-w-full overflow-x-auto" role="tablist" aria-label="Report type">
        {TYPES.map(t => <button key={t.key} role="tab" aria-selected={type === t.key} className={`tab-item whitespace-nowrap ${type === t.key ? 'active' : ''}`} onClick={() => setType(t.key)}>{t.label}</button>)}
      </div>

      <div className="card"><div className="card-body grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="lg:col-span-2"><label className="form-label" htmlFor="rp">Project</label>
          <select id="rp" className="form-input" value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">All projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className="form-label" htmlFor="rf">From</label><input id="rf" type="date" className="form-input" value={from} disabled={noDates} onChange={e => setFrom(e.target.value)} /></div>
        <div><label className="form-label" htmlFor="rt">To</label><input id="rt" type="date" className="form-input" value={to} disabled={noDates} onChange={e => setTo(e.target.value)} aria-invalid={!!dateErr} /></div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => window.print()}><Download size={14} /> Print / PDF</button>
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => void exportCsv()}><FileSpreadsheet size={14} /> Excel CSV</button>
        </div>
        {projectList.data && projectList.data.total === 0 && <p className="text-xs text-amber-600 sm:col-span-2 lg:col-span-5">No projects exist in the database yet, so reports will be empty. Run <code>flask --app wsgi seed-demo</code> for demo data.</p>}
        {projectList.error && <p role="alert" className="text-xs text-red-600 sm:col-span-2 lg:col-span-5">Couldn’t load the project list: {projectList.error}</p>}
        {dateErr && <p role="alert" className="text-xs text-red-600 sm:col-span-2 lg:col-span-5">{dateErr}</p>}
        {noDates && <p className="text-[11px] text-slate-400 sm:col-span-2 lg:col-span-5">{TYPES.find(t => t.key === type)!.desc}. Date filters don’t apply to this report.</p>}
      </div></div>

      <Async state={state} skeleton={<SkeletonBlock h="h-96" />}>{r => (
        <div className="flex flex-col gap-5">
          <div className="text-xs text-slate-400">{r.title} · generated {fmtDateTime(r.generatedAt)}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{r.kpis.map((k, i) => <KpiCard key={k.label} label={k.label} value={k.value} color={COLORS[i % 4]} />)}</div>
          <Section title="Chart">
            <div className="h-80" role="img" aria-label={`${r.title} chart`}><ResponsiveContainer width="100%" height="100%">
              {r.chart.kind === 'pie' ? (
                <PieChart><Pie data={r.chart.data} dataKey={r.chart.series[0].key} nameKey={r.chart.xKey} outerRadius={110}>{r.chart.data.map((_, i) => <Cell key={i} fill={COLORS[i % 4]} />)}</Pie><Tooltip /><Legend /></PieChart>
              ) : (
                <BarChart data={r.chart.data} margin={{ bottom: 30 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey={r.chart.xKey} tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend verticalAlign="top" />
                  {r.chart.series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i % 4]} radius={[4, 4, 0, 0]} />)}</BarChart>
              )}
            </ResponsiveContainer></div>
          </Section>
          <Section title="Data" flush>
            <DataTable caption={r.title} rows={r.table.rows.map((row, i) => ({ i, row }))} rowKey={x => String(x.i)} emptyTitle="No data for these filters"
              columns={r.table.columns.map((c, ci) => ({ key: c, header: c, render: (x: { row: (string | number)[] }) => String(x.row[ci]) }))} />
          </Section>
        </div>
      )}</Async>
    </div>
  );
}
