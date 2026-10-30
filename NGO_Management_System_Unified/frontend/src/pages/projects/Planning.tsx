import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Target, Users, DollarSign, MapPin, BarChart2, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  completePlanning, getPlanning, listApprovedForPlanning, savePlanning,
  type PlanningData, type ProposalRecord,
} from '../../services/proposalApi';

const sectionStyle: Record<string, { icon: React.ReactNode; color: string }> = {
  overview: { icon: <Target size={18} />, color: '#1AACB8' },
  beneficiary: { icon: <Users size={18} />, color: '#6366F1' },
  impact: { icon: <BarChart2 size={18} />, color: '#10B981' },
  stages: { icon: <MapPin size={18} />, color: '#F59E0B' },
  hr: { icon: <Users size={18} />, color: '#EC4899' },
  operations: { icon: <Briefcase size={18} />, color: '#8B5CF6' },
  budget: { icon: <DollarSign size={18} />, color: '#14B8A6' },
};
const LABELS: Record<string, string> = {
  projectName: 'Project Name', visionMission: 'Vision & Mission', sdgGoals: 'SDG Goals', duration: 'Project Duration',
  location: 'Location/Geography', implementingTeam: 'Implementing Team', primaryBeneficiaries: 'Primary Beneficiaries',
  secondaryBeneficiaries: 'Secondary Beneficiaries', estimatedCount: 'Estimated Count', selectionCriteria: 'Selection Criteria',
  beneficiaryNeeds: 'Beneficiary Needs', directImpact: 'Direct Beneficiary Impact', indirectImpact: 'Indirect Beneficiary Impact',
  societalImpact: 'Societal Impact', longTermOutcomes: 'Long-term Outcomes', phase1: 'Phase 1 Description', phase2: 'Phase 2 Description',
  phase3: 'Phase 3 Description', milestones: 'Milestones', timeline: 'Timeline', teamLead: 'Team Lead', staffAssigned: 'Staff Assigned',
  volunteersRequired: 'Number of Volunteers Required', volunteerRoles: 'Volunteer Roles / Skills Needed', externalConsultants: 'External Consultants', trainingNeeds: 'Training Needs',
  venueSite: 'Venue/Site', equipmentNeeded: 'Equipment Needed', logisticsPlan: 'Logistics Plan', transportation: 'Transportation',
  totalEstimatedHours: 'Total Estimated Hours', personnelCosts: 'Personnel Costs', materialCosts: 'Material Costs',
  operationalCosts: 'Operational Costs', fundingSources: 'Funding Sources', contingencyReserve: 'Contingency Reserve',
};
const LONG = /phase|impact|outcomes|milestones|needs|criteria|mission|plan$|volunteerRoles/i;

