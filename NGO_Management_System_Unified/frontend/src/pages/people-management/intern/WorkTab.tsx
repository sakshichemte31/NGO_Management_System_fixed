import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ProgressBar, SelectField, StatusBadge, ACCENT } from '../../../components/people';
import { TASK_STATUSES, type Intern, type Task, type TaskStatus } from './data';

interface Props { interns: Intern[]; tasks: Task[]; onTask: (id: string, s: TaskStatus) => void }

export default function WorkTab({ interns, tasks, onTask }: Props) {
  const [filter, setFilter] = useState('All Interns');
  const shown = filter === 'All Interns' ? tasks : tasks.filter(t => t.internId === interns.find(i => i.name === filter)?.id);
  const projects = Array.from(new Set(interns.map(i => i.project)));
  const name = (id: string) => interns.find(i => i.id === id)?.name ?? id;
  const pct = (id: string) => { const t = tasks.filter(x => x.internId === id); return t.length ? Math.round(t.filter(x => x.status === 'Done').length / t.length * 100) : interns.find(i => i.id === id)?.progress ?? 0; };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card"><div className="card-header"><h2 className="card-title">Projects</h2></div>
          <ul className="card-body flex flex-col gap-3">{projects.map(p => { const who = interns.filter(i => i.project === p); return <li key={p}><div className="text-sm font-semibold text-slate-800">{p}</div><div className="text-xs text-slate-500">{who.map(w => w.name).join(', ')}</div></li>; })}</ul></div>
        <div className="card lg:col-span-2"><div className="card-header"><h2 className="card-title">Progress by Intern</h2></div>
          <ul className="card-body flex flex-col gap-3">{interns.map(i => <li key={i.id}><div className="flex justify-between text-sm mb-1"><span className="font-semibold text-slate-800">{i.name}</span><StatusBadge status={i.status} /></div><ProgressBar value={pct(i.id)} color={ACCENT.intern} /></li>)}</ul></div>
      </div>
      <div className="card">
        <div className="card-header"><h2 className="card-title">Tasks & Task Status</h2><div className="w-52"><SelectField label="Filter by intern" hideLabel value={filter} onChange={setFilter} options={['All Interns', ...interns.map(i => i.name)]} /></div></div>
        <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
          {TASK_STATUSES.map((s, si) => (
            <section key={s} className="rounded-[14px] bg-slate-100/70 p-3 flex flex-col gap-2" aria-label={s}>
              <div className="flex items-center justify-between px-1"><StatusBadge status={s} /><span className="text-xs text-slate-500">{shown.filter(t => t.status === s).length}</span></div>
              {shown.filter(t => t.status === s).map(t => (
                <article key={t.id} className="card p-3 flex items-start justify-between gap-2">
                  <div><div className="text-sm font-semibold text-slate-800">{t.title}</div><div className="text-[11px] text-slate-500">{t.project} · {name(t.internId)}</div></div>
                  {si < 2 && <button className="p-1 rounded hover:bg-teal-50 text-teal-700" aria-label={`Move ${t.title} to ${TASK_STATUSES[si + 1]}`} onClick={() => onTask(t.id, TASK_STATUSES[si + 1])}><ArrowRight size={14} /></button>}
                </article>))}
            </section>))}
        </div>
      </div>
    </div>
  );
}
