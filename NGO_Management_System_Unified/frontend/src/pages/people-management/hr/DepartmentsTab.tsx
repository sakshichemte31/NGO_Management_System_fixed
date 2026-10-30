import { useState } from 'react';
import { DataTable, DetailDrawer, InfoGrid, SectionTitle, StatusBadge, ACCENT, Avatar, type Column } from '../../../components/people';
import { departments, type Department, type Employee, type Requirement } from './data';

interface Props { employees: Employee[]; requirements: Requirement[] }

export default function DepartmentsTab({ employees, requirements }: Props) {
  const [sel, setSel] = useState<Department | null>(null);
  const count = (d: string) => employees.filter(e => e.dept === d).length;

  const cols: Column<Department>[] = [
    { header: 'Department', render: d => <span className="font-semibold text-slate-800">{d.name}</span> },
    { header: 'Head', render: d => d.head },
    { header: 'Employees', render: d => count(d.name) },
    { header: 'Active', render: d => employees.filter(e => e.dept === d.name && e.status === 'Active').length },
    { header: 'Open Requirements', render: d => requirements.filter(r => r.dept === d.name && r.status !== 'Filled').length },
  ];
  const deptEmps = sel ? employees.filter(e => e.dept === sel.name) : [];
  const deptReqs = sel ? requirements.filter(r => r.dept === sel.name) : [];

  return (
    <>
      <div className="card overflow-hidden">
        <div className="card-header"><h2 className="card-title">All Departments</h2><span className="text-xs text-slate-400">Click a row for details</span></div>
        <DataTable columns={cols} rows={departments} rowKey={d => d.name} onRowClick={setSel} />
      </div>
      <DetailDrawer open={!!sel} onClose={() => setSel(null)} title={sel?.name ?? ''} subtitle={sel?.description} accent={ACCENT.hr}>
        {sel && (
          <div className="flex flex-col gap-6">
            <section>
              <SectionTitle>Department Head</SectionTitle>
              <div className="flex items-center gap-3"><Avatar name={sel.head} color={ACCENT.hr} size={44} /><div><div className="font-semibold text-slate-800">{sel.head}</div><div className="text-xs text-slate-500">Head of {sel.name}</div></div></div>
            </section>
            <section>
              <SectionTitle>Employees ({deptEmps.length})</SectionTitle>
              {deptEmps.length ? (
                <ul className="divide-y divide-slate-100">{deptEmps.map(e => (
                  <li key={e.id} className="py-2 flex items-center justify-between gap-2"><span className="text-sm text-slate-800">{e.name} <span className="text-xs text-slate-400">· {e.role}</span></span><StatusBadge status={e.status} /></li>
                ))}</ul>
              ) : <p className="text-sm text-slate-500">No employees in this department.</p>}
            </section>
            <section>
              <SectionTitle>Requirements ({deptReqs.length})</SectionTitle>
              {deptReqs.length ? (
                <ul className="divide-y divide-slate-100">{deptReqs.map(r => (
                  <li key={r.id} className="py-2 flex items-center justify-between gap-2"><span className="text-sm text-slate-800">{r.role} <span className="text-xs text-slate-400">· {r.positions} position(s)</span></span><StatusBadge status={r.status} /></li>
                ))}</ul>
              ) : <p className="text-sm text-slate-500">No requirements raised.</p>}
            </section>
            <section>
              <SectionTitle>Department Reports</SectionTitle>
              <InfoGrid items={[
                ['Headcount', deptEmps.length],
                ['Avg Attendance', deptEmps.length ? `${(deptEmps.reduce((s, e) => s + e.attendance, 0) / deptEmps.length).toFixed(1)}%` : '—'],
                ['Avg Rating', deptEmps.length ? (deptEmps.reduce((s, e) => s + e.rating, 0) / deptEmps.length).toFixed(1) : '—'],
                ['Open Requirements', deptReqs.filter(r => r.status !== 'Filled').length],
              ]} />
            </section>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
