import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Section from '../../../../components/projects/Section';
import Async from '../../../../components/projects/Async';
import KpiCard from '../../../../components/projects/KpiCard';
import ProgressBar from '../../../../components/projects/ProgressBar';
import DataTable from '../../../../components/projects/DataTable';
import Modal from '../../../../components/projects/Modal';
import ConfirmDialog from '../../../../components/projects/ConfirmDialog';
import FormField, { SelectInput, TextInput } from '../../../../components/projects/FormField';
import { Skeleton, SkeletonBlock } from '../../../../components/projects/Skeleton';
import { useToast } from '../../../../components/projects/Toast';
import { useRole } from '../../../../context/RoleContext';
import { useBudget, useExpenses } from '../../../../hooks/useProjectData';
import { addExpense, deleteExpense } from '../../../../services/projectApi';
import { fmtDate, inr, inrCompact, pct, todayISO } from '../../../../lib/format';
import { progressColor } from '../../../../lib/projectUi';
import BudgetPlan from './BudgetPlan';
import FundingPanel from './FundingPanel';
import type { Expense, NewExpense } from '../../../../types/project';
import type { TabProps } from '../tabTypes';

const SECTIONS: Expense['section'][] = ['Salaries', 'Operations', 'Assets'];
const COLORS = ['#1AACB8', '#6366F1', '#F59E0B'];

export default function BudgetTab({ project: p, reload, quick, onQuickHandled }: TabProps) {
  const toast = useToast();
  const { canEdit } = useRole();
  const budget = useBudget(p.id);
  const expenses = useExpenses(p.id);
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState<Expense | null>(null);
  const [filter, setFilter] = useState<'All' | Expense['section']>('All');
  useEffect(() => { if (quick === 'expense' && canEdit) { setAdding(true); onQuickHandled?.(); } }, [quick]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => { await Promise.all([budget.reload(true), expenses.reload(true), reload()]); };
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast.success(ok); await refresh(); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); } };

  return (
    <div className="flex flex-col gap-5">
      <Async state={budget} skeleton={<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>}>{b => {
        const s = b.summary;
        const bar = [{ name: 'Salaries (A)', planned: s.salariesA, actual: s.spentBySection.salaries }, { name: 'Operations (B)', planned: s.operationsB, actual: s.spentBySection.operations }, { name: 'Assets (C)', planned: s.assetsC, actual: s.spentBySection.assets }];
        const donut = bar.map(x => ({ name: x.name, value: x.actual }));
        const util = pct(s.spent, s.total);
        return (<>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Salaries (A)" value={inrCompact(s.salariesA)} sub={inr(s.salariesA)} color="#1AACB8" />
            <KpiCard label="Operations (B)" value={inrCompact(s.operationsB)} sub={inr(s.operationsB)} color="#6366F1" />
            <KpiCard label="Assets (C)" value={inrCompact(s.assetsC)} sub={inr(s.assetsC)} color="#F59E0B" />
            <KpiCard label="Total (A+B+C)" value={inrCompact(s.total)} sub={inr(s.total)} color="#0C2337" />
          </div>
          <Section title="Planned vs Actual vs Remaining">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div><div className="text-xs text-slate-400">Planned</div><div className="text-lg font-bold text-slate-800">{inr(s.total)}</div></div>
              <div><div className="text-xs text-slate-400">Actual spent</div><div className="text-lg font-bold text-teal-600">{inr(s.spent)}</div></div>
              <div><div className="text-xs text-slate-400">Remaining</div><div className={`text-lg font-bold ${s.remaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{inr(s.remaining)}</div></div>
            </div>
            <ProgressBar value={util} showLabel height={10} color={progressColor(100 - util + 40)} label="Budget utilisation" />
            <div className="grid lg:grid-cols-3 gap-5 mt-5">
              <div className="lg:col-span-2 h-64" role="img" aria-label="Planned versus actual spend by section">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={bar}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tickFormatter={v => inrCompact(Number(v))} tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={v => inr(Number(v))} /><Legend /><Bar dataKey="planned" name="Planned" fill="#CBD5E1" radius={[4, 4, 0, 0]} /><Bar dataKey="actual" name="Actual" fill="#1AACB8" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
              </div>
              <div className="h-64" role="img" aria-label="Spend split by section">
                {s.spent === 0 ? <div className="h-full flex items-center justify-center text-sm text-slate-400">No spend recorded yet</div> :
                  <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={donut} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>{donut.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip formatter={v => inr(Number(v))} /><Legend /></PieChart></ResponsiveContainer>}
              </div>
            </div>
          </Section>
          <BudgetPlan b={b} />
          <FundingPanel f={b.funding} total={s.total} />
        </>);
      }}</Async>

      <Section title="Expense Log" flush action={canEdit && <button type="button" className="btn-primary" onClick={() => setAdding(true)}><Plus size={15} /> Add expense</button>}>
        <Async state={expenses} skeleton={<SkeletonBlock />}>{list => {
          const rows = list.filter(e => filter === 'All' || e.section === filter);
          return (<>
            <div className="px-5 py-3 flex gap-2 flex-wrap border-b border-slate-100">
              {(['All', ...SECTIONS] as const).map(s => <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className={`px-3 py-1 rounded-lg text-xs font-semibold border ${filter === s ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-600 border-slate-200'}`}>{s}</button>)}
              <span className="ml-auto text-xs text-slate-400 self-center">{rows.length} entries · {inr(rows.reduce((a, e) => a + e.amount, 0))}</span>
            </div>
            <DataTable caption="Expenses" rows={rows} rowKey={e => e.id} emptyTitle="No expenses recorded" emptyMessage="Logged expenses will appear here."
              columns={[
                { key: 'd', header: 'Date', render: e => <span className="whitespace-nowrap">{fmtDate(e.date)}</span> },
                { key: 's', header: 'Section', render: e => <span className="badge badge-gray">{e.section}</span> },
                { key: 'h', header: 'Head', render: e => <span className="font-semibold">{e.head}</span> }, { key: 'x', header: 'Description', render: e => e.description },
                { key: 'p', header: 'Paid to', render: e => e.paidTo }, { key: 'a', header: 'Amount', align: 'right', render: e => <b>{inr(e.amount)}</b> },
                ...(canEdit ? [{ key: 'del', header: '', render: (e: Expense) => <button type="button" className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`Delete expense ${e.head}`} onClick={() => setDel(e)}><Trash2 size={14} /></button> }] : []),
              ]} />
          </>);
        }}</Async>
      </Section>

      {adding && <ExpenseModal onClose={() => setAdding(false)} onSave={async v => { await run(() => addExpense(p.id, v), 'Expense added'); setAdding(false); }} />}
      <ConfirmDialog open={!!del} title="Delete expense?" danger confirmLabel="Delete" onCancel={() => setDel(null)} message={<>{del && `${inr(del.amount)} – ${del.head}`} will be removed from the log.</>}
        onConfirm={async () => { if (del) await run(() => deleteExpense(p.id, del.id), 'Expense deleted'); setDel(null); }} />
    </div>
  );
}

