import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createProposal, deleteProposal, listProposals, transitionProposal,
  type ProposalRecord, type ProposalStatus,
} from '../../services/proposalApi';

const statusStyle: Record<string, string> = {
  'Under Review': 'badge badge-yellow', 'Financial Review': 'badge badge-blue', Submitted: 'badge badge-teal',
  Approved: 'badge badge-green', Draft: 'badge badge-gray', Rejected: 'badge badge-red', Withdrawn: 'badge badge-gray',
};
const statusIcons: Record<string, React.ReactNode> = {
  Approved: <CheckCircle2 size={14} className="text-green-500" />, Rejected: <XCircle size={14} className="text-red-500" />,
  'Under Review': <Clock size={14} className="text-yellow-500" />, 'Financial Review': <Clock size={14} className="text-blue-500" />,
  Submitted: <Clock size={14} className="text-teal-500" />, Draft: <FileText size={14} className="text-slate-400" />,
  Withdrawn: <FileText size={14} className="text-slate-400" />,
};
const priorityStyle: Record<string, string> = { High: 'badge badge-red', Medium: 'badge badge-yellow', Low: 'badge badge-gray' };
const lifecycle = ['Draft', 'Submitted', 'Under Review', 'Financial Review', 'Approved/Rejected', 'Planning Starts'];
const lifecycleIndex: Record<string, number> = { Draft: 0, Submitted: 1, 'Under Review': 2, 'Financial Review': 3, Approved: 4, Rejected: 4, Withdrawn: 0 };
const tabs = ['All', 'Draft', 'Submitted', 'Under Review', 'Financial Review', 'Approved', 'Rejected'] as const;
const money = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
const fmt = (iso: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const emptyForm = { title: '', category: '', estimatedBudget: '', expectedBeneficiaries: '', startDate: '', endDate: '', summary: '', geography: '', priority: 'Medium' as 'High' | 'Medium' | 'Low' };

export default function ProposalsPage() {
  const { user } = useAuth();
  // Project Managers create/submit proposals; only Admins review, approve or reject them.
  const canWrite = user?.role === 'Project Manager';
  const mine = (p: ProposalRecord) => canWrite && p.submittedBy === user?.id;
  const canReview = user?.role === 'Admin';
  const [activeStatus, setActiveStatus] = useState<(typeof tabs)[number]>('All');
  const [search, setSearch] = useState('');
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [rejecting, setRejecting] = useState<{ id: string; title: string; notes: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await listProposals({ status: activeStatus, search: search.trim() || undefined });
      setProposals(result.items);
      setCounts(result.counts);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load proposals.');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setError(''); setNotice('');
    try { await action(); setNotice(success); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); }
  };
  const move = (p: ProposalRecord, status: ProposalStatus, success: string) => run(() => transitionProposal(p.id, status), success);

  const submitProposal = async (event: FormEvent<HTMLFormElement>, asDraft = false) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      await createProposal({ ...form, estimatedBudget: Number(form.estimatedBudget), submit: !asDraft });
      setForm(emptyForm); setShowForm(false);
      setNotice(asDraft ? 'Draft saved.' : 'Proposal submitted for review.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save the proposal.');
    } finally { setSaving(false); }
  };

  const field = (key: keyof typeof emptyForm, label: string, opts: { type?: string; placeholder?: string } = {}) => (
    <div key={key}>
      <label className="form-label" htmlFor={`proposal-${key}`}>{label}</label>
      <input id={`proposal-${key}`} required type={opts.type ?? 'text'} className="form-input" placeholder={opts.placeholder}
        min={opts.type === 'number' ? '1' : key === 'endDate' ? form.startDate : undefined}
        value={form[key]} onChange={e => setForm(c => ({ ...c, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Project Proposals</h1>
          <p className="page-subtitle">
            {canWrite ? 'Create and submit proposals — an Admin reviews and approves them' : canReview ? 'Review, approve or reject proposals submitted by Project Managers' : 'View project proposals (read-only)'}
          </p>
        </div>
        {canWrite && <button className="btn-primary" onClick={() => setShowForm(s => !s)}><Plus size={16} /> New Proposal</button>}
      </div>

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      <div className="card">
        <div className="card-body">
          <p className="text-xs text-slate-500 font-semibold mb-3">Proposal Lifecycle</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {lifecycle.map((step, i) => (
              <div key={step} className="flex items-center gap-1 flex-shrink-0">
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${i === (lifecycleIndex[activeStatus] ?? -1) ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                  style={i === (lifecycleIndex[activeStatus] ?? -1) ? { background: '#1AACB8' } : {}}>{step}</div>
                {i < lifecycle.length - 1 && <span className="text-slate-300 text-xs">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Create New Proposal</span>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-sm" aria-label="Close form">✕</button>
          </div>
          <form className="card-body grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={e => void submitProposal(e)}>
            {field('title', 'Project Title', { placeholder: 'e.g. Mobile Health Clinic' })}
            {field('category', 'Category', { placeholder: 'Health / Education / Social...' })}
            {field('estimatedBudget', 'Estimated Budget (₹)', { type: 'number', placeholder: '0' })}
            {field('expectedBeneficiaries', 'Expected Beneficiaries', { placeholder: 'e.g. 500 people' })}
            {field('startDate', 'Start Date', { type: 'date' })}
            {field('endDate', 'End Date', { type: 'date' })}
            <div>
              <label className="form-label" htmlFor="proposal-priority">Priority</label>
              <select id="proposal-priority" className="form-input" value={form.priority} onChange={e => setForm(c => ({ ...c, priority: e.target.value as typeof form.priority }))}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="proposal-geography">Geographic Focus Area</label>
              <input id="proposal-geography" className="form-input" placeholder="States / cities / rural areas" value={form.geography} onChange={e => setForm(c => ({ ...c, geography: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label" htmlFor="proposal-summary">Project Overview</label>
              <textarea id="proposal-summary" className="form-input h-24 resize-none" placeholder="Describe the project objective and expected outcomes..." value={form.summary} onChange={e => setForm(c => ({ ...c, summary: e.target.value }))} />
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="button" className="btn-secondary" disabled={saving}
                onClick={e => { const f = (e.currentTarget.closest('form') as HTMLFormElement); if (f.reportValidity()) void submitProposal({ preventDefault() {} } as FormEvent<HTMLFormElement>, true); }}>Save as Draft</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Submit Proposal'}</button>
            </div>
          </form>
        </div>
      )}

      {rejecting && (
        <div className="card">
          <div className="card-header"><span className="card-title">Reject “{rejecting.title}”</span></div>
          <form className="card-body flex flex-col gap-3" onSubmit={e => {
            e.preventDefault();
            const target = rejecting;
            setRejecting(null);
            void run(() => transitionProposal(target.id, 'Rejected', target.notes), 'Proposal rejected.');
          }}>
            <label className="form-label" htmlFor="reject-notes">Reason (required)</label>
            <textarea id="reject-notes" required className="form-input h-20 resize-none" value={rejecting.notes} onChange={e => setRejecting({ ...rejecting, notes: e.target.value })} />
            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => setRejecting(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Confirm Rejection</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="tab-bar w-fit max-w-full overflow-x-auto">
          {tabs.map(s => (
            <button key={s} className={`tab-item ${activeStatus === s ? 'active' : ''}`} onClick={() => setActiveStatus(s)}>
              {s}{s !== 'All' && counts[s] ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
        <input className="form-input max-w-xs" placeholder="Search proposals..." aria-label="Search proposals" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading && <p className="text-sm text-slate-500">Loading proposals...</p>}
      {!loading && proposals.length === 0 && !error && <p className="text-sm text-slate-500">No proposals found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {proposals.map(p => (
          <div key={p.id} className="card hover:shadow-md transition-shadow">
            <div className="card-body flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">{statusIcons[p.status]}<span className={statusStyle[p.status]}>{p.status}</span></div>
                <span className={priorityStyle[p.priority]}>{p.priority}</span>
              </div>
              <div>
                <div className="font-bold text-slate-800 text-sm leading-snug" style={{ fontFamily: 'Nunito, sans-serif' }}>{p.title}</div>
                <div className="text-xs text-slate-400 mt-1">{p.proposalCode} · {p.category}</div>
                {p.startDate && p.endDate && <div className="text-xs text-slate-500 mt-1">{fmt(p.startDate)} – {fmt(p.endDate)}</div>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Budget</div><div className="font-bold text-slate-700">{money(p.estimatedBudget)}</div></div>
                <div className="bg-slate-50 rounded-lg p-2"><div className="text-slate-400">Impact</div><div className="font-bold text-slate-700">{p.expectedBeneficiaries || '—'}</div></div>
                {p.status === 'Approved' && (
                  <div className="bg-slate-50 rounded-lg p-2 col-span-2"><div className="text-slate-400">Volunteers required (from plan)</div>
                    <div className="font-bold text-slate-700">{p.volunteersRequired ?? 'Not planned yet'}</div></div>
                )}
              </div>
              {p.reviewNotes && ['Rejected', 'Approved'].includes(p.status) && <p className="text-xs text-slate-500">Note: {p.reviewNotes}</p>}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>By: {p.submittedByName ?? 'Unknown'}</span><span>{fmt(p.createdAt)}</span>
              </div>
              <div className="flex gap-2 pt-1 flex-wrap">
                {p.status === 'Draft' && mine(p) && <button className="btn-primary flex-1 text-xs py-1.5" onClick={() => void move(p, 'Submitted', 'Proposal submitted.')}>Submit</button>}
                {p.status === 'Draft' && mine(p) && <button className="btn-secondary text-xs py-1.5" onClick={() => void run(() => deleteProposal(p.id), 'Draft deleted.')}>Delete</button>}
                {p.status === 'Submitted' && canReview && <button className="btn-secondary flex-1 text-xs py-1.5" onClick={() => void move(p, 'Under Review', 'Review started.')}>Start Review</button>}
                {p.status === 'Under Review' && canReview && <button className="btn-secondary flex-1 text-xs py-1.5" onClick={() => void move(p, 'Financial Review', 'Moved to financial review.')}>Financial Review</button>}
                {['Under Review', 'Financial Review'].includes(p.status) && canReview && (
                  <>
                    <button className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100" onClick={() => void move(p, 'Approved', 'Proposal approved. The Project Manager can now start detailed planning.')}>Approve</button>
                    <button className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" onClick={() => setRejecting({ id: p.id, title: p.title, notes: '' })}>Reject</button>
                  </>
                )}
                {p.status === 'Submitted' && canReview && <button className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" onClick={() => setRejecting({ id: p.id, title: p.title, notes: '' })}>Reject</button>}
                {['Submitted', 'Under Review'].includes(p.status) && mine(p) && <button className="btn-secondary text-xs py-1.5" onClick={() => void move(p, 'Withdrawn', 'Proposal withdrawn.')}>Withdraw</button>}
                {['Rejected', 'Withdrawn'].includes(p.status) && mine(p) && <button className="btn-secondary flex-1 text-xs py-1.5" onClick={() => void move(p, 'Draft', 'Proposal reopened as a draft.')}>Reopen as Draft</button>}
                {p.status === 'Approved' && <Link to={`/projects/planning?proposal=${p.id}`} className="btn-primary flex-1 text-xs py-1.5 text-center">{p.planningStatus === 'Complete' || !canWrite ? 'View Plan' : 'Start Planning'}</Link>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
