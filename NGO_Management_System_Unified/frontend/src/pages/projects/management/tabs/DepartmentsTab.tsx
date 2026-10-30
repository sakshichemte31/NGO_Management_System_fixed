import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Section from '../../../../components/projects/Section';
import Async from '../../../../components/projects/Async';
import ProgressBar from '../../../../components/projects/ProgressBar';
import KpiCard from '../../../../components/projects/KpiCard';
import { SkeletonBlock } from '../../../../components/projects/Skeleton';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { useDepartments } from '../../../../hooks/useProjectData';
import { updateChecklistItem, updateDepartment } from '../../../../services/projectApi';
import { DEPARTMENTS } from '../../../../data/departmentTemplates';
import { progressColor } from '../../../../lib/projectUi';
import type { DepartmentChecklist } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

export default function DepartmentsTab({ project: p }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const state = useDepartments(p.id);
  const [open, setOpen] = useState<string | null>(null);
  const [resp, setResp] = useState<Record<string, string>>({});
  const run = async (fn: () => Promise<unknown>) => { try { await fn(); await state.reload(true); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } };

  return (
    <Async state={state} skeleton={<SkeletonBlock h="h-96" />}>{list => {
      const items = list.flatMap(d => d.groups.flatMap(g => g.items));
      const overall = items.length ? Math.round((items.filter(i => i.done).length / items.length) * 100) : 0;
      const ranked = Array.from({ length: 7 }, (_, i) => ({ rank: i + 1, dept: list.find(d => d.priority === i + 1) }));
      const meta = (d: DepartmentChecklist) => DEPARTMENTS.find(x => x.key === d.department)!;
      return (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Overall readiness" value={`${overall}%`} color={progressColor(overall)} />
            <KpiCard label="Checklist items done" value={`${items.filter(i => i.done).length} / ${items.length}`} color="#1AACB8" />
            <KpiCard label="Departments ≥ 75%" value={list.filter(d => d.completion >= 75).length} color="#10B981" sub="of 9" />
            <KpiCard label="Departments < 40%" value={list.filter(d => d.completion < 40).length} color="#EF4444" sub="need attention" />
          </div>

          <Section title="Responsibility – Department Prioritisation (1–7)">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {ranked.map(r => (
                <div key={r.rank} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Department {r.rank}</div>
                  <div className="text-sm font-semibold text-slate-700 mt-1">{r.dept?.name ?? <span className="text-slate-300">Unassigned</span>}</div>
                  {r.dept && <div className="text-xs text-slate-400">{r.dept.completion}% complete</div>}
                </div>
              ))}
            </div>
          </Section>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {list.map(d => {
              const m = meta(d), isOpen = open === d.department, all = d.groups.flatMap(g => g.items);
              return (
                <section key={d.department} className="card flex flex-col" aria-label={d.name}>
                  <div className="card-header !items-start" style={{ borderTop: `3px solid ${m.color}`, borderRadius: '14px 14px 0 0' }}>
                    <div><h3 className="card-title">{d.name}</h3><div className="text-xs text-slate-400 mt-0.5">{all.filter(i => i.done).length} of {all.length} items</div></div>
                    <span className="badge" style={{ background: m.bg, color: m.color }}>{d.completion}%</span>
                  </div>
                  <div className="card-body flex flex-col gap-3 flex-1">
                    <ProgressBar value={d.completion} color={m.color} label={`${d.name} completion`} />
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="form-label !mb-1 !text-[11px]" htmlFor={`r-${d.department}`}>Responsible</label>
                        <input id={`r-${d.department}`} className="form-input !py-1.5 !text-xs" disabled={!canEdit} value={resp[d.department] ?? d.responsible}
                          onChange={e => setResp({ ...resp, [d.department]: e.target.value })}
                          onBlur={() => { const v = (resp[d.department] ?? d.responsible).trim(); if (v && v !== d.responsible) void run(async () => { await updateDepartment(p.id, d.department, { responsible: v }); toast.success('Responsible person updated'); }); else setResp(r => { const n = { ...r }; delete n[d.department]; return n; }); }} /></div>
                      <div><label className="form-label !mb-1 !text-[11px]" htmlFor={`p-${d.department}`}>Priority</label>
                        <select id={`p-${d.department}`} className="form-input !py-1.5 !text-xs" disabled={!canEdit} value={d.priority ?? ''}
                          onChange={e => void run(async () => { await updateDepartment(p.id, d.department, { priority: e.target.value ? Number(e.target.value) : null }); toast.success('Priority updated'); })}>
                          <option value="">None</option>{[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>Department {n}</option>)}</select></div>
                    </div>
                    <button type="button" className="btn-secondary justify-center" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : d.department)}>
                      {isOpen ? <>Hide checklist <ChevronUp size={14} /></> : <>Open checklist <ChevronDown size={14} /></>}</button>
                    {isOpen && (
                      <div className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-1">
                        {d.groups.map(g => (
                          <fieldset key={g.id}>
                            <legend className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{g.title} ({g.items.filter(i => i.done).length}/{g.items.length})</legend>
                            <ul className="flex flex-col gap-1">
                              {g.items.map(i => (
                                <li key={i.id}><label className="flex items-start gap-2 text-[13px] text-slate-700 py-0.5 cursor-pointer">
                                  <input type="checkbox" className="mt-0.5 accent-teal-500" checked={i.done} disabled={!canEdit} onChange={e => void run(() => updateChecklistItem(p.id, d.department, i.id, e.target.checked))} />
                                  <span className={i.done ? 'line-through text-slate-400' : ''}>{i.label}</span></label></li>
                              ))}
                            </ul>
                          </fieldset>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      );
    }}</Async>
  );
}
