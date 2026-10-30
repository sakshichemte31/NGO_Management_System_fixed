import type {
  ActivityLog, ApprovedProposal, ChecklistGroup, DepartmentChecklist, DepartmentKey, DocumentItem, Expense, ImpactEntry,
  Priority, Project, RiskIssue, StageNo, Task, TaskStatus,
} from '../types/project';
import { MOCK_PROJECTS } from './mockProjects';
import { DEPARTMENTS, DEPARTMENT_TEMPLATES } from './departmentTemplates';
import { nid } from './mockBuilders';

/** Fixed "today" for deterministic mock data. */
export const MOCK_TODAY = '2026-10-08';

export interface MockDb {
  projects: Project[];
  tasks: Task[];
  expenses: Expense[];
  checklists: DepartmentChecklist[];
  documents: DocumentItem[];
  impact: ImpactEntry[];
  risks: RiskIssue[];
  activity: ActivityLog[];
  proposals: ApprovedProposal[];
}

const isoDate = (y: number, m: number, d: number): string => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);

/* ───────── Tasks ───────── */
type TaskRow = [title: string, owner: string, dept: DepartmentKey, stage: StageNo, pr: Priority, due: string, st: TaskStatus];
const TASKS: Record<string, TaskRow[]> = {
  'p-001': [
    ['Finalise mid-term assessment tool', 'Ravi Deshmukh', 'mel', 3, 'High', '2026-10-25', 'In Progress'],
    ['Mentor refresher workshop – batch 2', 'Sneha Kulkarni', 'hr', 3, 'Medium', '2026-10-30', 'To Do'],
    ['Submit Q2 utilisation certificate to Infosys Foundation', 'Manoj Gupta', 'finance', 3, 'Critical', '2026-10-15', 'Review'],
    ['Print career guidance booklets', 'Isha Verma', 'marketing', 3, 'Low', '2026-11-05', 'To Do'],
    ['Renew FCRA registration documents', 'Rohit Bhatt', 'admin_legal', 3, 'High', '2026-11-20', 'In Progress'],
    ['Enrol 240 additional students (Cluster C)', 'Priya Sharma', 'operations', 3, 'Medium', '2026-09-30', 'Done'],
    ['Set up data dashboard for attendance', 'Tanvi Shah', 'data_tech', 3, 'Medium', '2026-09-15', 'Done'],
    ['Donor update newsletter', 'Kavya Nair', 'fundraising', 3, 'Low', '2026-10-12', 'Review'],
  ],
  'p-002': [
    ['Complete 16 remaining recharge structures', 'Santosh Jadhav', 'operations', 3, 'Critical', '2026-12-10', 'In Progress'],
    ['Water quality test round 3', 'Kavita More', 'mel', 3, 'High', '2026-10-28', 'To Do'],
    ['Gram Panchayat handover MoU drafts', 'Rohit Bhatt', 'admin_legal', 4, 'Medium', '2026-11-30', 'To Do'],
    ['Procure PVC pipes (tender)', 'Manoj Gupta', 'finance', 3, 'High', '2026-10-18', 'Review'],
    ['Committee training – O&M of structures', 'Kavita More', 'hr', 3, 'Medium', '2026-09-20', 'Done'],
    ['Case-study video shoot', 'Isha Verma', 'marketing', 3, 'Low', '2026-11-10', 'To Do'],
    ['Piezometer readings upload', 'Tanvi Shah', 'data_tech', 3, 'Medium', '2026-10-05', 'Done'],
  ],
  'p-003': [
    ['Stakeholder presentation to Satara ZP', 'Neha Joshi', 'operations', 1, 'High', '2026-11-20', 'In Progress'],
    ['Draft curriculum in Marathi', 'Aditi Phadke', 'mel', 1, 'Medium', '2026-12-15', 'To Do'],
    ['Open project bank account', 'Manoj Gupta', 'finance', 1, 'High', '2026-11-05', 'To Do'],
    ['Sign Google.org grant agreement', 'Rohit Bhatt', 'admin_legal', 1, 'Critical', '2026-10-31', 'Review'],
    ['Needs-assessment report finalised', 'Neha Joshi', 'innovation', 0, 'Medium', '2026-09-30', 'Done'],
  ],
};

/* ───────── Checklist completion per project: admin, hr, mkt, fin, fund, ops, mel, innov, data ───────── */
const COMPLETION: Record<string, number[]> = {
  'p-001': [0.8, 0.7, 0.5, 0.6, 0.55, 0.65, 0.45, 0.3, 0.35],
  'p-002': [0.7, 0.6, 0.4, 0.7, 0.5, 0.8, 0.5, 0.25, 0.3],
  'p-003': [0.35, 0.3, 0.1, 0.2, 0.4, 0.2, 0.1, 0.05, 0.3],
};
const RESPONSIBLE: Record<DepartmentKey, string> = {
  admin_legal: 'Rohit Bhatt', hr: 'Sneha Kulkarni', marketing: 'Isha Verma', finance: 'Manoj Gupta', fundraising: 'Kavya Nair',
  operations: '', mel: 'Deepa Nair', innovation: 'Arjun Rao', data_tech: 'Tanvi Shah',
};

