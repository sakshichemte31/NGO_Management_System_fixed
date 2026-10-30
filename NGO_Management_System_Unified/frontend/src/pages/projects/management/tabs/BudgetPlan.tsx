import Section from '../../../../components/projects/Section';
import DataTable from '../../../../components/projects/DataTable';
import { inr, num } from '../../../../lib/format';
import type { BudgetDetail } from '../../../../types/project';

const tot = (label: string, v: number, span = 1) => <tr><td colSpan={span} className="font-bold">{label}</td><td className="text-right font-bold">{inr(v)}</td></tr>;

/** Salaries (A) + Operations (B) + Assets (C) tables – read-only mirror of the approved plan. */
export default function BudgetPlan({ b }: { b: BudgetDetail }) {
  const s = b.summary;
  const flat = b.staff.flatMap(t => t.positions.map(p => ({ ...p, tier: t.tier })));
  const ops = (type: 'Frequent' | 'Infrequent') => b.operations.filter(o => o.type === type);
  const assets = (type: 'Small' | 'Big') => b.assets.filter(a => a.type === type);
  const opCols = [
    { key: 'n', header: 'Item', render: (o: typeof b.operations[number]) => o.name },
    { key: 'f', header: 'No. of frequency / yr', align: 'right' as const, render: (o: typeof b.operations[number]) => num(o.frequencyPerYear) },
    { key: 'c', header: 'Cost / qty', align: 'right' as const, render: (o: typeof b.operations[number]) => inr(o.costPerQty) },
    { key: 't', header: 'Total', align: 'right' as const, render: (o: typeof b.operations[number]) => <b>{inr(o.total)}</b> },
  ];
  const assetCols = [
    { key: 'n', header: 'Asset', render: (a: typeof b.assets[number]) => a.name },
    { key: 'q', header: 'Qty', align: 'right' as const, render: (a: typeof b.assets[number]) => num(a.qty) },
    { key: 'c', header: 'Cost / qty', align: 'right' as const, render: (a: typeof b.assets[number]) => inr(a.costPerQty) },
    { key: 't', header: 'Total', align: 'right' as const, render: (a: typeof b.assets[number]) => <b>{inr(a.total)}</b> },
  ];
  return (
    <div className="grid xl:grid-cols-3 gap-5">
      <Section title="A · Salaries" flush>
        <DataTable caption="Salaries" rows={flat} rowKey={x => x.id}
          columns={[{ key: 'p', header: 'Position', render: x => <div>{x.position}<div className="text-[11px] text-slate-400">{x.tier}</div></div> }, { key: 'q', header: 'Qty', align: 'right', render: x => x.quantity },
            { key: 'pk', header: 'Package', align: 'right', render: x => inr(x.packagePerYear) }, { key: 't', header: 'Total', align: 'right', render: x => <b>{inr(x.totalSalary)}</b> }]}
          footer={<>{<tr><td colSpan={3} className="font-bold">Total staff</td><td className="text-right font-bold">{num(b.totalStaff)}</td></tr>}{tot('Total Salaries Per Year (A)', s.salariesA, 3)}</>} />
      </Section>
      <Section title="B · Operations" flush>
        <div className="px-5 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Frequent</div>
        <DataTable caption="Frequent operations" rows={ops('Frequent')} rowKey={x => x.id} columns={opCols} emptyTitle="No frequent items" />
        <div className="px-5 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Infrequent</div>
        <DataTable caption="Infrequent operations" rows={ops('Infrequent')} rowKey={x => x.id} columns={opCols} emptyTitle="No infrequent items"
          footer={tot('Total Operations Budget (B)', s.operationsB, 3)} />
      </Section>
      <Section title="C · Assets" flush>
        <div className="px-5 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Small assets</div>
        <DataTable caption="Small assets" rows={assets('Small')} rowKey={x => x.id} columns={assetCols} emptyTitle="No small assets" />
        <div className="px-5 pt-3 text-xs font-bold uppercase tracking-wide text-slate-400">Big assets</div>
        <DataTable caption="Big assets" rows={assets('Big')} rowKey={x => x.id} columns={assetCols} emptyTitle="No big assets"
          footer={tot('Total Assets Budget (C)', s.assetsC, 3)} />
      </Section>
    </div>
  );
}