function ExpenseModal({ onClose, onSave }: { onClose: () => void; onSave: (e: NewExpense) => Promise<void> }) {
  const [f, setF] = useState({ date: todayISO(), section: 'Operations' as Expense['section'], head: '', description: '', amount: '', paidTo: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    const amt = Number(f.amount);
    if (!f.date) e.date = 'Date is required';
    if (!f.head.trim()) e.head = 'Expense head is required';
    if (!f.amount || !(amt > 0)) e.amount = 'Enter an amount greater than 0';
    if (!f.paidTo.trim()) e.paidTo = 'Payee is required';
    setErr(e);
    if (!Object.keys(e).length) void onSave({ date: f.date, section: f.section, head: f.head.trim(), description: f.description.trim() || f.head.trim(), amount: amt, paidTo: f.paidTo.trim() });
  };
  return (
    <Modal open title="Add expense" onClose={onClose} footer={<><button type="button" className="btn-secondary" onClick={onClose}>Cancel</button><button type="button" className="btn-primary" onClick={submit}>Add expense</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Date" required error={err.date}><TextInput type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} invalid={!!err.date} /></FormField>
        <FormField label="Section"><SelectInput value={f.section} onChange={e => setF({ ...f, section: e.target.value as Expense['section'] })}><option value="Salaries">Salaries (A)</option><option value="Operations">Operations (B)</option><option value="Assets">Assets (C)</option></SelectInput></FormField>
        <FormField label="Expense head" required error={err.head}><TextInput value={f.head} onChange={e => setF({ ...f, head: e.target.value })} invalid={!!err.head} placeholder="e.g. Rent" /></FormField>
        <FormField label="Amount (₹)" required error={err.amount}><TextInput type="number" min={0} value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} invalid={!!err.amount} /></FormField>
        <FormField label="Paid to" required error={err.paidTo}><TextInput value={f.paidTo} onChange={e => setF({ ...f, paidTo: e.target.value })} invalid={!!err.paidTo} /></FormField>
        <FormField label="Description"><TextInput value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></FormField>
      </div>
    </Modal>
  );
}
