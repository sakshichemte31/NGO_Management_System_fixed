import { Target } from 'lucide-react';
import Section from '../../../../components/projects/Section';
import ProgressBar from '../../../../components/projects/ProgressBar';
import KpiCard from '../../../../components/projects/KpiCard';
import { num, pct } from '../../../../lib/format';
import { progressColor } from '../../../../lib/projectUi';
import type { ImpactBlock } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const BLOCKS: { key: 'direct' | 'indirect' | 'societal'; title: string; color: string }[] = [
  { key: 'direct', title: 'Direct Beneficiary Impact', color: '#1AACB8' },
  { key: 'indirect', title: 'Indirect Beneficiary Impact', color: '#6366F1' },
  { key: 'societal', title: 'Societal Impact (Benefit to Society)', color: '#F59E0B' },
];

function Block({ title, color, b }: { title: string; color: string; b: ImpactBlock }) {
  return (
    <Section title={title}>
      <p className="text-sm text-slate-600 mb-4">{b.description}</p>
      <div className="flex flex-col gap-3">
        {b.kpis.map(k => {
          const v = pct(k.actual, k.target);
          return (
            <div key={k.id}>
              <div className="flex items-baseline justify-between gap-2 text-[13px] mb-1">
                <span className="font-semibold text-slate-700">{k.name}</span>
                <span className="text-slate-500 whitespace-nowrap">{num(k.actual)} / {num(k.target)} {k.unit}</span>
              </div>
              <ProgressBar value={v} showLabel color={progressColor(v)} label={`${k.name} progress`} />
            </div>
          );
        })}
        {b.kpis.length === 0 && <span className="text-sm text-slate-400">No KPIs defined.</span>}
      </div>
      <div className="h-0.5 w-10 rounded mt-4" style={{ background: color }} />
    </Section>
  );
}

export default function ObjectivesTab({ project: p }: TabProps) {
  const e = p.plan.expectedImpact, b = p.plan.beneficiary;
  const all = [...e.direct.kpis, ...e.indirect.kpis, ...e.societal.kpis];
  const avg = all.length ? Math.round(all.reduce((s, k) => s + pct(k.actual, k.target), 0) / all.length) : 0;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Project duration" value={`${e.projectDurationMonths} mo`} color="#1AACB8" icon={<Target size={18} />} />
        <KpiCard label="Direct beneficiaries (target)" value={num(b.directNumber)} sub={b.directCategory} color="#10B981" />
        <KpiCard label="Indirect beneficiaries (target)" value={num(b.indirectNumber)} sub={b.indirectCategory} color="#6366F1" />
        <KpiCard label="Avg. KPI achievement" value={`${avg}%`} color={progressColor(avg)} />
      </div>
      <div className="grid lg:grid-cols-3 gap-5">{BLOCKS.map(x => <Block key={x.key} title={x.title} color={x.color} b={e[x.key]} />)}</div>
    </div>
  );
}
