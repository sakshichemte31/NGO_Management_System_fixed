import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, Rocket } from 'lucide-react';
import { useEligibleProposals, useManagers } from '../../../hooks/useProjects';
import { createProjectFromProposal } from '../../../services/projectApi';
import { useRole } from '../../../context/RoleContext';
import { useToast } from '../../../components/projects/Toast';
import Async from '../../../components/projects/Async';
import Section, { Field } from '../../../components/projects/Section';
import StatusBadge from '../../../components/projects/StatusBadge';
import ProgressBar from '../../../components/projects/ProgressBar';
import ConfirmDialog from '../../../components/projects/ConfirmDialog';
import EmptyState from '../../../components/projects/EmptyState';
import FormField, { SelectInput, TextInput } from '../../../components/projects/FormField';
import RoleSwitcher from '../../../components/projects/RoleSwitcher';
import { SkeletonTable } from '../../../components/projects/Skeleton';
import { fmtDate, inr, num, todayISO } from '../../../lib/format';
import type { ApprovedProposal } from '../../../types/project';

const CHECKS = [
  ['plan_locked', 'Final Project Plan reviewed and locked'], ['budget', 'Budget (A + B + C) confirmed with Finance'], ['team', 'Core team and project manager identified'],
  ['funding', 'Priority 1 funding source confirmed'], ['docs', 'Statutory documents (12A / 80G, FCRA) verified'], ['stakeholders', 'Key stakeholders informed of start date'],
] as const;