export const buildChecklist = (projectId: string, dept: DepartmentKey, frac: number, managerName: string, priority: number | null): DepartmentChecklist => {
  const meta = DEPARTMENTS.find(d => d.key === dept)!;
  const groups: ChecklistGroup[] = DEPARTMENT_TEMPLATES[dept].map(g => {
    const done = Math.round(g.items.length * frac);
    return { id: nid('grp'), title: g.title, items: g.items.map((label, i) => ({ id: nid('ci'), label, done: i < done })) };
  });
  const all = groups.flatMap(g => g.items);
  return {
    projectId, department: dept, name: meta.name, responsible: RESPONSIBLE[dept] || managerName, priority, groups,
    completion: all.length ? Math.round((all.filter(i => i.done).length / all.length) * 100) : 0,
  };
};

/* ───────── Expenses ───────── */
const genExpenses = (p: Project): Expense[] => {
  if (p.status === 'Upcoming') return [];
  const start = new Date(p.startDate);
  const cutoff = p.status === 'On Hold' ? new Date('2026-06-30') : new Date(Math.min(new Date(p.endDate).getTime(), new Date(MOCK_TODAY).getTime()));
  const elapsed = Math.max(0, (cutoff.getFullYear() - start.getFullYear()) * 12 + cutoff.getMonth() - start.getMonth() + 1);
  const months = Math.min(elapsed, p.durationMonths);
  const out: Expense[] = [];
  const A = p.plan.team.totalSalariesA;
  const push = (i: number, day: number, section: Expense['section'], head: string, description: string, amount: number, paidTo: string) =>
    out.push({ id: nid('ex'), projectId: p.id, date: isoDate(start.getFullYear(), start.getMonth() + i, day), section, head, description, amount: Math.round(amount), paidTo, addedBy: 'Manoj Gupta' });
  for (let i = 0; i < months; i++) {
    push(i, 5, 'Salaries', 'Staff payroll', `Payroll – month ${i + 1}`, (A / 12) * (i < 2 ? 0.6 : 1), 'Project staff');
    p.plan.operations.filter(o => o.type === 'Frequent').forEach(o => {
      if (i < o.frequencyPerYear) push(i, 1, 'Operations', o.name, `${o.name} – month ${i + 1}`, o.costPerQty, 'Vendor');
    });
  }
  p.plan.operations.filter(o => o.type === 'Infrequent').forEach(o => {
    for (let k = 0; k < o.frequencyPerYear; k++) {
      const idx = Math.round(((k + 0.5) * 12) / o.frequencyPerYear);
      if (idx < months) push(idx, 18, 'Operations', o.name, `${o.name} – occurrence ${k + 1}`, o.costPerQty, 'Vendor');
    }
  });
  if (months > 0) p.plan.assets.forEach(a => push(0, 12, 'Assets', a.name, `Purchase of ${a.qty} × ${a.name}`, a.total, 'Supplier'));
  return out;
};

/* ───────── Documents ───────── */
const CATS: DocumentItem['category'][] = ['Statutory', 'Project Related', 'Policy', 'Special Ask'];
export const genDocs = (p: Project, admin: DepartmentChecklist): DocumentItem[] => {
  const docs: DocumentItem[] = [];
  admin.groups.forEach((g, gi) => g.items.forEach((it, i) => {
    const status: DocumentItem['status'] = it.done ? (i % 3 === 0 ? 'Uploaded' : 'Verified') : 'Pending';
    docs.push({
      id: nid('doc'), projectId: p.id, name: it.label, category: CATS[gi], status,
      fileName: status === 'Pending' ? undefined : `${it.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.pdf`,
      uploadedAt: status === 'Pending' ? undefined : p.startDate, uploadedBy: status === 'Pending' ? undefined : p.managerName,
    });
  }));
  const fin = p.status === 'Completed' || p.status === 'Archived';
  docs.push({ id: nid('doc'), projectId: p.id, name: 'MoUs with working partners', category: 'Project Related', status: fin ? 'Verified' : 'Pending', fileName: fin ? 'partner-mous.pdf' : undefined, uploadedAt: fin ? p.startDate : undefined, uploadedBy: fin ? p.managerName : undefined });
  return docs;
};

/* ───────── Risks ───────── */
const RISK_POOL: [string, RiskIssue['type'], RiskIssue['severity'], RiskIssue['status'], string][] = [
  ['Delay in grant tranche release', 'Risk', 'High', 'Open', 'Maintain 2-month operating buffer; escalate to donor liaison.'],
  ['Field staff attrition above 10%', 'Risk', 'Medium', 'Mitigating', 'Retention bonus and mentor wellbeing circles.'],
  ['Data quality gaps in field surveys', 'Issue', 'Medium', 'Mitigating', 'Spot audits and revised digital forms.'],
  ['Monsoon disruption to field schedule', 'Risk', 'Low', 'Open', 'Flexible calendar; front-load critical activities.'],
  ['Local political opposition', 'Risk', 'High', 'Open', 'Early engagement with Gram Panchayats.'],
  ['Late submission of statutory filings', 'Issue', 'Critical', 'Resolved', 'CA retained; compliance calendar introduced.'],
];

