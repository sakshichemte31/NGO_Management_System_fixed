import Section from '../../../../components/projects/Section';
import StatusBadge from '../../../../components/projects/StatusBadge';
import { inr } from '../../../../lib/format';
import type { FundingPlan, FundingSource } from '../../../../types/project';

function Priority({ n, list }: { n: number; list: FundingSource[] }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Priority {n}</div>
      {list.length === 0 && <div className="text-sm text-slate-400">No source identified.</div>}
      {list.map(s => (
        <div key={s.id} className="flex items-start justify-between gap-2 text-sm"><div><div className="font-semibold text-slate-700">{s.name}</div><div className="text-xs text-slate-400">{inr(s.amount)}</div></div><StatusBadge status={s.status} /></div>
      ))}
    </div>
  );
}

export default function FundingPanel({ f, total }: { f: FundingPlan; total: number }) {
  const secured = [...f.priority1, ...f.priority2, ...f.priority3].filter(s => s.status === 'Committed' || s.status === 'Received').reduce((a, s) => a + s.amount, 0);
  const List = ({ title, items }: { title: string; items: string[] }) => (
    <div><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">{title}</div><ul className="text-sm text-slate-600 list-disc pl-4">{items.map(i => <li key={i}>{i}</li>)}{items.length === 0 && <li className="list-none -ml-4 text-slate-400">—</li>}</ul></div>
  );
  return (
    <Section title="Funding Plan" action={<span className="text-xs text-slate-500">Assumed annual budget <b className="text-slate-700">{inr(f.assumedAnnualBudget)}</b> · Secured <b className="text-emerald-600">{inr(secured)}</b> of {inr(total)}</span>}>
      <div className="grid md:grid-cols-3 gap-4"><Priority n={1} list={f.priority1} /><Priority n={2} list={f.priority2} /><Priority n={3} list={f.priority3} /></div>
      <div className="grid lg:grid-cols-3 gap-5 mt-5">
        <div className="rounded-xl bg-teal-50 border border-teal-100 p-4"><div className="text-[11px] font-bold uppercase tracking-wide text-teal-700 mb-1">Public Call of Action</div><p className="text-sm text-slate-700">{f.publicCallOfAction || '—'}</p></div>
        <div><div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Potential donors by revenue stream</div>
          <div className="flex flex-col gap-2">{f.potentialDonors.map(d => <div key={d.stream} className="text-sm"><span className="badge badge-purple mr-2">{d.stream}</span><span className="text-slate-600">{d.donors.join(', ')}</span></div>)}</div></div>
        <div className="grid grid-cols-3 gap-3"><List title="Material" items={f.sponsorship.material} /><List title="Event" items={f.sponsorship.event} /><List title="Marketing" items={f.sponsorship.marketing} /></div>
      </div>
    </Section>
  );
}