export default function CreateProject() {
  const nav = useNavigate();
  const toast = useToast();
  const { isAdmin: canEdit } = useRole();
  const proposals = useEligibleProposals();
  const managers = useManagers().data ?? [];
  const [sel, setSel] = useState<ApprovedProposal | null>(null);
  const [startDate, setStartDate] = useState(todayISO());
  const [managerId, setManagerId] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const choose = (p: ApprovedProposal) => { setSel(p); setManagerId(p.suggestedManager); setChecked([]); setErr({}); };
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!startDate) e.startDate = 'Start date is required';
    if (!managerId) e.managerId = 'Select a project manager';
    if (checked.length < CHECKS.length) e.checklist = 'Complete every item in the activation checklist';
    setErr(e);
    return Object.keys(e).length === 0;
  };
  const activate = async () => {
    if (!sel) return;
    setBusy(true);
    try { const p = await createProjectFromProposal(sel.id, { startDate, managerId, checklist: checked }); toast.success(`“${p.name}” activated`); nav(`/projects/${p.id}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Activation failed'); setConfirm(false); } finally { setBusy(false); }
  };

  if (!canEdit) return (
    <div className="card"><EmptyState icon={<Lock size={22} />} title="Only Admins can activate projects" message="Project Managers create proposals and plans; an Admin activates them." action={<div className="flex gap-2 items-center"><RoleSwitcher /><Link to="/projects" className="btn-secondary">Back</Link></div>} /></div>
  );
  const s = sel?.summary;

  return (
    <div className="flex flex-col gap-5">
      <div className="page-header !mb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="page-title">Activate Project</h1><p className="page-subtitle">Only approved proposals with a completed Final Project Plan can be activated</p></div>
        <RoleSwitcher />
      </div>

      <div className="grid xl:grid-cols-5 gap-5">
        <Section className="xl:col-span-2 self-start" title="Approved proposals" flush>
          <Async state={proposals} skeleton={<SkeletonTable rows={4} />}>{list => list.length === 0
            ? <EmptyState title="No approved proposals waiting" message="Approved proposals appear here after approval." />
            : <ul className="divide-y divide-slate-100">{list.map(p => {
              const locked = p.planningStatus !== 'Complete', on = sel?.id === p.id;
              return (
                <li key={p.id}>
                  <button type="button" disabled={locked} aria-pressed={on} onClick={() => choose(p)} className={`w-full text-left px-5 py-4 flex gap-3 ${on ? 'bg-teal-50' : locked ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
                    <span className={`mt-0.5 ${locked ? 'text-slate-400' : on ? 'text-teal-600' : 'text-emerald-500'}`}>{locked ? <Lock size={18} /> : <CheckCircle2 size={18} />}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-800 text-sm">{p.title}</span><StatusBadge status={p.planningStatus} /></span>
                      <span className="block text-xs text-slate-400 mt-0.5">{p.id} · {p.sector} · approved {fmtDate(p.approvedOn)}</span>
                      <span className="block mt-2"><ProgressBar value={p.planningCompletion} showLabel color={locked ? '#F59E0B' : '#10B981'} label={`${p.title} planning`} /></span>
                      {locked && <span className="block text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2"><Lock size={11} className="inline -mt-0.5 mr-1" />Locked – finish Detailed Planning first{p.missingSections.length ? `. Missing: ${p.missingSections.join(', ')}` : ''}. <Link className="underline font-semibold" to="/projects/planning" onClick={e => e.stopPropagation()}>Go to Planning</Link></span>}
                    </span>
                  </button>
                </li>
              );
            })}</ul>}</Async>
        </Section>

        <div className="xl:col-span-3 flex flex-col gap-5">
          {!sel || !s ? <div className="card"><EmptyState icon={<Rocket size={22} />} title="Select a proposal" message="Choose an unlocked proposal to review its planning summary and activate it." /></div> : (<>
            <Section title={`Planning summary · ${sel.title}`} action={<span className="badge badge-gray">Read-only</span>}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <Field label="Total budget (A+B+C)"><b>{inr(s.totalBudget)}</b></Field><Field label="Salaries (A)">{inr(s.salariesA)}</Field><Field label="Operations (B)">{inr(s.operationsB)}</Field><Field label="Assets (C)">{inr(s.assetsC)}</Field>
                <Field label="Duration">{s.durationMonths} months</Field><Field label="Staff / volunteers">{num(s.totalStaff)} / {num(s.totalVolunteers)}</Field>
                <Field label="Direct beneficiaries">{num(s.directBeneficiaries)}</Field><Field label="Indirect beneficiaries">{num(s.indirectBeneficiaries)}</Field>
                <Field label="Stages planned">{s.stages} (Stage 0–5)</Field><Field label="Departments planned">{s.departments}</Field><Field label="Submitted by">{sel.submittedBy}</Field><Field label="Approved on">{fmtDate(sel.approvedOn)}</Field>
              </div>
            </Section>
            <Section title="Activation details">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Project start date" required error={err.startDate}><TextInput type="date" value={startDate} onChange={e => setStartDate(e.target.value)} invalid={!!err.startDate} /></FormField>
                <FormField label="Project manager" required error={err.managerId}><SelectInput value={managerId} onChange={e => setManagerId(e.target.value)} invalid={!!err.managerId}><option value="">Select…</option>{managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</SelectInput></FormField>
              </div>
              <fieldset className="mt-5"><legend className="form-label">Activation checklist <span className="text-red-500">*</span></legend>
                <div className="flex flex-col gap-1.5">{CHECKS.map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input type="checkbox" className="accent-teal-500" checked={checked.includes(k)} onChange={e => setChecked(e.target.checked ? [...checked, k] : checked.filter(x => x !== k))} />{label}</label>))}</div>
                {err.checklist && <p role="alert" className="text-xs text-red-600 mt-1.5">{err.checklist}</p>}
              </fieldset>
              <div className="flex justify-end mt-5"><button type="button" className="btn-primary" onClick={() => validate() && setConfirm(true)}><Rocket size={15} /> Activate Project</button></div>
            </Section>
          </>)}
        </div>
      </div>

      <ConfirmDialog open={confirm} title="Activate this project?" busy={busy} confirmLabel="Activate" onCancel={() => setConfirm(false)} onConfirm={activate}
        message={<>“{sel?.title}” will be created with its approved plan, starting <b>{fmtDate(startDate)}</b> under <b>{managers.find(m => m.id === managerId)?.name}</b>. The plan sections become the baseline for execution and monitoring.</>} />
    </div>
  );
}