export default function PlanningPage() {
  const { user } = useAuth();
  // Only Project Managers build the plan; Admins and others can view it.
  const canWrite = user?.role === 'Project Manager';
  const [params, setParams] = useSearchParams();
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [selected, setSelected] = useState(params.get('proposal') ?? '');
  const [plan, setPlan] = useState<PlanningData | null>(null);
  const [draft, setDraft] = useState<Record<string, Record<string, string>>>({});
  const [deptDraft, setDeptDraft] = useState<Record<string, { responsible: string; notes: string }>>({});
  const [activeSection, setActiveSection] = useState(0);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const apply = (data: PlanningData) => {
    setPlan(data);
    setDraft(data.sections);
    setDeptDraft(Object.fromEntries(data.departments.map(d => [d.id, { responsible: d.responsible, notes: d.notes }])));
  };

  useEffect(() => {
    void (async () => {
      try {
        const result = await listApprovedForPlanning();
        setProposals(result.items);
        setSelected(current => (result.items.some(p => p.id === current) ? current : result.items[0]?.id ?? ''));
      } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load approved proposals.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const loadPlan = useCallback(async (id: string) => {
    if (!id) { setPlan(null); return; }
    try { apply(await getPlanning(id)); setError(''); }
    catch (e) { setPlan(null); setError(e instanceof Error ? e.message : 'Unable to load the plan.'); }
  }, []);

  useEffect(() => { setNotice(''); setActiveSection(0); setActiveDept(null); void loadPlan(selected); }, [selected, loadPlan]);

  const keys = plan ? Object.keys(plan.sectionMeta) : [];
  const key = keys[activeSection];
  const meta = plan && key ? plan.sectionMeta[key] : null;
  const style = key ? sectionStyle[key] : sectionStyle.overview;
  const completed = plan?.planningStatus === 'Complete';

  const persist = async (message: string) => {
    if (!selected) return false;
    setBusy(true); setError(''); setNotice('');
    try {
      apply(await savePlanning(selected, { sections: draft, departments: deptDraft }));
      setNotice(message);
      const refreshed = await listApprovedForPlanning();
      setProposals(refreshed.items);
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); return false; }
    finally { setBusy(false); }
  };

  const saveAndContinue = async () => {
    const last = activeSection === keys.length - 1;
    if (await persist(last ? 'Plan saved.' : `${meta?.title} saved.`) && !last) setActiveSection(s => s + 1);
  };

  const finalise = async () => {
    if (!(await persist('Plan saved.'))) return;
    setBusy(true); setError(''); setNotice('');
    try {
      apply(await completePlanning(selected));
      setNotice('Final project plan completed. The project is ready for activation.');
      setProposals((await listApprovedForPlanning()).items);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to finalise the plan.'); }
    finally { setBusy(false); }
  };

  const pickProposal = (id: string) => { setSelected(id); setParams(id ? { proposal: id } : {}); };
  const setField = (field: string, value: string) => key && setDraft(d => ({ ...d, [key]: { ...d[key], [field]: value } }));
  const dept = plan?.departments.find(d => d.id === activeDept);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="page-title">Detailed Project Planning</h1>
        <p className="page-subtitle">Build comprehensive project plans after proposal approval</p>
      </div>
      {!canWrite && (
        <div role="note" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Detailed plans are prepared by Project Managers. You have view-only access.
        </div>
      )}

      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}
      {loading && <p className="text-sm text-slate-500">Loading approved proposals...</p>}

      {!loading && proposals.length === 0 && (
        <div className="card"><div className="card-body text-sm text-slate-600">
          No approved proposals yet. Detailed planning starts once a proposal is approved. <Link to="/projects/proposals" className="font-semibold" style={{ color: '#1AACB8' }}>Go to Proposals</Link>
        </div></div>
      )}

      {proposals.length > 0 && (
        <div className="card">
          <div className="card-body flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="form-label mb-0" htmlFor="planning-proposal">Project:</label>
              <select id="planning-proposal" className="form-input w-72" value={selected} onChange={e => pickProposal(e.target.value)}>
                {proposals.map(p => <option key={p.id} value={p.id}>{p.title} ({p.proposalCode})</option>)}
              </select>
            </div>
            <span className="badge badge-green">Proposal Approved ✓</span>
            {plan && <span className={`badge ${completed ? 'badge-teal' : 'badge-yellow'}`}>Plan: {plan.planningStatus}</span>}
            {plan && <span className="badge badge-blue">Volunteers needed: {draft.hr?.volunteersRequired?.trim() || 'not set'}</span>}
          </div>
        </div>
      )}

      {plan && meta && key && (
        <>
          <div className="card overflow-x-auto">
            <div className="card-body flex items-center gap-1 min-w-max">
              {keys.map((k, i) => (
                <button key={k} onClick={() => setActiveSection(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${i === activeSection ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
                  style={i === activeSection ? { background: style.color, borderColor: style.color } : {}}>
                  {plan.completion[k] === 100 && <span className={i === activeSection ? 'text-white' : 'text-green-500'}>✓</span>}
                  <span>{i + 1}. {plan.sectionMeta[k].title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl text-white" style={{ background: style.color }}>{style.icon}</div>
                <span className="card-title">{meta.title}</span>
              </div>
              <div className="text-xs text-slate-400">Section {activeSection + 1} of {keys.length} · {plan.completion[key]}% of required fields</div>
            </div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
              {meta.fields.map(field => {
                const required = meta.required.includes(field);
                const id = `plan-${key}-${field}`;
                const label = <label className="form-label" htmlFor={id}>{LABELS[field] ?? field}{required && <span className="text-red-500"> *</span>}</label>;
                const value = draft[key]?.[field] ?? '';
                return (
                  <div key={field} className={LONG.test(field) ? 'md:col-span-2' : ''}>
                    {label}
                    {LONG.test(field)
                      ? <textarea id={id} className="form-input h-20 resize-none" disabled={!canWrite} maxLength={5000} placeholder={`Enter ${(LABELS[field] ?? field).toLowerCase()}...`} value={value} onChange={e => setField(field, e.target.value)} />
                      : <input id={id} className="form-input" disabled={!canWrite} maxLength={5000}
                          type={field === 'volunteersRequired' ? 'number' : 'text'} min={field === 'volunteersRequired' ? 0 : undefined} step={field === 'volunteersRequired' ? 1 : undefined} placeholder={`Enter ${(LABELS[field] ?? field).toLowerCase()}...`} value={value} onChange={e => setField(field, e.target.value)} />}
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <button className="btn-secondary" onClick={() => setActiveSection(s => Math.max(0, s - 1))} disabled={activeSection === 0}>← Previous</button>
              {canWrite && (
                <div className="flex gap-3">
                  <button className="btn-primary" disabled={busy} onClick={() => void saveAndContinue()}>
                    {busy ? 'Saving…' : activeSection === keys.length - 1 ? 'Save Plan' : 'Save & Continue →'}
                  </button>
                  {activeSection === keys.length - 1 && !completed && (
                    <button className="btn-primary" disabled={busy} onClick={() => void finalise()}>Finalise Plan</button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Department / Responsibility Areas</span>
              <span className="text-xs text-slate-400">{plan.departments.length} Departments</span>
            </div>
            <div className="card-body grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {plan.departments.map(d => (
                <button key={d.id} type="button" onClick={() => setActiveDept(activeDept === d.id ? null : d.id)}
                  className={`border rounded-xl p-3 text-center transition-all ${activeDept === d.id ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-teal-50'}`}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: '#E6F7F9' }}><Briefcase size={14} style={{ color: '#1AACB8' }} /></div>
                  <div className="text-xs font-semibold text-slate-700">{d.name}</div>
                  <div className="text-[11px] text-slate-400 mt-1">{deptDraft[d.id]?.responsible || 'Unassigned'}</div>
                </button>
              ))}
            </div>
            {dept && (
              <div className="px-6 pb-5 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="form-label" htmlFor="dept-responsible">Responsible person — {dept.name}</label>
                  <input id="dept-responsible" className="form-input" disabled={!canWrite} maxLength={1000} value={deptDraft[dept.id]?.responsible ?? ''}
                    onChange={e => setDeptDraft(d => ({ ...d, [dept.id]: { ...d[dept.id], responsible: e.target.value } }))} />
                </div>
                <div>
                  <label className="form-label" htmlFor="dept-notes">Notes</label>
                  <input id="dept-notes" className="form-input" disabled={!canWrite} maxLength={1000} value={deptDraft[dept.id]?.notes ?? ''}
                    onChange={e => setDeptDraft(d => ({ ...d, [dept.id]: { ...d[dept.id], notes: e.target.value } }))} />
                </div>
                {canWrite && <div className="md:col-span-2"><button className="btn-secondary" disabled={busy} onClick={() => void persist(`${dept.name} saved.`)}>Save Department</button></div>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