/* ───────── Proposals eligible for activation ───────── */
const PROPOSALS: ApprovedProposal[] = [
  { id: 'PR-2026-014', title: 'Kisan Mitra – Climate-Smart Farming Training', sector: 'Livelihood', submittedBy: 'Rahul Mehta', approvedOn: '2026-09-02', planningStatus: 'Complete', planningCompletion: 100, missingSections: [], suggestedManager: 'u-02', templateProjectId: 'p-002' },
  { id: 'PR-2026-016', title: 'Sunehra Kal – Youth Skill Academy', sector: 'Education', submittedBy: 'Anita Patel', approvedOn: '2026-09-18', planningStatus: 'Complete', planningCompletion: 100, missingSections: [], suggestedManager: 'u-03', templateProjectId: 'p-001' },
  { id: 'PR-2026-017', title: 'Aarogya Van – Mobile Health Clinics', sector: 'Health', submittedBy: 'Sunita Roy', approvedOn: '2026-09-25', planningStatus: 'In Progress', planningCompletion: 62, missingSections: ['Operations (B)', 'Assets (C)', 'Funding', 'Responsibility'], suggestedManager: 'u-05' },
];

export function seedDb(): MockDb {
  const projects = structuredClone(MOCK_PROJECTS);
  const tasks: Task[] = [];
  const expenses: Expense[] = [];
  const checklists: DepartmentChecklist[] = [];
  const documents: DocumentItem[] = [];
  const impact: ImpactEntry[] = [];
  const risks: RiskIssue[] = [];
  const activity: ActivityLog[] = [];

  projects.forEach((p, pi) => {
    (TASKS[p.id] ?? []).forEach(([title, owner, department, stage, priority, dueDate, status]) =>
      tasks.push({ id: nid('tk'), projectId: p.id, title, owner, department, stage, priority, dueDate, status }));

    const ex = genExpenses(p);
    expenses.push(...ex);
    p.spent = ex.reduce((s, e) => s + e.amount, 0);

    const fr = COMPLETION[p.id];
    const rank = (d: DepartmentKey): number | null => p.plan.responsibility.find(r => r.department === d)?.rank ?? null;
    const cl = DEPARTMENTS.map((d, i) => buildChecklist(p.id, d.key, fr[i], p.managerName, rank(d.key)));
    checklists.push(...cl);
    documents.push(...genDocs(p, cl[0]));

    const ei = p.plan.expectedImpact;
    [...ei.direct.kpis, ...ei.indirect.kpis, ...ei.societal.kpis].filter(k => k.actual > 0).forEach(k =>
      impact.push({ id: nid('ie'), projectId: p.id, kpiId: k.id, kpiName: k.name, date: p.status === 'Active' ? '2026-09-30' : p.endDate, value: k.actual, source: 'Field survey', note: 'Cumulative reading as of last review', addedBy: p.managerName }));

    const ppl = p.plan.team.members;
    const rs = [0, 1, 2].map(k => RISK_POOL[(pi + k) % RISK_POOL.length]);
    if (p.status !== 'Upcoming') rs.forEach(([title, type, severity, status, mitigation], k) =>
      risks.push({ id: nid('rk'), projectId: p.id, title, type, severity, status: p.status === 'Archived' || p.status === 'Completed' ? 'Closed' : status, owner: ppl[k % ppl.length].name, raisedOn: isoDate(2026, 5 + k, 10 + k), mitigation }));

    activity.push({ id: nid('al'), projectId: p.id, timestamp: `${p.startDate}T09:30:00`, actor: p.managerName, category: 'Status', message: `Project activated from proposal ${p.proposalId}` });
    p.plan.milestones.filter(m => m.status === 'Done').forEach(m =>
      activity.push({ id: nid('al'), projectId: p.id, timestamp: `${m.dueDate}T16:00:00`, actor: m.owner, category: 'Task', message: `Milestone completed: ${m.title}` }));
    ex.slice(-2).forEach(e => activity.push({ id: nid('al'), projectId: p.id, timestamp: `${e.date}T11:15:00`, actor: e.addedBy, category: 'Budget', message: `Expense logged: ${e.description}` }));
    documents.filter(d => d.projectId === p.id && d.status === 'Verified').slice(0, 2).forEach(d =>
      activity.push({ id: nid('al'), projectId: p.id, timestamp: `${p.startDate}T14:00:00`, actor: 'Rohit Bhatt', category: 'Document', message: `Document verified: ${d.name}` }));
  });
  activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { projects, tasks, expenses, checklists, documents, impact, risks, activity, proposals: structuredClone(PROPOSALS) };
}
