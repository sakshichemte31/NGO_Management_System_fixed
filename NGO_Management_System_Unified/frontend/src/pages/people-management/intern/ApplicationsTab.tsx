import { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, XCircle } from 'lucide-react';
import { DetailDrawer, EmptyState, InfoGrid, Modal, SectionTitle, StatusBadge, SubTabs, ACCENT } from '../../../components/people';
import { STAGES, type Applicant, type Stage } from './data';

interface Props { applicants: Applicant[]; onMove: (id: string, s: Stage) => void }
const SUB = ['Personal Details', 'Education', 'Skills', 'Resume', 'Application History'];

export default function ApplicationsTab({ applicants, onMove }: Props) {
  const [selId, setSelId] = useState<string | null>(null); const [sub, setSub] = useState(SUB[0]);
  const [pendingMove, setPendingMove] = useState<{ id: string; stage: Stage } | null>(null);
  const sel = applicants.find(a => a.id === selId) ?? null;
  const pendingApplicant = applicants.find(a => a.id === pendingMove?.id) ?? null;
  const idx = (s: Stage) => STAGES.indexOf(s);

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div className="grid gap-4 min-w-[1000px]" style={{ gridTemplateColumns: 'repeat(5, minmax(190px, 1fr))' }}>
          {STAGES.map(stage => {
            const items = applicants.filter(a => a.stage === stage);
            return (
              <section key={stage} className="rounded-[14px] bg-slate-100/70 p-3 flex flex-col gap-3" aria-label={`${stage} column`}>
                <div className="flex items-center justify-between px-1"><StatusBadge status={stage} /><span className="text-xs font-semibold text-slate-500">{items.length}</span></div>
                {items.length === 0 && <EmptyState title="No applicants" />}
                {items.map(a => (
                  <article key={a.id} className="card p-3 flex flex-col gap-2">
                    <button className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded" onClick={() => { setSelId(a.id); setSub(SUB[0]); }}>
                      <div className="text-sm font-semibold text-slate-800 hover:text-primary-dark">{a.name}</div>
                      <div className="text-xs text-slate-500">{a.position}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{a.college}</div>
                    </button>
                    <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
                      <button className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30" disabled={idx(a.stage) === 0 || a.stage === 'Rejected'} aria-label={`Move ${a.name} back`} onClick={() => setPendingMove({ id: a.id, stage: STAGES[idx(a.stage) - 1] })}><ArrowLeft size={14} /></button>
                      <button className="p-1 rounded hover:bg-teal-50 text-teal-700 disabled:opacity-30" disabled={idx(a.stage) >= 3} aria-label={`Move ${a.name} to next stage`} onClick={() => setPendingMove({ id: a.id, stage: STAGES[idx(a.stage) + 1] })}><ArrowRight size={14} /></button>
                      <button className="ml-auto p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-30" disabled={a.stage === 'Rejected' || a.stage === 'Selected'} aria-label={`Reject ${a.name}`} onClick={() => setPendingMove({ id: a.id, stage: 'Rejected' })}><XCircle size={14} /></button>
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </div>

      <Modal
        open={!!pendingMove && !!pendingApplicant}
        onClose={() => setPendingMove(null)}
        title={pendingMove?.stage === 'Selected' ? 'Confirm selection' : 'Confirm stage change'}
        submitLabel={pendingMove?.stage === 'Selected' ? 'Confirm & add intern' : 'Confirm change'}
        onSubmit={() => {
          if (pendingMove && pendingApplicant) onMove(pendingMove.id, pendingMove.stage);
          setPendingMove(null);
        }}
      >
        {pendingMove && pendingApplicant && <div className="col-span-1 sm:col-span-2 text-sm leading-6 text-slate-600">
          <p>Are you sure you want to move <span className="font-semibold text-slate-800">{pendingApplicant.name}</span> from <span className="font-semibold text-slate-800">{pendingApplicant.stage}</span> to <span className="font-semibold text-slate-800">{pendingMove.stage}</span>?</p>
          {pendingMove.stage === 'Selected' && <div className="mt-3">
            <p>If an intern profile does not already exist for this email, this will create an active profile with:</p>
            <ul className="mt-1 list-disc pl-5">
              <li>Project: Onboarding</li>
              <li>Mentor: To be assigned</li>
              <li>Start and end dates: TBD</li>
            </ul>
          </div>}
        </div>}
      </Modal>

      <DetailDrawer open={!!sel} onClose={() => setSelId(null)} title={sel?.name ?? ''} subtitle={sel ? `${sel.id} · ${sel.position}` : ''} accent={ACCENT.intern}>
        {sel && (<>
          <div className="mb-4"><StatusBadge status={sel.stage} /></div>
          <SubTabs tabs={SUB} active={sub} onChange={setSub} accent={ACCENT.intern} />
          {sub === 'Personal Details' && <InfoGrid items={[['Name', sel.name], ['Email', sel.email], ['Phone', sel.phone], ['Applied for', sel.position], ['Department', sel.dept], ['Applied on', sel.appliedOn]]} />}
          {sub === 'Education' && <InfoGrid items={[['College', sel.college], ['Degree', sel.degree], ['Graduation year', sel.gradYear], ['CGPA', sel.cgpa]]} />}
          {sub === 'Skills' && <div className="flex flex-wrap gap-2">{sel.skills.map(s => <span key={s} className="badge badge-teal">{s}</span>)}</div>}
          {sub === 'Resume' && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
              <div><div className="text-sm font-semibold text-slate-800">{sel.resume}</div><div className="text-xs text-slate-500">PDF · uploaded {sel.appliedOn}</div></div>
              <button className="btn-secondary" onClick={() => { const u = URL.createObjectURL(new Blob([`Resume of ${sel.name}\n${sel.college} — ${sel.degree}\nSkills: ${sel.skills.join(', ')}`], { type: 'text/plain' })); const a = document.createElement('a'); a.href = u; a.download = sel.resume.replace('.pdf', '.txt'); a.click(); URL.revokeObjectURL(u); }}><Download size={14} /> Download</button>
            </div>)}
          {sub === 'Application History' && (<><SectionTitle>Timeline</SectionTitle><ol className="border-l-2 border-slate-200 pl-4 flex flex-col gap-4">{sel.history.map((h, i) => <li key={i}><div className="text-sm text-slate-800">{h.event}</div><div className="text-xs text-slate-400">{h.date}</div></li>)}</ol></>)}
        </>)}
      </DetailDrawer>
    </>
  );
}
